import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/patient_models.dart';
import '../../domain/repositories/dose_repository.dart';
import '../../domain/repositories/medication_repository.dart';
import '../../domain/repositories/patient_repository.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';
import '../../../notifications/notification_service.dart';

final patientDashboardProvider =
    FutureProvider.autoDispose<PatientDashboardData>((ref) async {
      final repository = ref.watch(patientRepositoryProvider);
      final user = ref.watch(authStateProvider).user;
      final patientId =
          user?.profileData?['patientId']?.toString() ??
          user?.id ??
          'patient-001';
      final data = await repository.getDashboardData(patientId);

      // Synchronize daily doses with local notification scheduler
      try {
        final notificationService = ref.read(notificationServiceProvider);
        for (int i = 0; i < data.todayDoses.length; i++) {
          final dose = data.todayDoses[i];
          if (dose.isPending) {
            await notificationService.scheduleDoseReminder(
              id: i + 1,
              title: 'Medication: ${dose.medicationName}',
              body: 'Time to take ${dose.dosage} (${dose.scheduledTime})',
              timeStr: dose.scheduledTime,
            );
          }
        }
      } catch (_) {}

      return data;
    });

final todayDosesProvider =
    AsyncNotifierProvider<TodayDosesNotifier, List<DoseLog>>(() {
      return TodayDosesNotifier();
    });

class TodayDosesNotifier extends AsyncNotifier<List<DoseLog>> {
  String get _currentPatientId {
    final user = ref.watch(authStateProvider).user;
    return user?.profileData?['patientId']?.toString() ??
        user?.id ??
        'patient-001';
  }

  @override
  Future<List<DoseLog>> build() async {
    final doseRepo = ref.watch(doseRepositoryProvider);
    return doseRepo.getTodayDoses(_currentPatientId);
  }

  Future<void> toggleDose(DoseLog dose) async {
    final doseRepo = ref.read(doseRepositoryProvider);
    final newStatus = dose.isTaken ? 'pending' : 'taken';
    final updated = await doseRepo.markDoseStatus(
      doseId: dose.id,
      status: newStatus,
      confirmationMethod: 'manual',
    );

    state = AsyncData(
      (state.value ?? []).map((d) => d.id == dose.id ? updated : d).toList(),
    );
  }

  Future<void> markTaken(String doseId) async {
    final doseRepo = ref.read(doseRepositoryProvider);
    final updated = await doseRepo.markDoseStatus(
      doseId: doseId,
      status: 'taken',
      confirmationMethod: 'manual',
    );
    state = AsyncData(
      (state.value ?? []).map((d) => d.id == doseId ? updated : d).toList(),
    );
  }

  Future<void> snoozeDose(String doseId) async {
    final doseRepo = ref.read(doseRepositoryProvider);
    await doseRepo.snoozeDose(doseId, const Duration(minutes: 10));
    final list = await doseRepo.getTodayDoses(_currentPatientId);
    state = AsyncData(list);
  }
}

final patientProfileProvider = FutureProvider.autoDispose<PatientProfile>((ref) async {
  final repo = ref.watch(patientRepositoryProvider);
  final user = ref.watch(authStateProvider).user;
  final patientId =
      user?.profileData?['patientId']?.toString() ??
      user?.id ??
      '';
  return repo.getProfile(patientId);
});

final patientMedicationsProvider = FutureProvider.autoDispose<List<Medication>>(
  (ref) async {
    final repo = ref.watch(medicationRepositoryProvider);
    final user = ref.watch(authStateProvider).user;
    final patientId =
        user?.profileData?['patientId']?.toString() ??
        user?.id ??
        '';
    return repo.getPatientMedications(patientId);
  },
);

final patientMedicationsFamilyProvider = FutureProvider.autoDispose
    .family<List<Medication>, String>((ref, patientId) async {
      final repo = ref.watch(medicationRepositoryProvider);
      return repo.getPatientMedications(patientId);
    });

class SelectedScheduleDateNotifier extends Notifier<DateTime> {
  @override
  DateTime build() => DateTime.now();

  void selectDate(DateTime date) => state = date;
}

final selectedScheduleDateProvider =
    NotifierProvider<SelectedScheduleDateNotifier, DateTime>(() {
      return SelectedScheduleDateNotifier();
    });

final scheduleDosesForDateProvider = FutureProvider.autoDispose
    .family<List<DoseLog>, DateTime>((ref, date) async {
      final doseRepo = ref.watch(doseRepositoryProvider);
      final user = ref.watch(authStateProvider).user;
      final patientId =
          user?.profileData?['patientId']?.toString() ??
          user?.id ??
          'patient-001';
      return doseRepo.getDosesForDate(patientId, date);
    });
