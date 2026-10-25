import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum StatusType {
  taken,
  onTrack,
  pending,
  needsAttention,
  missed,
  highRisk,
  active,
}

/// Accessible status badge combining color, icon, and text.
class StatusChip extends StatelessWidget {
  final StatusType type;
  final String? customLabel;
  final bool isCompact;

  const StatusChip({
    super.key,
    required this.type,
    this.customLabel,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    final config = _getConfig();

    if (isCompact) {
      // Small indicator dot with semantic label for lists
      return Semantics(
        label: customLabel ?? config.label,
        child: Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: config.color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: config.color.withAlpha(60),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
        ),
      );
    }

    return Semantics(
      label: 'Status: ${customLabel ?? config.label}',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: config.bgColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: config.color.withAlpha(50), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(config.icon, size: 14, color: config.color),
            const SizedBox(width: 4),
            Text(
              customLabel ?? config.label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: config.color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  _StatusConfig _getConfig() {
    switch (type) {
      case StatusType.taken:
      case StatusType.onTrack:
        return const _StatusConfig(
          label: 'On Track',
          icon: Icons.check_circle_rounded,
          color: AppColors.statusSuccess,
          bgColor: AppColors.statusSuccessBg,
        );
      case StatusType.pending:
      case StatusType.needsAttention:
        return const _StatusConfig(
          label: 'Needs Attention',
          icon: Icons.warning_amber_rounded,
          color: AppColors.statusWarning,
          bgColor: AppColors.statusWarningBg,
        );
      case StatusType.missed:
      case StatusType.highRisk:
        return const _StatusConfig(
          label: 'Missed Dose',
          icon: Icons.error_rounded,
          color: AppColors.statusDanger,
          bgColor: AppColors.statusDangerBg,
        );
      case StatusType.active:
        return const _StatusConfig(
          label: 'Active',
          icon: Icons.lens_rounded,
          color: AppColors.primary,
          bgColor: AppColors.primaryContainer,
        );
    }
  }
}

class _StatusConfig {
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const _StatusConfig({
    required this.label,
    required this.icon,
    required this.color,
    required this.bgColor,
  });
}
