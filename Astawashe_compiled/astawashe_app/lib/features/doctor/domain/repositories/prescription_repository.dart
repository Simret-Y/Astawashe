import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/network/dio_client.dart';
import '../models/doctor_models.dart';
import '../../data/repositories/mock_prescription_repository.dart';
import '../../data/repositories/remote_prescription_repository.dart';

abstract class PrescriptionRepository {
  Future<List<Prescription>> getPrescriptions({
    String? doctorId,
    String? patientId,
  });
  Future<Prescription> createPrescription(Prescription prescription);
  Future<void> updatePrescriptionStatus(String id, String status);
}

final prescriptionRepositoryProvider = Provider<PrescriptionRepository>((ref) {
  if (AppConfig.useMock) {
    return MockPrescriptionRepository();
  } else {
    final dio = ref.watch(dioProvider);
    return RemotePrescriptionRepository(dio: dio);
  }
});
