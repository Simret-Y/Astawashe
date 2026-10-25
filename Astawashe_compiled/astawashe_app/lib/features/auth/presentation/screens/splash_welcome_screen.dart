import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/primary_button.dart';

class SplashWelcomeScreen extends StatelessWidget {
  const SplashWelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF3B82F6), Color(0xFF2563EB), Color(0xFF1D4ED8)],
          ),
        ),
        child: SafeArea(
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
                          // Top logo & brand
                          _buildLogo(),
                          const SizedBox(height: 12),
                          const Text(
                            'AstaWashe',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Your health, on time',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFFDBEAFE),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Never miss a dose.\nA healthier tomorrow\nstarts with a reminder.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.4,
                              color: Color(0xFFBFDBFE),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Center 3D illustration badge matching design
                          Center(child: _buildIllustration(size)),

                          const Spacer(),
                          const SizedBox(height: 16),

                          // Get Started button
                          PrimaryButton(
                            label: 'Get Started',
                            backgroundColor: Colors.white,
                            textColor: AppColors.primary,
                            onPressed: () {
                              context.push('/login?tab=patient');
                            },
                          ),
                          const SizedBox(height: 12),

                          // I already have an account button
                          PrimaryButton(
                            label: 'I already have an account',
                            isOutlined: true,
                            backgroundColor: Colors.white,
                            textColor: Colors.white,
                            onPressed: () {
                              context.push('/login?tab=patient');
                            },
                          ),
                          const SizedBox(height: 12),

                          // Doctor portal link
                          TextButton(
                            onPressed: () {
                              context.push('/doctor/splash');
                            },
                            child: const Text(
                              'Are you a doctor? Switch to Doctor Portal →',
                              style: TextStyle(
                                color: Color(0xFFDBEAFE),
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
      ),
    );
  }

  Widget _buildLogo() {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(40),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withAlpha(80), width: 2),
      ),
      child: Center(
        child: Container(
          width: 54,
          height: 54,
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Icon(
              Icons.show_chart_rounded,
              color: AppColors.primary,
              size: 32,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIllustration(Size size) {
    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [Colors.white.withAlpha(50), Colors.white.withAlpha(5)],
        ),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Base pedestal
          Positioned(
            bottom: 16,
            child: Container(
              width: 150,
              height: 34,
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(40),
                borderRadius: BorderRadius.circular(30),
              ),
            ),
          ),
          // Main medicine bottle
          Container(
            width: 100,
            height: 125,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF60A5FA), Color(0xFF2563EB)],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withAlpha(90), width: 3),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(40),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Bottle cap
                Container(
                  width: 46,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(200),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 14),
                // Medical Plus
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.add,
                    size: 24,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          // Floating notification bell badge
          Positioned(
            top: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                color: const Color(0xFFFBBF24),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2.5),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x33000000),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.notifications_active_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
