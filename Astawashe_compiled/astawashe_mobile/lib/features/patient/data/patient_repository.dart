import 'package:dio/dio.dart';

import '../../../core/network/dio_client.dart';

class PatientRepository {
  PatientRepository({AppDioClient? client})
    : _dio = (client ?? AppDioClient()).dio;

  final Dio _dio;

  Future<Map<String, dynamic>> loadDashboard() async {
    final response = await _dio.get('/dashboards/patient');
    return _data(response.data);
  }

  Future<void> recordDose({
    required String scheduleId,
    required String status,
  }) async {
    await _dio.post(
      '/adherence/record-dose',
      data: {'scheduleId': scheduleId, 'status': status, 'method': 'APP'},
    );
  }

  Future<Map<String, dynamic>> triggerDemoReminder({String? patientId}) async {
    final response = await _dio.post(
      '/reminders/demo/trigger',
      data: {
        if (patientId != null && patientId.isNotEmpty) 'patientId': patientId,
      },
    );
    return _data(response.data);
  }

  Future<void> respondToDemoReminder({
    required String patientId,
    required String scheduleId,
    required String response,
  }) async {
    await _dio.post(
      '/reminders/demo/respond',
      data: {
        'patientId': patientId,
        'scheduleId': scheduleId,
        'response': response,
      },
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
