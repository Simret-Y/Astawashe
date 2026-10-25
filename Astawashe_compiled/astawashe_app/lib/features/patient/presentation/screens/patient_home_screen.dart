import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/dose_card.dart';
import '../../../../core/widgets/stat_tile.dart';
import '../../../../core/widgets/section_header.dart';
import '../../../../core/widgets/loading_skeleton.dart';
import '../../../../core/widgets/error_state.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';
import '../../domain/models/patient_models.dart';
import '../providers/patient_providers.dart';

class PatientHomeScreen extends ConsumerWidget {
  const PatientHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(patientDashboardProvider);
    final todayDosesAsync = ref.watch(todayDosesProvider);
    final authState = ref.watch(authStateProvider);
    final user = authState.user;

    final patientName = dashboardAsync.value?.patient.fullName ??
        user?.profileData?['fullName']?.toString() ??
        user?.fullName ??
        'Patient';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(patientDashboardProvider);
            ref.invalidate(todayDosesProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(
              horizontal: 20.0,
              vertical: 12.0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top header: Greeting & Avatar
                _buildHeader(context, patientName),
                const SizedBox(height: 18),

                // Next Dose Gradient Hero Card (Live Real-Time)
                _buildHeroCard(context, ref, dashboardAsync, todayDosesAsync),
                const SizedBox(height: 18),

                // 3 Metric Stat Cards (Live Real-Time)
                _buildStatRow(dashboardAsync),
                const SizedBox(height: 22),

                // Test voice reminder button
                _buildVoiceReminderTestBanner(context),
                const SizedBox(height: 16),

                // Upcoming Reminders section
                SectionHeader(
                  title: 'Today\'s Medication Schedule',
                  actionLabel: 'See all',
                  onAction: () => context.go('/patient/schedule'),
                ),
                const SizedBox(height: 8),

                // Doses List
                todayDosesAsync.when(
                  data: (doses) {
                    if (doses.isEmpty) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: const [
                            Icon(
                              Icons.check_circle_outline_rounded,
                              size: 40,
                              color: AppColors.statusSuccess,
                            ),
                            SizedBox(height: 10),
                            Text(
                              'No medications pending for today.',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Any daily prescriptions from your doctor will appear here.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    return Column(
                      children: doses.map((dose) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: DoseCard(
                            medicationName: dose.medicationName,
                            dosage: dose.dosage,
                            time: dose.scheduledTime,
                            isTaken: dose.isTaken,
                            isMissed: dose.isMissed,
                            onToggle: () {
                              ref
                                  .read(todayDosesProvider.notifier)
                                  .toggleDose(dose);
                            },
                            onTap: () {
                              context.push(
                                '/patient/take-medication',
                                extra: dose,
                              );
                            },
                          ),
                        );
                      }).toList(),
                    );
                  },
                  loading: () => const Column(
                    children: [CardSkeleton(), CardSkeleton(), CardSkeleton()],
                  ),
                  error: (err, _) => ErrorState(
                    message: err.toString(),
                    onRetry: () => ref.invalidate(todayDosesProvider),
                  ),
                ),
                const SizedBox(
                  height: 80,
                ), // Padding for floating button & bottom nav
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/assistant'),
        backgroundColor: AppColors.primary,
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

  Widget _buildHeader(BuildContext context, String patientName) {
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
              '$patientName 👋',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        GestureDetector(
          onTap: () => context.go('/patient/more'),
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primaryContainer,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x10000000),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: const Center(
              child: Icon(
                Icons.person_rounded,
                color: AppColors.primary,
                size: 26,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeroCard(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<PatientDashboardData> dashboardAsync,
    AsyncValue<List<DoseLog>> todayDosesAsync,
  ) {
    final doses = todayDosesAsync.value ?? dashboardAsync.value?.todayDoses ?? [];
    final pendingDoses = doses.where((d) => d.isPending).toList();
    final DoseLog? nextDose = pendingDoses.isNotEmpty ? pendingDoses.first : null;
    final allTaken = doses.isNotEmpty && pendingDoses.isEmpty;

    String title = 'Next dose';
    String medName = 'Take your scheduled medication';
    String timeInfo = 'Consult your daily schedule';
    bool showTakeButton = false;

    if (nextDose != null) {
      title = 'Next dose';
      medName = nextDose.medicationName;
      timeInfo = 'Take at ${nextDose.scheduledTime} • ${nextDose.dosage}';
      showTakeButton = true;
    } else if (allTaken) {
      title = 'All caught up! 🎉';
      medName = 'Completed all doses today';
      timeInfo = '${doses.length} medications taken successfully';
      showTakeButton = false;
    } else if (doses.isEmpty) {
      title = 'AstaWashe Health';
      medName = 'No medications scheduled for today';
      timeInfo = 'Stay hydrated & healthy 💙';
      showTakeButton = false;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20.0),
      decoration: BoxDecoration(
        gradient: AppColors.heroCardGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x282563EB),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Pill icon container
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(45),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  allTaken
                      ? Icons.check_circle_rounded
                      : Icons.medication_liquid_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFFDBEAFE),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      medName,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      timeInfo,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFFE0E7FF),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (showTakeButton) ...[
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: () {
                  context.push(
                    '/patient/take-medication',
                    extra: nextDose,
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primary,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 22,
                    vertical: 10,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Take Now',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatRow(AsyncValue<PatientDashboardData> dashboardAsync) {
    final todayCount = dashboardAsync.maybeWhen(
      data: (d) => d.todayDoses.length.toString(),
      orElse: () => '0',
    );
    final completedThisWeek = dashboardAsync.maybeWhen(
      data: (d) => d.completedThisWeek.toString(),
      orElse: () => '0',
    );
    final adherence = dashboardAsync.maybeWhen(
      data: (d) => '${d.adherenceRate.round()}%',
      orElse: () => '0%',
    );

    return Row(
      children: [
        Expanded(
          child: StatTile(
            label: 'Today',
            value: todayCount,
            subtitle: 'medications',
            onTap: () {},
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: StatTile(
            label: 'This week',
            value: completedThisWeek,
            subtitle: 'completed',
            onTap: () {},
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: StatTile(
            label: 'Adherence',
            value: adherence,
            subtitle: 'this week',
            onTap: () {},
          ),
        ),
      ],
    );
  }

  Widget _buildVoiceReminderTestBanner(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/patient/voice-reminder'),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFBFDBFE)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.volume_up_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Test Voice Reminder',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryDark,
                      ),
                    ),
                    Text(
                      'Full audio & speech-to-text confirmation',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_ios_rounded,
                size: 14,
                color: AppColors.primary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
