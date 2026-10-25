import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/network/dio_client.dart';
import '../models/patient_models.dart';
import '../../data/repositories/mock_medication_repository.dart';
import '../../data/repositories/remote_medication_repository.dart';

abstract class MedicationRepository {
  Future<List<Medication>> getPatientMedications(String patientId);
  Future<Medication?> getMedicationById(String medicationId);
  Future<List<MedicationSchedule>> getSchedules(String patientId);
}

final medicationRepositoryProvider = Provider<MedicationRepository>((ref) {
  if (AppConfig.useMock) {
    return MockMedicationRepository();
  } else {
    final dio = ref.watch(dioProvider);
    return RemoteMedicationRepository(dio: dio);
  }
});
