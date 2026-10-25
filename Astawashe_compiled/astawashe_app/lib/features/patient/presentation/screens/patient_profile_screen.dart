import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';

import '../providers/patient_providers.dart';

class PatientProfileScreen extends ConsumerWidget {
  const PatientProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final dashAsync = ref.watch(patientDashboardProvider);
    final patient = dashAsync.value?.patient;
    final patientName = patient?.fullName ??
        authState.user?.profileData?['fullName'] ??
        authState.user?.profileData?['name'] ??
        authState.user?.phone ??
        'Patient';
    final hospitalName = dashAsync.value?.hospitalName;
    final doctorName = dashAsync.value?.doctorName;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Profile'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => _showLanguageDialog(context),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          child: Column(
            children: [
              // User Card matching design
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryContainer,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.person_rounded,
                          size: 32,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            patientName,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            hospitalName != null
                                ? 'Patient • $hospitalName'
                                : (doctorName != null
                                    ? 'Patient • Dr. $doctorName'
                                    : 'Patient'),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Menu Items List
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _buildMenuItem(
                      icon: Icons.medication_outlined,
                      iconColor: const Color(0xFF2563EB),
                      iconBg: const Color(0xFFEFF6FF),
                      title: 'My Medications',
                      onTap: () => context.push('/patient/medications'),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      icon: Icons.medical_information_outlined,
                      iconColor: const Color(0xFF0284C7),
                      iconBg: const Color(0xFFE0F2FE),
                      title: 'Health Information',
                      onTap: () => context.push('/patient/health-info'),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      icon: Icons.notifications_none_rounded,
                      iconColor: const Color(0xFFD97706),
                      iconBg: const Color(0xFFFEF3C7),
                      title: 'Reminders',
                      onTap: () => context.push('/patient/reminders'),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      icon: Icons.people_outline_rounded,
                      iconColor: const Color(0xFF8B5CF6),
                      iconBg: const Color(0xFFF3E8FF),
                      title: 'Care Team & Guardians',
                      onTap: () => context.push('/patient/care-team'),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      icon: Icons.contact_phone_outlined,
                      iconColor: const Color(0xFFEF4444),
                      iconBg: const Color(0xFFFEE2E2),
                      title: 'Emergency Contacts',
                      onTap: () => context.push('/patient/emergency'),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      icon: Icons.language_rounded,
                      iconColor: const Color(0xFF10B981),
                      iconBg: const Color(0xFFD1FAE5),
                      title: 'Language (English / አማርኛ)',
                      onTap: () => _showLanguageDialog(context),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      icon: Icons.help_outline_rounded,
                      iconColor: const Color(0xFF64748B),
                      iconBg: const Color(0xFFF1F5F9),
                      title: 'Help & Support',
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'AstaWashe Support hotline: 907 or support@astawashe.et',
                            ),
                          ),
                        );
                      },
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      icon: Icons.logout_rounded,
                      iconColor: AppColors.statusDanger,
                      iconBg: AppColors.statusDangerBg,
                      title: 'Logout',
                      textColor: AppColors.statusDanger,
                      onTap: () async {
                        await ref.read(authStateProvider.notifier).logout();
                        if (context.mounted) {
                          context.go('/splash');
                        }
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Need Help Banner matching design
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Need help?',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 3),
                    const Text(
                      'Contact your doctor or support.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton(
                      onPressed: () => context.push('/assistant'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.border),
                        elevation: 0,
                        minimumSize: const Size.fromHeight(42),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Get Support',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required VoidCallback onTap,
    Color? textColor,
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
      trailing: const Icon(
        Icons.chevron_right_rounded,
        size: 20,
        color: AppColors.textMuted,
      ),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Select Language / ቋንቋ ይምረጡ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('English (Default)'),
              leading: const Icon(Icons.check, color: AppColors.primary),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Language set to English')),
                );
              },
            ),
            ListTile(
              title: const Text('አማርኛ (Amharic)'),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('ቋንቋ ወደ አማርኛ ተቀይሯል (Amharic mode activated)'),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
