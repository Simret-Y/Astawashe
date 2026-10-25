import 'package:flutter_test/flutter_test.dart';
import 'package:astawashe_app/features/patient/data/repositories/mock_dose_repository.dart';

void main() {
  group('MockDoseRepository Tests', () {
    late MockDoseRepository repo;

    setUp(() {
      repo = MockDoseRepository();
    });

    test(
      'getTodayDoses returns 3 scheduled doses matching design image',
      () async {
        final doses = await repo.getTodayDoses('patient-001');
        expect(doses.length, 3);
        expect(doses.first.medicationName, 'Paracetamol 500mg');
        expect(doses.first.isTaken, isTrue);
      },
    );

    test('markDoseStatus updates status to taken and sets timestamp', () async {
      final doses = await repo.getTodayDoses('patient-001');
      final secondDose = doses[1]; // Vitamin D
      expect(secondDose.isPending, isTrue);

      final updated = await repo.markDoseStatus(
        doseId: secondDose.id,
        status: 'taken',
      );

      expect(updated.isTaken, isTrue);
      expect(updated.confirmedAt, isNotNull);
    });

    test('getAdherenceStats returns accurate mock analytics', () async {
      final stats = await repo.getAdherenceStats('patient-001');
      expect(stats['monthlyAdherence'], 93.0);
      expect(stats['todayDosesCount'], 3);
    });
  });
}
