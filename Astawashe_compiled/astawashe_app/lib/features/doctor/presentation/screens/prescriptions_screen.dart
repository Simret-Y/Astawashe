import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/date_utils.dart';
import '../../domain/models/doctor_models.dart';
import '../../domain/repositories/prescription_repository.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';
import '../providers/doctor_providers.dart';

class PrescriptionsScreen extends ConsumerWidget {
  const PrescriptionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prescriptionsAsync = ref.watch(doctorPrescriptionsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Prescriptions')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddPrescriptionDialog(context, ref),
        backgroundColor: AppColors.doctorNavy,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'New Prescription',
          style: TextStyle(color: Colors.white),
        ),
      ),
      body: SafeArea(
        child: prescriptionsAsync.when(
          data: (prescriptions) {
            if (prescriptions.isEmpty) {
              return const Center(
                child: Text(
                  'No active prescriptions.',
                  style: TextStyle(color: AppColors.textMuted),
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              itemCount: prescriptions.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final rx = prescriptions[index];
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
                            '${rx.medicationName} ${rx.strength}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.statusSuccessBg,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              rx.status,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.statusSuccess,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Patient: ${rx.patientName}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${rx.dosage} • ${rx.frequency}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      if (rx.notes != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          rx.notes!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        'Started: ${AppDateUtils.formatShortDate(rx.startDate)}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted,
                        ),
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

  void _showAddPrescriptionDialog(BuildContext context, WidgetRef ref) {
    final patients = ref.read(doctorPatientsProvider).value ?? [];
    final user = ref.read(authStateProvider).user;
    final doctorId = user?.profileData?['doctorId']?.toString() ?? user?.id ?? '';

    String? selectedPatientId = patients.isNotEmpty ? patients.first.id : null;
    String? selectedPatientName = patients.isNotEmpty ? patients.first.name : null;

    final patientCtrl = TextEditingController(
      text: selectedPatientName ?? '',
    );
    final medCtrl = TextEditingController();
    final strengthCtrl = TextEditingController(text: '500mg');
    final dosageCtrl = TextEditingController(text: '1 tablet');
    final freqCtrl = TextEditingController(text: 'Once daily');
    final notesCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Prescribe Medication'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (patients.isNotEmpty)
                  DropdownButtonFormField<String>(
                    initialValue: selectedPatientId,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Select Patient'),
                    items: patients.map((p) {
                      return DropdownMenuItem<String>(
                        value: p.id,
                        child: Text(p.name),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setDialogState(() {
                        selectedPatientId = val;
                        final found = patients.firstWhere((p) => p.id == val);
                        selectedPatientName = found.name;
                        patientCtrl.text = found.name;
                      });
                    },
                  )
                else
                  TextField(
                    controller: patientCtrl,
                    decoration: const InputDecoration(labelText: 'Patient Name'),
                  ),
                const SizedBox(height: 8),
                TextField(
                  controller: medCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Medication Name (e.g. Metformin)',
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: strengthCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Strength (e.g. 500mg)',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: dosageCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Dosage (e.g. 1 tab)',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: freqCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Frequency (e.g. Twice daily)',
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Instructions / Notes',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (medCtrl.text.isNotEmpty) {
                  final finalPatientName = selectedPatientName ??
                      (patientCtrl.text.trim().isNotEmpty
                          ? patientCtrl.text.trim()
                          : 'Patient');
                  final finalPatientId = selectedPatientId ?? 'patient-${DateTime.now().millisecondsSinceEpoch}';

                  final repo = ref.read(prescriptionRepositoryProvider);
                  await repo.createPrescription(
                    Prescription(
                      id: 'rx-${DateTime.now().millisecondsSinceEpoch}',
                      patientId: finalPatientId,
                      patientName: finalPatientName,
                      doctorId: doctorId,
                      medicationName: medCtrl.text.trim(),
                      strength: strengthCtrl.text.trim(),
                      dosage: dosageCtrl.text.trim(),
                      frequency: freqCtrl.text.trim(),
                      startDate: DateTime.now(),
                      notes: notesCtrl.text.trim().isEmpty
                          ? null
                          : notesCtrl.text.trim(),
                    ),
                  );
                  ref.invalidate(doctorPrescriptionsProvider);
                  if (ctx.mounted) Navigator.pop(ctx);
                }
              },
              child: const Text('Prescribe'),
            ),
          ],
        ),
      ),
    );
  }
}
