import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/models/patient_models.dart';
import '../../domain/repositories/patient_repository.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';
import '../providers/patient_providers.dart';

final guardiansListProvider = FutureProvider.autoDispose<List<Guardian>>((
  ref,
) async {
  final authState = ref.watch(authStateProvider);
  final patientId =
      authState.user?.profileData?['patientId'] ??
      authState.user?.id ??
      'patient-001';
  final repo = ref.watch(patientRepositoryProvider);
  return repo.getGuardians(patientId);
});

class CareTeamScreen extends ConsumerWidget {
  const CareTeamScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final dashAsync = ref.watch(patientDashboardProvider);
    final guardiansAsync = ref.watch(guardiansListProvider);

    final doctorName = dashAsync.value?.doctorName ?? 'Primary Physician';
    final hospitalName =
        dashAsync.value?.hospitalName ?? 'Tikur Anbessa Hospital';
    final patientId =
        authState.user?.profileData?['patientId'] ??
        authState.user?.id ??
        'patient-001';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Care Team & Guardians')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Doctor Section
              const Text(
                'Primary Physician',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryContainer,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.medical_services_rounded,
                          color: AppColors.primary,
                          size: 26,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            doctorName.startsWith('Dr.')
                                ? doctorName
                                : 'Dr. $doctorName',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            hospitalName,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.chat_bubble_outline_rounded,
                        color: AppColors.primary,
                      ),
                      onPressed: () {
                        context.push('/doctor/messages/$patientId');
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Guardian safety alert card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.shield_outlined,
                      color: Color(0xFFD97706),
                      size: 24,
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Guardians receive an SMS alert if 3 consecutive doses are missed.',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF92400E),
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Guardians List
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Family Guardians',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  TextButton.icon(
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Add'),
                    onPressed: () => _showAddGuardianDialog(context, ref),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              guardiansAsync.when(
                data: (guardians) {
                  return Column(
                    children: guardians.map((g) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: const BoxDecoration(
                                color: Color(0xFFF3E8FF),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.person_outline_rounded,
                                color: Color(0xFF8B5CF6),
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    g.name,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${g.relationship} • ${g.phone}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.notifications_active_outlined,
                              color: AppColors.statusSuccess,
                              size: 20,
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Text('Error: $err'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddGuardianDialog(BuildContext context, WidgetRef ref) {
    final nameCtrl = TextEditingController();
    final relCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Guardian'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Full Name'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: relCtrl,
              decoration: const InputDecoration(
                labelText: 'Relationship (e.g. Sister)',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: phoneCtrl,
              decoration: const InputDecoration(
                labelText: 'Phone Number (+251...)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.isNotEmpty && phoneCtrl.text.isNotEmpty) {
                final auth = ref.read(authStateProvider);
                final patientId =
                    auth.user?.profileData?['patientId'] ??
                    auth.user?.id ??
                    'patient-001';
                final repo = ref.read(patientRepositoryProvider);
                await repo.addGuardian(
                  patientId,
                  Guardian(
                    id: 'g-${DateTime.now().millisecondsSinceEpoch}',
                    patientId: patientId,
                    name: nameCtrl.text.trim(),
                    relationship: relCtrl.text.trim().isEmpty
                        ? 'Family'
                        : relCtrl.text.trim(),
                    phone: phoneCtrl.text.trim(),
                  ),
                );
                ref.invalidate(guardiansListProvider);
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
