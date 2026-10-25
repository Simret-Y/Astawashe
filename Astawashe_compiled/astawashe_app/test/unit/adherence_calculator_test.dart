import 'package:flutter_test/flutter_test.dart';
import 'package:astawashe_app/core/utils/adherence_calculator.dart';

void main() {
  group('AdherenceCalculator Tests', () {
    test('calculateRate computes correct percentage', () {
      expect(AdherenceCalculator.calculateRate(taken: 10, total: 10), 100.0);
      expect(AdherenceCalculator.calculateRate(taken: 0, total: 10), 0.0);
      expect(AdherenceCalculator.calculateRate(taken: 14, total: 20), 70.0);
      expect(AdherenceCalculator.calculateRate(taken: 0, total: 0), 100.0);
    });

    test('evaluateTier categorizes adherence correctly', () {
      expect(AdherenceCalculator.evaluateTier(95.0), AdherenceTier.onTrack);
      expect(AdherenceCalculator.evaluateTier(80.0), AdherenceTier.onTrack);
      expect(
        AdherenceCalculator.evaluateTier(72.0),
        AdherenceTier.needsAttention,
      );
      expect(
        AdherenceCalculator.evaluateTier(60.0),
        AdherenceTier.needsAttention,
      );
      expect(AdherenceCalculator.evaluateTier(59.9), AdherenceTier.highRisk);
      expect(AdherenceCalculator.evaluateTier(40.0), AdherenceTier.highRisk);
    });

    test(
      'shouldAlertGuardian triggers alert at 3 or more consecutive missed doses',
      () {
        expect(AdherenceCalculator.shouldAlertGuardian(0), isFalse);
        expect(AdherenceCalculator.shouldAlertGuardian(1), isFalse);
        expect(AdherenceCalculator.shouldAlertGuardian(2), isFalse);
        expect(AdherenceCalculator.shouldAlertGuardian(3), isTrue);
        expect(AdherenceCalculator.shouldAlertGuardian(5), isTrue);
      },
    );
  });
}
