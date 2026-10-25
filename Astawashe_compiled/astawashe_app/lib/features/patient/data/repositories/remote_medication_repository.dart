import 'package:dio/dio.dart';
import '../../domain/models/patient_models.dart';
import '../../domain/repositories/medication_repository.dart';

class RemoteMedicationRepository implements MedicationRepository {
  final Dio dio;

  RemoteMedicationRepository({required this.dio});

  @override
  Future<List<Medication>> getPatientMedications(String patientId) async {
    try {
      final response = await dio.get('/medications/my/medications');
      final list = response.data['data'] as List<dynamic>? ?? [];
      return list
          .map((e) => Medication.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      // Fallback: try querying /medications?patientId=$patientId
      try {
        final response = await dio.get(
          '/medications',
          queryParameters: {'patientId': patientId},
        );
        final list = response.data['data'] as List<dynamic>? ?? [];
        return list
            .map((e) => Medication.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {
        return [];
      }
    }
  }

  @override
  Future<Medication?> getMedicationById(String medicationId) async {
    try {
      final response = await dio.get('/medications/$medicationId');
      if (response.data['data'] != null) {
        return Medication.fromJson(
          response.data['data'] as Map<String, dynamic>,
        );
      }
    } catch (_) {}
    return null;
  }

  @override
  Future<List<MedicationSchedule>> getSchedules(String patientId) async {
    try {
      final response = await dio.get('/medications/my/schedules');
      final list = response.data['data'] as List<dynamic>? ?? [];
      return list.map((e) {
        final map = e as Map<String, dynamic>;
        final medName =
            map['medicationName']?.toString() ??
            map['medication']?['name']?.toString() ??
            'Medication';
        return MedicationSchedule(
          id: map['id']?.toString() ?? '',
          patientId: map['patientId']?.toString() ?? patientId,
          doctorId: map['doctorId']?.toString() ?? '',
          medicationId: map['medicationId']?.toString() ?? '',
          medicationName: medName,
          dosage: map['dosage']?.toString() ?? '1 dose',
          time: map['time']?.toString() ?? '08:00 AM',
          frequency: map['frequency']?.toString() ?? 'Daily',
          startDate: map['startDate'] != null
              ? DateTime.tryParse(map['startDate'].toString()) ?? DateTime.now()
              : DateTime.now(),
          endDate: map['endDate'] != null
              ? DateTime.tryParse(map['endDate'].toString())
              : null,
          isActive: (map['isActive'] as bool?) ?? true,
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }
}
