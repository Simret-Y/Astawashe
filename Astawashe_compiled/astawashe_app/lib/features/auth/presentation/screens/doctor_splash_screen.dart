import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/primary_button.dart';

class DoctorSplashScreen extends StatelessWidget {
  const DoctorSplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.doctorNavy,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28.0),
                  child: IntrinsicHeight(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const SizedBox(height: 16),
                        // Top logo
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: AppColors.doctorNavySurface,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withAlpha(50),
                              width: 1.5,
                            ),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.show_chart_rounded,
                              color: Color(0xFF60A5FA),
                              size: 32,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'AstaWashe',
                          style: TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'For Healthcare Professionals',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF93C5FD),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Manage your patients,\ntrack medication adherence,\nmake a bigger impact.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            height: 1.4,
                            color: Color(0xFF94A3B8),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Doctor Illustration
                        Center(child: _buildDoctorIllustration()),

                        const Spacer(),
                        const SizedBox(height: 16),

                        // Sign In button
                        PrimaryButton(
                          label: 'Sign In',
                          backgroundColor: Colors.white,
                          textColor: AppColors.doctorNavy,
                          onPressed: () {
                            context.push('/login?tab=doctor');
                          },
                        ),
                        const SizedBox(height: 12),

                        // Create Account button
                        PrimaryButton(
                          label: 'Create Account',
                          isOutlined: true,
                          backgroundColor: AppColors.doctorNavySurface,
                          textColor: Colors.white,
                          onPressed: () {
                            context.push('/login?tab=doctor&mode=signup');
                          },
                        ),
                        const SizedBox(height: 12),

                        // Switch to patient app
                        TextButton(
                          onPressed: () {
                            context.go('/splash');
                          },
                          child: const Text(
                            'Are you a patient? Switch to Patient App →',
                            style: TextStyle(
                              color: Color(0xFF93C5FD),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildDoctorIllustration() {
    return Container(
      width: 210,
      height: 210,
      decoration: BoxDecoration(
        color: AppColors.doctorNavySurface.withAlpha(120),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withAlpha(20)),
      ),
      child: Center(
        child: Container(
          width: 150,
          height: 150,
          decoration: BoxDecoration(
            color: AppColors.doctorNavySurface,
            shape: BoxShape.circle,
            border: Border.all(
              color: const Color(0xFF3B82F6).withAlpha(80),
              width: 2,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x33000000),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.medical_services_rounded,
                size: 48,
                color: Color(0xFF60A5FA),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: AppColors.doctorNavy,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.verified_user_rounded,
                      size: 13,
                      color: AppColors.statusSuccess,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Verified Doctor',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
