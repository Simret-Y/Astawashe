import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/patient_providers.dart';

class HealthInfoScreen extends ConsumerWidget {
  const HealthInfoScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashAsync = ref.watch(patientDashboardProvider);
    final patient = dashAsync.value?.patient;
    final bloodGroup = (patient?.bloodGroup?.isNotEmpty ?? false)
        ? patient!.bloodGroup!
        : 'Not Specified';
    final allergies = (patient?.allergies?.isNotEmpty ?? false)
        ? patient!.allergies!
        : 'None reported';
    final chronicConditions = (patient?.chronicConditions?.isNotEmpty ?? false)
        ? patient!.chronicConditions!
        : 'None reported';
    final hospitalRaw = dashAsync.value?.hospitalName;
    final hospital = (hospitalRaw != null && hospitalRaw.isNotEmpty)
        ? hospitalRaw
        : 'Tikur Anbessa Specialized Hospital';
    final doctor = dashAsync.value?.doctorName;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Health Information')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            _buildInfoCard(
              title: 'Blood Group',
              value: bloodGroup,
              icon: Icons.bloodtype_outlined,
              iconColor: Colors.red,
            ),
            const SizedBox(height: 12),
            _buildInfoCard(
              title: 'Known Allergies',
              value: allergies,
              icon: Icons.warning_amber_rounded,
              iconColor: Colors.amber,
            ),
            const SizedBox(height: 12),
            _buildInfoCard(
              title: 'Chronic Diagnoses',
              value: chronicConditions,
              icon: Icons.health_and_safety_outlined,
              iconColor: AppColors.primary,
            ),
            const SizedBox(height: 12),
            _buildInfoCard(
              title: 'Primary Hospital & Care',
              value: doctor != null ? '$hospital\nAttending: Dr. $doctor' : hospital,
              icon: Icons.local_hospital_outlined,
              iconColor: AppColors.statusSuccess,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withAlpha(25),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
