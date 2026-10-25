/// Pure adherence calculation utility.
class AdherenceCalculator {
  AdherenceCalculator._();

  /// Calculates percentage (0.0 to 100.0) from taken and total doses.
  static double calculateRate({required int taken, required int total}) {
    if (total <= 0) return 100.0;
    final rate = (taken / total) * 100.0;
    return double.parse(rate.toStringAsFixed(1));
  }

  /// Categorizes adherence tier.
  static AdherenceTier evaluateTier(double rate) {
    if (rate >= 80.0) {
      return AdherenceTier.onTrack;
    } else if (rate >= 60.0) {
      return AdherenceTier.needsAttention;
    } else {
      return AdherenceTier.highRisk;
    }
  }

  /// Evaluates whether consecutive missed doses exceed guardian alert threshold (>= 3).
  static bool shouldAlertGuardian(int consecutiveMissedDoses) {
    return consecutiveMissedDoses >= 3;
  }
}

enum AdherenceTier { onTrack, needsAttention, highRisk }
