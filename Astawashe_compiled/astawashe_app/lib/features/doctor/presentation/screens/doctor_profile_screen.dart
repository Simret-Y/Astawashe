import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';
import '../providers/doctor_providers.dart';

class DoctorProfileScreen extends ConsumerWidget {
  const DoctorProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(doctorDashboardProvider);
    final authState = ref.watch(authStateProvider);
    final user = authState.user;

    String doctorName =
        dashboardAsync.value?.doctor.name ??
        user?.profileData?['name']?.toString() ??
        user?.fullName ??
        'Doctor';
    if (!doctorName.toLowerCase().startsWith('dr.')) {
      doctorName = 'Dr. $doctorName';
    }

    final specialization =
        dashboardAsync.value?.doctor.specialization ??
        user?.profileData?['specialization']?.toString() ??
        'General Physician';

    final email = dashboardAsync.value?.doctor.email ?? user?.email ?? '';
    final phone = dashboardAsync.value?.doctor.phone ?? user?.phone ?? '';
    final contactInfo = [
      if (phone.isNotEmpty) phone,
      if (email.isNotEmpty) email,
    ].join(' • ');

    final pendingCount = dashboardAsync.value?.pendingRequests.length ?? 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Doctor Profile & Settings'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              // Doctor profile card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 58,
                      height: 58,
                      decoration: const BoxDecoration(
                        color: AppColors.doctorNavySurface,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.medical_services_rounded,
                          size: 30,
                          color: Color(0xFF60A5FA),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            doctorName,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            specialization,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (contactInfo.isNotEmpty) ...[
                            const SizedBox(height: 3),
                            Text(
                              contactInfo,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Menu
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _buildTile(
                      icon: Icons.person_add_alt_1_rounded,
                      iconColor: AppColors.primary,
                      iconBg: AppColors.primaryContainer,
                      title: 'Patient Approval Requests',
                      trailingWidget: pendingCount > 0
                          ? Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.statusWarningBg,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '$pendingCount pending',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.statusWarning,
                                ),
                              ),
                            )
                          : null,
                      onTap: () => context.push('/doctor/requests'),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildTile(
                      icon: Icons.receipt_long_rounded,
                      iconColor: const Color(0xFF8B5CF6),
                      iconBg: const Color(0xFFF3E8FF),
                      title: 'Prescriptions Management',
                      onTap: () => context.push('/doctor/prescriptions'),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildTile(
                      icon: Icons.insights_rounded,
                      iconColor: const Color(0xFF0D9488),
                      iconBg: const Color(0xFFCCFBF1),
                      title: 'Adherence Analytics & Insights',
                      onTap: () => context.push('/doctor/insights'),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildTile(
                      icon: Icons.logout_rounded,
                      iconColor: AppColors.statusDanger,
                      iconBg: AppColors.statusDangerBg,
                      title: 'Logout',
                      textColor: AppColors.statusDanger,
                      onTap: () async {
                        await ref.read(authStateProvider.notifier).logout();
                        if (context.mounted) {
                          context.go('/doctor/splash');
                        }
                      },
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

  Widget _buildTile({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required VoidCallback onTap,
    Color? textColor,
    Widget? trailingWidget,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: iconBg,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: textColor ?? AppColors.textPrimary,
        ),
      ),
      trailing:
          trailingWidget ??
          const Icon(
            Icons.chevron_right_rounded,
            size: 20,
            color: AppColors.textMuted,
          ),
    );
  }
}
