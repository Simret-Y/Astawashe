import 'package:dio/dio.dart';
import '../../domain/models/patient_models.dart';
import '../../domain/repositories/dose_repository.dart';

class RemoteDoseRepository implements DoseRepository {
  final Dio dio;

  RemoteDoseRepository({required this.dio});

  DoseLog _mapToDoseLog(Map<String, dynamic> json, [String? defaultPatientId]) {
    final schedule = json['schedule'] as Map<String, dynamic>?;
    final med = schedule?['medication'] as Map<String, dynamic>?;

    final id = json['id']?.toString() ?? json['scheduleId']?.toString() ?? '';
    final pId = json['patientId']?.toString() ?? defaultPatientId ?? '';
    final sId = json['scheduleId']?.toString() ?? json['id']?.toString() ?? '';
    final medName =
        json['medicationName']?.toString() ??
        json['medication']?.toString() ??
        med?['name']?.toString() ??
        'Medication';
    final dosage =
        json['dosage']?.toString() ??
        schedule?['dosage']?.toString() ??
        '1 dose';
    final time =
        json['scheduledTime']?.toString() ??
        json['time']?.toString() ??
        schedule?['time']?.toString() ??
        '08:00 AM';
    final status = (json['status'] ?? json['doseStatus'] ?? 'pending')
        .toString()
        .toLowerCase();

    DateTime scheduledDate;
    if (json['scheduledDate'] != null) {
      scheduledDate =
          DateTime.tryParse(json['scheduledDate'].toString())?.toLocal() ??
          DateTime.now();
    } else {
      scheduledDate = DateTime.now();
    }

    DateTime? confirmedAt;
    if (json['confirmedAt'] != null) {
      confirmedAt = DateTime.tryParse(
        json['confirmedAt'].toString(),
      )?.toLocal();
    }

    return DoseLog(
      id: id,
      patientId: pId,
      scheduleId: sId,
      medicationName: medName,
      dosage: dosage,
      scheduledTime: time,
      scheduledDate: scheduledDate,
      status: status,
      confirmationMethod: json['confirmationMethod']?.toString(),
      confirmedAt: confirmedAt,
      notes: json['notes']?.toString(),
    );
  }

  @override
  Future<List<DoseLog>> getTodayDoses(String patientId) async {
    try {
      // Primary source: patient dashboard provides today's schedules with dose status
      final response = await dio.get('/dashboards/patient');
      final data = response.data['data'] as Map<String, dynamic>? ?? {};
      final todaySchedules =
          data['today']?['schedules'] as List<dynamic>? ?? [];

      if (todaySchedules.isNotEmpty) {
        return todaySchedules
            .map((e) => _mapToDoseLog(e as Map<String, dynamic>, patientId))
            .toList();
      }
    } catch (_) {}

    // Fallback: adherence history
    try {
      final response = await dio.get(
        '/adherence/my/history',
        queryParameters: {'limit': 20},
      );
      final data = response.data['data'] as List<dynamic>? ?? [];
      final today = DateTime.now();
      return data
          .map((e) => _mapToDoseLog(e as Map<String, dynamic>, patientId))
          .where(
            (d) =>
                d.scheduledDate.year == today.year &&
                d.scheduledDate.month == today.month &&
                d.scheduledDate.day == today.day,
          )
          .toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<List<DoseLog>> getDosesForDate(String patientId, DateTime date) async {
    final today = DateTime.now();
    if (date.year == today.year &&
        date.month == today.month &&
        date.day == today.day) {
      return getTodayDoses(patientId);
    }

    final dateStr =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    final response = await dio.get(
      '/adherence/my/history',
      queryParameters: {'date': dateStr, 'limit': 50},
    );
    final data = response.data['data'] as List<dynamic>? ?? [];
    return data
        .map((e) => _mapToDoseLog(e as Map<String, dynamic>, patientId))
        .toList();
  }

  @override
  Future<DoseLog> markDoseStatus({
    required String doseId,
    required String status,
    String? confirmationMethod,
  }) async {
    final isTaken = status.toLowerCase() == 'taken';
    final response = await dio.post(
      '/reminders/demo/respond',
      data: {
        'scheduleId': doseId,
        'response': isTaken ? '1' : '2',
        'confirmationMethod': confirmationMethod ?? 'manual',
      },
    );

    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final doseLogJson = data['doseLog'] as Map<String, dynamic>? ?? data;

    return _mapToDoseLog(doseLogJson);
  }

  @override
  Future<void> snoozeDose(String doseId, Duration duration) async {
    await dio.post(
      '/reminders/demo/snooze',
      data: {'scheduleId': doseId, 'durationMinutes': duration.inMinutes},
    );
  }

  @override
  Future<Map<String, dynamic>> getAdherenceStats(String patientId) async {
    final response = await dio.get('/adherence/my/weekly');
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  @override
  Future<DoseLog?> getNextDose(String patientId) async {
    final list = await getTodayDoses(patientId);
    if (list.isEmpty) return null;
    return list.firstWhere((d) => d.isPending, orElse: () => list.first);
  }
}
