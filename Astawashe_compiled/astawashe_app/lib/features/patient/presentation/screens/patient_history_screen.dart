import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/adherence_ring.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../../../core/widgets/stat_tile.dart';
import '../../domain/repositories/dose_repository.dart';
import '../../domain/models/patient_models.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';
import '../providers/patient_providers.dart';

final patientHistoryDosesProvider = FutureProvider.autoDispose<List<DoseLog>>((
  ref,
) async {
  final authState = ref.watch(authStateProvider);
  final patientId = authState.user?.profileData?['patientId'] ??
      authState.user?.id ??
      'patient-001';
  final repo = ref.watch(doseRepositoryProvider);
  final now = DateTime.now();
  // Fetch doses for past 3 days
  final list1 = await repo.getDosesForDate(patientId, now);
  final list2 = await repo.getDosesForDate(
    patientId,
    now.subtract(const Duration(days: 1)),
  );
  final list3 = await repo.getDosesForDate(
    patientId,
    now.subtract(const Duration(days: 2)),
  );
  return [...list1, ...list2, ...list3];
});

class PatientHistoryScreen extends ConsumerWidget {
  const PatientHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(patientHistoryDosesProvider);
    final dashAsync = ref.watch(patientDashboardProvider);
    final adherenceRate = dashAsync.value?.adherenceRate ?? 0.0;
    final completedDoses = dashAsync.value?.completedThisWeek ?? 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Medication History'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(patientHistoryDosesProvider);
            ref.invalidate(patientDashboardProvider);
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
                // Adherence Ring & Highlights Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      AdherenceRing(
                        percentage: adherenceRate,
                        size: 110,
                        strokeWidth: 10,
                        subtitle: 'Adherence',
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              adherenceRate >= 80
                                  ? 'Excellent Streak!'
                                  : (adherenceRate >= 50
                                      ? 'Good Progress!'
                                      : 'Adherence Track'),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'You have completed ${adherenceRate.toStringAsFixed(0)}% of your scheduled doses recently. ${adherenceRate >= 80 ? "Keep up the great routine!" : "Consistent doses improve recovery."}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 2 Stat Tiles
                Row(
                  children: [
                    Expanded(
                      child: StatTile(
                        label: 'Adherence Score',
                        value: '${adherenceRate.toStringAsFixed(0)}%',
                        icon: Icons.local_fire_department_rounded,
                        iconColor: const Color(0xFFF97316),
                        iconBgColor: const Color(0xFFFFEDD5),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: StatTile(
                        label: 'Doses Taken (Wk)',
                        value: '$completedDoses',
                        icon: Icons.check_circle_rounded,
                        iconColor: AppColors.statusSuccess,
                        iconBgColor: AppColors.statusSuccessBg,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),

                // Past Doses Logs List
                const Text(
                  'Past Doses',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 12),

                historyAsync.when(
                  data: (doses) {
                    if (doses.isEmpty) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.history_rounded, size: 40, color: AppColors.textMuted.withAlpha(120)),
                            const SizedBox(height: 8),
                            const Text(
                              'No recent dose logs yet',
                              style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      );
                    }
                    return Column(
                      children: doses.map((dose) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: const BoxDecoration(
                                  color: AppColors.primaryContainer,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.medication_rounded,
                                  color: AppColors.primary,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      dose.medicationName,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '${dose.scheduledTime} • ${dose.dosage}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              StatusChip(
                                type: dose.isTaken
                                    ? StatusType.taken
                                    : dose.isMissed
                                    ? StatusType.missed
                                    : StatusType.pending,
                                customLabel: dose.status.toUpperCase(),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    );
                  },
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (err, _) =>
                      Center(child: Text('Error loading history: $err')),
                ),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
