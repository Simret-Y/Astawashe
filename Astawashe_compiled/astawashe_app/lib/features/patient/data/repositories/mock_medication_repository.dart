import '../../domain/models/patient_models.dart';
import '../../domain/repositories/medication_repository.dart';

class MockMedicationRepository implements MedicationRepository {
  final List<Medication> _medications = [
    const Medication(
      id: 'med-1',
      patientId: 'patient-001',
      doctorId: 'doctor-001',
      name: 'Paracetamol 500mg',
      dosage: '1 tablet (500mg)',
      form: 'tablet',
      instructions:
          'Take 1 tablet after breakfast with water. For headache and mild pain relief.',
      isActive: true,
      pillColor: '0xFF10B981',
      pillBgColor: '0xFFD1FAE5',
    ),
    const Medication(
      id: 'med-2',
      patientId: 'patient-001',
      doctorId: 'doctor-001',
      name: 'Vitamin D',
      dosage: '1 capsule (1000 IU)',
      form: 'capsule',
      instructions:
          'Take 1 capsule daily after lunch. Supports bone strength and immune health.',
      isActive: true,
      pillColor: '0xFF06B6D4',
      pillBgColor: '0xFFCFFAFE',
    ),
    const Medication(
      id: 'med-3',
      patientId: 'patient-001',
      doctorId: 'doctor-001',
      name: 'Metformin 500mg',
      dosage: '1 tablet (500mg)',
      form: 'tablet',
      instructions:
          'Take 1 tablet with dinner. Helps regulate blood sugar levels.',
      isActive: true,
      pillColor: '0xFF8B5CF6',
      pillBgColor: '0xFFF3E8FF',
    ),
    const Medication(
      id: 'med-4',
      patientId: 'patient-001',
      doctorId: 'doctor-001',
      name: 'Atorvastatin 20mg',
      dosage: '1 tablet (20mg)',
      form: 'tablet',
      instructions:
          'Take 1 tablet at night before bedtime. For cholesterol management.',
      isActive: true,
      pillColor: '0xFFF59E0B',
      pillBgColor: '0xFFFEF3C7',
    ),
  ];

  @override
  Future<List<Medication>> getPatientMedications(String patientId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _medications
        .where((m) => m.patientId == patientId || patientId == 'all')
        .toList();
  }

  @override
  Future<Medication?> getMedicationById(String medicationId) async {
    await Future.delayed(const Duration(milliseconds: 150));
    try {
      return _medications.firstWhere((m) => m.id == medicationId);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<List<MedicationSchedule>> getSchedules(String patientId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    final now = DateTime.now();
    return [
      MedicationSchedule(
        id: 'sched-1',
        patientId: patientId,
        doctorId: 'doctor-001',
        medicationId: 'med-1',
        medicationName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        time: '10:00 AM',
        frequency: 'Daily morning',
        startDate: now.subtract(const Duration(days: 14)),
      ),
      MedicationSchedule(
        id: 'sched-2',
        patientId: patientId,
        doctorId: 'doctor-001',
        medicationId: 'med-2',
        medicationName: 'Vitamin D',
        dosage: '1 tablet',
        time: '02:00 PM',
        frequency: 'Daily afternoon',
        startDate: now.subtract(const Duration(days: 30)),
      ),
      MedicationSchedule(
        id: 'sched-3',
        patientId: patientId,
        doctorId: 'doctor-001',
        medicationId: 'med-3',
        medicationName: 'Metformin 500mg',
        dosage: '1 tablet',
        time: '08:00 PM',
        frequency: 'Daily evening',
        startDate: now.subtract(const Duration(days: 60)),
      ),
    ];
  }
}
