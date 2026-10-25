import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/primary_button.dart';
import '../../domain/models/patient_models.dart';
import '../providers/patient_providers.dart';

class TakeMedicationSuccessScreen extends ConsumerStatefulWidget {
  final DoseLog? dose;

  const TakeMedicationSuccessScreen({super.key, this.dose});

  @override
  ConsumerState<TakeMedicationSuccessScreen> createState() =>
      _TakeMedicationSuccessScreenState();
}

class _TakeMedicationSuccessScreenState
    extends ConsumerState<TakeMedicationSuccessScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _scaleAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.elasticOut,
    );

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _onDone() {
    final dose = widget.dose;
    if (dose != null) {
      ref.read(todayDosesProvider.notifier).markTaken(dose.id);
    }
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/patient/home');
    }
  }

  void _onSnooze() {
    final dose = widget.dose;
    if (dose != null) {
      ref.read(todayDosesProvider.notifier).snoozeDose(dose.id);
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Reminder snoozed for 10 minutes.')),
    );
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/patient/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final medName = widget.dose?.medicationName ?? 'Paracetamol 500mg';
    final dosage = widget.dose?.dosage ?? '1 tablet';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, size: 24),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 16.0),
          child: Column(
            children: [
              const Spacer(),

              // Confetti and Celebration Badge
              Stack(
                alignment: Alignment.center,
                children: [
                  // Animated confetti particles
                  CustomPaint(
                    size: const Size(260, 200),
                    painter: _ConfettiPainter(),
                  ),
                  // Green success badge
                  ScaleTransition(
                    scale: _scaleAnimation,
                    child: Container(
                      width: 90,
                      height: 90,
                      decoration: const BoxDecoration(
                        color: AppColors.statusSuccess,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x332CAA72),
                            blurRadius: 20,
                            offset: Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.check_rounded,
                          size: 52,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Title & Message
              const Text(
                'Great job!',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "You've taken your medication.",
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 32),

              // Medication Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryContainer,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.medication_rounded,
                          color: AppColors.primary,
                          size: 24,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            medName,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            dosage,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // Action Buttons
              PrimaryButton(label: 'Done', onPressed: _onDone),
              const SizedBox(height: 12),
              PrimaryButton(
                label: 'Snooze (10 min)',
                isOutlined: true,
                onPressed: _onSnooze,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConfettiPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final random = Random(42);
    final colors = [
      AppColors.primary,
      const Color(0xFFFBBF24),
      const Color(0xFFEC4899),
      AppColors.statusSuccess,
      const Color(0xFF8B5CF6),
      const Color(0xFF06B6D4),
    ];

    for (int i = 0; i < 35; i++) {
      final paint = Paint()
        ..color = colors[random.nextInt(colors.length)]
        ..style = PaintingStyle.fill;

      final dx = random.nextDouble() * size.width;
      final dy = random.nextDouble() * size.height;
      final radius = random.nextDouble() * 3.5 + 2.0;

      if (i % 3 == 0) {
        canvas.drawCircle(Offset(dx, dy), radius, paint);
      } else {
        canvas.drawRect(
          Rect.fromCenter(
            center: Offset(dx, dy),
            width: radius * 2,
            height: radius * 1.4,
          ),
          paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
