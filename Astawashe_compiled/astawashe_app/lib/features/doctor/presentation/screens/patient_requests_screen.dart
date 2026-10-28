import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/date_utils.dart';
import '../providers/doctor_providers.dart';
import '../../../patient/domain/repositories/patient_repository.dart';

class PatientRequestsScreen extends ConsumerWidget {
  const PatientRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(doctorPendingRequestsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Patient Requests')),
      body: SafeArea(
        child: requestsAsync.when(
          data: (requests) {
            if (requests.isEmpty) {
              return const Center(
                child: Text(
                  'No pending patient requests.',
                  style: TextStyle(color: AppColors.textMuted),
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              itemCount: requests.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final req = requests[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            req.patientName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            AppDateUtils.formatShortDate(req.requestedAt),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${req.phone ?? ''} ${req.email != null ? '• ${req.email}' : ''}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      if (req.reason != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          req.reason!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () async {
                                final repo = ref.read(
                                  patientRepositoryProvider,
                                );
                                await repo.handleApprovalRequest(
                                  req.id,
                                  'REJECT',
                                );
                                ref.invalidate(doctorPendingRequestsProvider);
                                ref.invalidate(doctorDashboardProvider);
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.statusDanger,
                                side: const BorderSide(
                                  color: AppColors.statusDanger,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                minimumSize: const Size.fromHeight(48),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                              ),
                              child: const Text('Reject'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () async {
                                final repo = ref.read(
                                  patientRepositoryProvider,
                                );
                                await repo.handleApprovalRequest(
                                  req.id,
                                  'APPROVE',
                                );
                                ref.invalidate(doctorPendingRequestsProvider);
                                ref.invalidate(doctorDashboardProvider);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        '${req.patientName} approved successfully.',
                                      ),
                                    ),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.statusSuccess,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                minimumSize: const Size.fromHeight(48),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                              ),
                              child: const Text('Approve'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }
}
