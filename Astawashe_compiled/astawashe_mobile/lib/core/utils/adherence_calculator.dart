class AdherenceCalculator {
  static double calculate({
    required num taken,
    required num missed,
    required num total,
  }) {
    if (total <= 0) {
      return 0.0;
    }

    final percentage = ((taken / total) * 100);
    return percentage.isNaN ? 0.0 : percentage.toDouble();
  }
}
