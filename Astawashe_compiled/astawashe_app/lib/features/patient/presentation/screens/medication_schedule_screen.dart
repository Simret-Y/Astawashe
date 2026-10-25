import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/date_utils.dart';
import '../../../../core/widgets/dose_card.dart';
import '../../../../core/widgets/loading_skeleton.dart';
import '../../../../core/widgets/error_state.dart';
import '../providers/patient_providers.dart';

class MedicationScheduleScreen extends ConsumerWidget {
  const MedicationScheduleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = ref.watch(selectedScheduleDateProvider);
    final dosesAsync = ref.watch(scheduleDosesForDateProvider(selectedDate));
    final weekDates = AppDateUtils.getWeekDates(DateTime.now());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Medication Schedule'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/patient/home');
            }
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Calendar Week Strip
              _buildWeekCalendar(context, ref, weekDates, selectedDate),
              const SizedBox(height: 24),

              // Date Header
              Text(
                AppDateUtils.isSameDay(selectedDate, DateTime.now())
                    ? 'Today, ${AppDateUtils.formatShortDate(selectedDate)}'
                    : AppDateUtils.formatHeaderDate(selectedDate),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 14),

              // Doses list
              dosesAsync.when(
                data: (doses) {
                  if (doses.isEmpty) {
                    return Container(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      alignment: Alignment.center,
                      child: const Text(
                        'No doses scheduled for this date.',
                        style: TextStyle(color: AppColors.textMuted),
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
                            ref.invalidate(
                              scheduleDosesForDateProvider(selectedDate),
                            );
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
                  onRetry: () => ref.invalidate(
                    scheduleDosesForDateProvider(selectedDate),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Stay Consistent Motivation Banner matching design
              _buildMotivationBanner(),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWeekCalendar(
    BuildContext context,
    WidgetRef ref,
    List<DateTime> weekDates,
    DateTime selectedDate,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060F172A),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: weekDates.map((date) {
          final isSelected = AppDateUtils.isSameDay(date, selectedDate);
          final isToday = AppDateUtils.isSameDay(date, DateTime.now());

          return GestureDetector(
            onTap: () {
              ref.read(selectedScheduleDateProvider.notifier).selectDate(date);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    AppDateUtils.formatDayOfWeek(date),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? Colors.white.withAlpha(220)
                          : AppColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    AppDateUtils.formatDayOfMonth(date),
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: isSelected
                          ? Colors.white
                          : (isToday
                                ? AppColors.primary
                                : AppColors.textPrimary),
                    ),
                  ),
                  if (isToday && !isSelected) ...[
                    const SizedBox(height: 4),
                    Container(
                      width: 4,
                      height: 4,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMotivationBanner() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.shield_rounded,
              color: Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Stay consistent',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Your health matters! 💙',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.primaryDark,
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
