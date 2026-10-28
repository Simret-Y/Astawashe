import 'package:flutter_test/flutter_test.dart';
import 'package:astawashe_app/features/doctor/domain/models/doctor_models.dart';
import 'package:astawashe_app/features/doctor/data/repositories/mock_prescription_repository.dart';
import 'package:astawashe_app/features/doctor/data/repositories/mock_message_repository.dart';

void main() {
  group('MockPrescriptionRepository', () {
    late MockPrescriptionRepository repo;

    setUp(() {
      repo = MockPrescriptionRepository();
    });

    test('getPrescriptions returns list of prescriptions', () async {
      final prescriptions = await repo.getPrescriptions();
      expect(prescriptions, isNotEmpty);
      expect(prescriptions.first.medicationName, 'Metformin');
    });

    test('getPrescriptions filters by patientId', () async {
      final prescriptions = await repo.getPrescriptions(patientId: 'p-amina');
      expect(prescriptions.every((rx) => rx.patientId == 'p-amina'), true);
    });

    test('createPrescription adds new prescription', () async {
      final newRx = Prescription(
        id: 'rx-new',
        patientId: 'p-test',
        patientName: 'Test Patient',
        doctorId: 'doctor-001',
        medicationName: 'Test Med',
        strength: '100mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        startDate: DateTime.now(),
      );

      final created = await repo.createPrescription(newRx);
      expect(created.medicationName, 'Test Med');

      final allPrescriptions = await repo.getPrescriptions();
      expect(allPrescriptions.first.medicationName, 'Test Med');
    });

    test('updatePrescriptionStatus changes status', () async {
      await repo.updatePrescriptionStatus('rx-1', 'COMPLETED');
      final prescriptions = await repo.getPrescriptions();
      final rx = prescriptions.firstWhere((r) => r.id == 'rx-1');
      expect(rx.status, 'COMPLETED');
    });
  });

  group('MockMessageRepository', () {
    late MockMessageRepository repo;

    setUp(() {
      repo = MockMessageRepository();
    });

    test('getConversations returns list of conversations', () async {
      final conversations = await repo.getConversations('doctor-001');
      expect(conversations, isNotEmpty);
      expect(conversations.first.otherUserName, 'Amina Tesfaye');
    });

    test('getMessages returns messages for conversation', () async {
      final messages = await repo.getMessages('conv-amina');
      expect(messages, isNotEmpty);
      expect(messages.first.senderRole, 'PATIENT');
    });

    test('sendMessage adds new message', () async {
      final sent = await repo.sendMessage(
        senderId: 'doctor-001',
        senderName: 'Dr. Ahmed',
        senderRole: 'DOCTOR',
        recipientId: 'p-amina',
        recipientName: 'Amina Tesfaye',
        message: 'Test message',
      );
      expect(sent.message, 'Test message');
      expect(sent.senderRole, 'DOCTOR');
    });
  });

  group('DoctorModels', () {
    test('PatientSummary isOnTrack calculation', () {
      final patient = PatientSummary(
        id: 'p1',
        name: 'Test',
        age: 30,
        gender: 'F',
        adherenceRate: 85.0,
        activeMedsCount: 2,
        status: 'on_track',
      );
      expect(patient.isOnTrack, true);
      expect(patient.needsAttention, false);
      expect(patient.isHighRisk, false);
    });

    test('PatientSummary needsAttention calculation', () {
      final patient = PatientSummary(
        id: 'p1',
        name: 'Test',
        age: 30,
        gender: 'F',
        adherenceRate: 70.0,
        activeMedsCount: 2,
        status: 'needs_attention',
      );
      expect(patient.isOnTrack, false);
      expect(patient.needsAttention, true);
      expect(patient.isHighRisk, false);
    });

    test('PatientSummary isHighRisk calculation', () {
      final patient = PatientSummary(
        id: 'p1',
        name: 'Test',
        age: 30,
        gender: 'F',
        adherenceRate: 50.0,
        activeMedsCount: 2,
        status: 'high_risk',
      );
      expect(patient.isOnTrack, false);
      expect(patient.needsAttention, false);
      expect(patient.isHighRisk, true);
    });
  });
}
