import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/network/dio_client.dart';
import '../models/patient_models.dart';
import '../../data/repositories/mock_dose_repository.dart';
import '../../data/repositories/remote_dose_repository.dart';

abstract class DoseRepository {
  Future<List<DoseLog>> getTodayDoses(String patientId);
  Future<List<DoseLog>> getDosesForDate(String patientId, DateTime date);
  Future<DoseLog> markDoseStatus({
    required String doseId,
    required String status,
    String? confirmationMethod,
  });
  Future<void> snoozeDose(String doseId, Duration duration);
  Future<Map<String, dynamic>> getAdherenceStats(String patientId);
  Future<DoseLog?> getNextDose(String patientId);
}

final doseRepositoryProvider = Provider<DoseRepository>((ref) {
  if (AppConfig.useMock) {
    return MockDoseRepository();
  } else {
    final dio = ref.watch(dioProvider);
    return RemoteDoseRepository(dio: dio);
  }
});
