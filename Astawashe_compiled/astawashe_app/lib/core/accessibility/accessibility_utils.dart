import 'package:flutter/material.dart';

/// Accessibility utilities ensuring 48dp touch targets, semantics, and contrast.
class AccessibilityUtils {
  AccessibilityUtils._();

  /// Minimum touch target size recommended by WCAG 2.1 AAA & Material Guidelines.
  static const double minTouchTargetSize = 48.0;

  /// Wraps an interactive widget with a minimum 48x48 touch target area.
  static Widget ensureMinTouchTarget({
    required Widget child,
    double minWidth = minTouchTargetSize,
    double minHeight = minTouchTargetSize,
  }) {
    return ConstrainedBox(
      constraints: BoxConstraints(minWidth: minWidth, minHeight: minHeight),
      child: Center(child: child),
    );
  }

  /// Semantic wrapper for interactive icons or actions with read-aloud support.
  static Widget accessibleAction({
    required Widget child,
    required String label,
    String? hint,
    VoidCallback? onTap,
    bool isButton = true,
  }) {
    return Semantics(
      label: label,
      hint: hint,
      button: isButton,
      enabled: onTap != null,
      child: child,
    );
  }
}
