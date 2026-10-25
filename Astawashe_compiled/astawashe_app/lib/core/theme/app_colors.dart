import 'package:flutter/material.dart';

/// Design tokens and semantic color definitions for AstaWashe.
class AppColors {
  AppColors._();

  // Primary Blues
  static const Color primary = Color(0xFF2563EB); // Vibrant Royal Blue
  static const Color primaryDark = Color(0xFF1D4ED8); // Deep Blue
  static const Color primaryLight = Color(0xFF3B82F6); // Soft Blue
  static const Color primaryContainer = Color(
    0xFFEBF2FE,
  ); // Very light blue pill/badge

  // Doctor Navy Theme
  static const Color doctorNavy = Color(
    0xFF0B1F4B,
  ); // Deep Navy for Doctor Splash & Header
  static const Color doctorNavyDark = Color(0xFF071430);
  static const Color doctorNavySurface = Color(0xFF132A63);

  // Background & Surfaces
  static const Color background = Color(0xFFF5F7FB); // Soft Canvas
  static const Color surface = Color(0xFFFFFFFF); // Pure White Card
  static const Color surfaceElevated = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);
  static const Color divider = Color(0xFFEDF2F7);

  // Typography
  static const Color textPrimary = Color(0xFF172033); // Strong dark slate
  static const Color textSecondary = Color(
    0xFF475569,
  ); // High contrast secondary slate
  static const Color textMuted = Color(
    0xFF64748B,
  ); // Medium contrast muted text
  static const Color textLight = Color(0xFFFFFFFF);

  // Status & Health Indicators
  static const Color statusSuccess = Color(
    0xFF2CAA72,
  ); // Green (Taken / On track)
  static const Color statusSuccessBg = Color(0xFFE8F8F0);

  static const Color statusWarning = Color(
    0xFFF59E0B,
  ); // Amber (Needs attention / Pending)
  static const Color statusWarningBg = Color(0xFFFEF7EA);

  static const Color statusDanger = Color(
    0xFFEF4444,
  ); // Red (Missed / High risk)
  static const Color statusDangerBg = Color(0xFFFEECEE);

  static const Color statusInfo = Color(0xFF0284C7); // Cyan / Blue Info
  static const Color statusInfoBg = Color(0xFFE0F2FE);

  // Pill icon colors
  static const Color pillPurple = Color(0xFF8B5CF6);
  static const Color pillPurpleBg = Color(0xFFF3E8FF);
  static const Color pillGreen = Color(0xFF10B981);
  static const Color pillGreenBg = Color(0xFFD1FAE5);
  static const Color pillCyan = Color(0xFF06B6D4);
  static const Color pillCyanBg = Color(0xFFCFFAFE);
  static const Color pillAmber = Color(0xFFF59E0B);
  static const Color pillAmberBg = Color(0xFFFEF3C7);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1D4ED8), Color(0xFF2563EB), Color(0xFF3B82F6)],
  );

  static const LinearGradient heroCardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2563EB), Color(0xFF3B82F6), Color(0xFF60A5FA)],
  );

  static const LinearGradient doctorGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0B1F4B), Color(0xFF112555), Color(0xFF19326D)],
  );

  static const LinearGradient successCelebrationGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFFFFFFF), Color(0xFFF0FDF4)],
  );
}
