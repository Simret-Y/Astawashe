import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Circular progress ring representing patient adherence rate.
class AdherenceRing extends StatelessWidget {
  final double percentage; // 0.0 to 100.0
  final double size;
  final double strokeWidth;
  final String? subtitle;
  final Color? progressColor;
  final Color? trackColor;

  const AdherenceRing({
    super.key,
    required this.percentage,
    this.size = 140.0,
    this.strokeWidth = 12.0,
    this.subtitle,
    this.progressColor,
    this.trackColor,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveProgressColor =
        progressColor ??
        (percentage >= 80
            ? AppColors.primary
            : percentage >= 70
            ? AppColors.primaryLight
            : AppColors.statusWarning);

    final normalizedValue = (percentage / 100.0).clamp(0.0, 1.0);

    return Semantics(
      label:
          'Adherence rate: ${percentage.round()} percent${subtitle != null ? ', $subtitle' : ''}',
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: size,
              height: size,
              child: CircularProgressIndicator(
                value: normalizedValue,
                strokeWidth: strokeWidth,
                strokeCap: StrokeCap.round,
                backgroundColor: trackColor ?? AppColors.border,
                valueColor: AlwaysStoppedAnimation<Color>(
                  effectiveProgressColor,
                ),
              ),
            ),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${percentage.round()}%',
                  style: TextStyle(
                    fontSize: size > 100 ? 32 : 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: TextStyle(
                      fontSize: size > 100 ? 12 : 10,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textMuted,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
