import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Interactive medication dose card matching Patient Home & Schedule screens.
class DoseCard extends StatelessWidget {
  final String medicationName;
  final String dosage;
  final String time;
  final bool isTaken;
  final bool isMissed;
  final Color? pillColor;
  final Color? pillBgColor;
  final VoidCallback? onToggle;
  final VoidCallback? onTap;

  const DoseCard({
    super.key,
    required this.medicationName,
    required this.dosage,
    required this.time,
    this.isTaken = false,
    this.isMissed = false,
    this.pillColor,
    this.pillBgColor,
    this.onToggle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final statusText = isTaken
        ? 'Taken'
        : isMissed
        ? 'Missed'
        : 'Pending';

    return Semantics(
      label: '$medicationName, $dosage at $time. Status: $statusText',
      button: true,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap ?? onToggle,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isMissed
                    ? AppColors.statusDanger.withAlpha(50)
                    : AppColors.border,
                width: 1,
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x060F172A),
                  blurRadius: 8,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                // Pill Icon badge
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: pillBgColor ?? AppColors.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      Icons.medication_rounded,
                      size: 22,
                      color: pillColor ?? AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                // Medicine details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        medicationName,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isTaken
                              ? AppColors.textSecondary
                              : AppColors.textPrimary,
                          decoration: isTaken
                              ? TextDecoration.lineThrough
                              : TextDecoration.none,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$time • $dosage',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textMuted,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                // Action Check Circle
                GestureDetector(
                  onTap: onToggle,
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: const EdgeInsets.all(4.0),
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isTaken
                            ? AppColors.statusSuccess
                            : isMissed
                            ? AppColors.statusDangerBg
                            : Colors.transparent,
                        border: Border.all(
                          color: isTaken
                              ? AppColors.statusSuccess
                              : isMissed
                              ? AppColors.statusDanger
                              : AppColors.border,
                          width: 1.8,
                        ),
                      ),
                      child: isTaken
                          ? const Icon(
                              Icons.check_rounded,
                              size: 18,
                              color: Colors.white,
                            )
                          : isMissed
                          ? const Icon(
                              Icons.close_rounded,
                              size: 16,
                              color: AppColors.statusDanger,
                            )
                          : null,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
