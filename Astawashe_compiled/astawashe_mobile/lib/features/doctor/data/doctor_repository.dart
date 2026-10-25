import 'package:dio/dio.dart';

import '../../../core/network/dio_client.dart';

class DoctorRepository {
  DoctorRepository({AppDioClient? client})
    : _dio = (client ?? AppDioClient()).dio;

  final Dio _dio;

  Future<Map<String, dynamic>> loadDashboard() async {
    final response = await _dio.get('/dashboards/doctor');
    return _data(response.data);
  }

  Future<List<Map<String, dynamic>>> loadPendingPatients() async {
    final response = await _dio.get('/approvals/doctor/patients/pending');
    final envelope = response.data;
    if (envelope is! Map || envelope['data'] is! List) return const [];
    return (envelope['data'] as List)
        .whereType<Map>()
        .map((patient) => Map<String, dynamic>.from(patient))
        .toList();
  }

  Future<void> reviewPatient({
    required String patientId,
    required String action,
    String? nickname,
    String? reason,
  }) async {
    await _dio.post(
      '/approvals/doctor/patients/$patientId/approve',
      data: {
        'action': action,
        if (action == 'APPROVE') 'nickname': nickname,
        'reason':
            reason ??
            (action == 'APPROVE' ? 'Approved by doctor' : 'Rejected by doctor'),
      },
    );
  }

  Future<void> updateReminderMode({
    required String patientId,
    required String mode,
  }) async {
    await _dio.patch(
      '/patients/$patientId/reminder-mode',
      data: {'reminderMode': mode},
    );
  }

  Map<String, dynamic> _data(dynamic raw) {
    final map = raw is Map
        ? Map<String, dynamic>.from(raw)
        : <String, dynamic>{};
    final data = map['data'];
    return data is Map ? Map<String, dynamic>.from(data) : map;
  }
}
