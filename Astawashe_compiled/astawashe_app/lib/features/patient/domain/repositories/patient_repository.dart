import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:astawashe_app/core/config/app_config.dart';
import 'package:astawashe_app/core/network/dio_client.dart';
import 'package:astawashe_app/features/patient/domain/models/patient_models.dart';
import 'package:astawashe_app/features/doctor/domain/models/doctor_models.dart';
import 'package:astawashe_app/features/patient/data/repositories/mock_patient_repository.dart';
import 'package:astawashe_app/features/patient/data/repositories/remote_patient_repository.dart';

abstract class PatientRepository {
  Future<PatientProfile> getProfile(String patientId);
  Future<PatientDashboardData> getDashboardData(String patientId);
  Future<void> updateReminderMode(String patientId, String reminderMode);
  Future<List<Guardian>> getGuardians(String patientId);
  Future<Guardian> addGuardian(String patientId, Guardian guardian);

  // Doctor side patient data
  Future<List<PatientSummary>> getDoctorPatients({
    String? query,
    String? filter,
  });
  Future<PatientSummary?> getPatientDetail(String patientId);
  Future<DoctorDashboardData> getDoctorDashboard(String doctorId);
  Future<List<PatientApprovalRequest>> getPendingRequests(String doctorId);
  Future<void> handleApprovalRequest(String requestId, String action);
}

final patientRepositoryProvider = Provider<PatientRepository>((ref) {
  if (AppConfig.useMock) {
    return MockPatientRepository();
  } else {
    final dio = ref.watch(dioProvider);
    return RemotePatientRepository(dio: dio);
  }
});
