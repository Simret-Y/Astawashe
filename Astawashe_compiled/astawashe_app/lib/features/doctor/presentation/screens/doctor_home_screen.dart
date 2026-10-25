import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/stat_tile.dart';
import '../../../../core/widgets/section_header.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';
import '../providers/doctor_providers.dart';

class DoctorHomeScreen extends ConsumerWidget {
  const DoctorHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(doctorDashboardProvider);
    final authState = ref.watch(authStateProvider);
    final user = authState.user;

    String doctorName = dashboardAsync.value?.doctor.name ??
        user?.profileData?['name']?.toString() ??
        user?.fullName ??
        'Doctor';
    if (!doctorName.toLowerCase().startsWith('dr.')) {
      doctorName = 'Dr. $doctorName';
    }

    final pendingCount = dashboardAsync.value?.pendingRequests.length ?? 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(doctorDashboardProvider),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(
              horizontal: 20.0,
              vertical: 12.0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Doctor Header
                _buildHeader(context, doctorName),
                const SizedBox(height: 18),

                // Pending Approval Notification Banner if any pending
                if (pendingCount > 0) ...[
                  _buildPendingBanner(context, pendingCount),
                  const SizedBox(height: 16),
                ],

                // 2x2 Overview Stat Tiles matching real-time data
                _buildOverviewGrid(context, ref, dashboardAsync),
                const SizedBox(height: 24),

                // Recent Patients Section
                SectionHeader(
                  title: 'Recent Patients',
                  actionLabel: 'See all',
                  onAction: () => context.go('/doctor/patients'),
                ),
                const SizedBox(height: 8),

                // Recent Patients List
                dashboardAsync.when(
                  data: (data) {
                    if (data.recentPatients.isEmpty) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.people_outline_rounded,
                              size: 44,
                              color: AppColors.textMuted,
                            ),
                            const SizedBox(height: 10),
                            const Text(
                              'No active patients yet',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Patients who select you as their physician will appear here once approved.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textMuted,
                              ),
                            ),
                            if (pendingCount > 0) ...[
                              const SizedBox(height: 14),
                              ElevatedButton.icon(
                                onPressed: () => context.push('/doctor/requests'),
                                icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                                label: Text('Review $pendingCount Request(s)'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    }

                    return Column(
                      children: data.recentPatients.map((patient) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 6,
                            ),
                            onTap: () {
                              context.push('/doctor/patients/${patient.id}');
                            },
                            leading: Container(
                              width: 44,
                              height: 44,
                              decoration: const BoxDecoration(
                                color: AppColors.primaryContainer,
                                shape: BoxShape.circle,
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.person_rounded,
                                  color: AppColors.primary,
                                  size: 24,
                                ),
                              ),
                            ),
                            title: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    patient.name,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                StatusChip(
                                  type: patient.isOnTrack
                                      ? StatusType.onTrack
                                      : StatusType.needsAttention,
                                  isCompact: true,
                                ),
                              ],
                            ),
                            subtitle: Text(
                              'Adherence ${patient.adherenceRate.round()}% • ${patient.activeMedsCount} meds',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textMuted,
                              ),
                            ),
                            trailing: const Icon(
                              Icons.chevron_right_rounded,
                              color: AppColors.textMuted,
                              size: 22,
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  },
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  error: (err, _) => Center(child: Text('Error: $err')),
                ),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/assistant'),
        backgroundColor: AppColors.doctorNavy,
        foregroundColor: Colors.white,
        elevation: 4,
        icon: const Icon(Icons.auto_awesome_rounded, size: 20),
        label: const Text(
          'AstaWashe AI',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String doctorName) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Good day,',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              doctorName,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              "Here's an overview of your patients.",
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
        GestureDetector(
          onTap: () => context.go('/doctor/more'),
          child: Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.doctorNavySurface,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: const Center(
              child: Icon(
                Icons.medical_services_rounded,
                color: Color(0xFF60A5FA),
                size: 24,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPendingBanner(BuildContext context, int count) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFFD97706),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.person_add_alt_1_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$count Patient Registration Request${count > 1 ? 's' : ''}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF92400E),
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Tap to review and approve patient requests',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFFB45309),
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.push('/doctor/requests'),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFFB45309),
              padding: const EdgeInsets.symmetric(horizontal: 8),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Review',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
                Icon(Icons.chevron_right_rounded, size: 18),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewGrid(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<dynamic> dashboardAsync,
  ) {
    final totalPatients = dashboardAsync.maybeWhen(
      data: (data) => data.totalPatients.toString(),
      orElse: () => '...',
    );
    final onTrack = dashboardAsync.maybeWhen(
      data: (data) => data.onTrackCount.toString(),
      orElse: () => '...',
    );
    final needAttention = dashboardAsync.maybeWhen(
      data: (data) => data.needAttentionCount.toString(),
      orElse: () => '...',
    );
    final missedDose = dashboardAsync.maybeWhen(
      data: (data) => data.missedDoseCount.toString(),
      orElse: () => '...',
    );

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: StatTile(
                label: 'Total Patients',
                value: totalPatients,
                icon: Icons.people_alt_rounded,
                iconColor: AppColors.primary,
                iconBgColor: AppColors.primaryContainer,
                onTap: () => context.go('/doctor/patients'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StatTile(
                label: 'On Track',
                value: onTrack,
                icon: Icons.check_circle_rounded,
                iconColor: AppColors.statusSuccess,
                iconBgColor: AppColors.statusSuccessBg,
                onTap: () {
                  ref
                      .read(patientFilterProvider.notifier)
                      .setFilter('On Track');
                  context.go('/doctor/patients');
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: StatTile(
                label: 'Need Attention',
                value: needAttention,
                icon: Icons.warning_amber_rounded,
                iconColor: AppColors.statusWarning,
                iconBgColor: AppColors.statusWarningBg,
                onTap: () {
                  ref
                      .read(patientFilterProvider.notifier)
                      .setFilter('Needs Attention');
                  context.go('/doctor/patients');
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StatTile(
                label: 'Missed Dose',
                value: missedDose,
                icon: Icons.error_rounded,
                iconColor: AppColors.statusDanger,
                iconBgColor: AppColors.statusDangerBg,
                onTap: () {
                  context.push('/doctor/insights');
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}
