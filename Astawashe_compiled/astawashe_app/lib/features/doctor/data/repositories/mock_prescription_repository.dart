import '../../domain/models/doctor_models.dart';
import '../../domain/repositories/prescription_repository.dart';

class MockPrescriptionRepository implements PrescriptionRepository {
  final List<Prescription> _prescriptions = [
    Prescription(
      id: 'rx-1',
      patientId: 'p-amina',
      patientName: 'Amina Tesfaye',
      doctorId: 'doctor-001',
      medicationName: 'Metformin',
      strength: '500mg',
      dosage: '1 tablet',
      frequency: 'Once daily (morning)',
      startDate: DateTime.now().subtract(const Duration(days: 30)),
      endDate: DateTime.now().add(const Duration(days: 60)),
      notes: 'Take with food to reduce GI upset.',
      status: 'ACTIVE',
    ),
    Prescription(
      id: 'rx-2',
      patientId: 'p-amina',
      patientName: 'Amina Tesfaye',
      doctorId: 'doctor-001',
      medicationName: 'Vitamin D',
      strength: '1000 IU',
      dosage: '1 capsule',
      frequency: 'Once daily (afternoon)',
      startDate: DateTime.now().subtract(const Duration(days: 20)),
      notes: 'For low vitamin D levels.',
      status: 'ACTIVE',
    ),
    Prescription(
      id: 'rx-3',
      patientId: 'p-amina',
      patientName: 'Amina Tesfaye',
      doctorId: 'doctor-001',
      medicationName: 'Atorvastatin',
      strength: '20mg',
      dosage: '1 tablet',
      frequency: 'Once daily (evening)',
      startDate: DateTime.now().subtract(const Duration(days: 15)),
      notes: 'Lipid control.',
      status: 'ACTIVE',
    ),
    Prescription(
      id: 'rx-4',
      patientId: 'p-sara',
      patientName: 'Sara Mohamed',
      doctorId: 'doctor-001',
      medicationName: 'Paracetamol',
      strength: '500mg',
      dosage: '1 tablet',
      frequency: 'As needed for fever/headache',
      startDate: DateTime.now().subtract(const Duration(days: 5)),
      notes: 'Max 3 tablets per day.',
      status: 'ACTIVE',
    ),
  ];

  @override
  Future<List<Prescription>> getPrescriptions({
    String? doctorId,
    String? patientId,
  }) async {
    await Future.delayed(const Duration(milliseconds: 200));
    var list = List<Prescription>.from(_prescriptions);
    if (patientId != null && patientId.isNotEmpty) {
      list = list.where((rx) => rx.patientId == patientId).toList();
    }
    return list;
  }

  @override
  Future<Prescription> createPrescription(Prescription prescription) async {
    await Future.delayed(const Duration(milliseconds: 250));
    _prescriptions.insert(0, prescription);
    return prescription;
  }

  @override
  Future<void> updatePrescriptionStatus(String id, String status) async {
    await Future.delayed(const Duration(milliseconds: 150));
    final index = _prescriptions.indexWhere((rx) => rx.id == id);
    if (index >= 0) {
      final old = _prescriptions[index];
      _prescriptions[index] = Prescription(
        id: old.id,
        patientId: old.patientId,
        patientName: old.patientName,
        doctorId: old.doctorId,
        medicationName: old.medicationName,
        strength: old.strength,
        dosage: old.dosage,
        frequency: old.frequency,
        startDate: old.startDate,
        endDate: old.endDate,
        notes: old.notes,
        status: status,
      );
    }
  }
}
