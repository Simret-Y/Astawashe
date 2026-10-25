import '../../domain/models/patient_models.dart';
import '../../domain/repositories/dose_repository.dart';

class MockDoseRepository implements DoseRepository {
  late List<DoseLog> _allDoses;

  MockDoseRepository() {
    _initMockData();
  }

  void _initMockData() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    _allDoses = [
      // Today's doses matching design image
      DoseLog(
        id: 'dose-today-1',
        patientId: 'patient-001',
        scheduleId: 'sched-1',
        medicationName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        scheduledTime: '10:00 AM',
        scheduledDate: today.add(const Duration(hours: 10)),
        status: 'taken',
        confirmationMethod: 'manual',
        confirmedAt: today.add(const Duration(hours: 10, minutes: 2)),
        pillColor: '0xFF10B981',
        pillBgColor: '0xFFD1FAE5',
      ),
      DoseLog(
        id: 'dose-today-2',
        patientId: 'patient-001',
        scheduleId: 'sched-2',
        medicationName: 'Vitamin D',
        dosage: '1 tablet',
        scheduledTime: '02:00 PM',
        scheduledDate: today.add(const Duration(hours: 14)),
        status: 'pending',
        pillColor: '0xFF06B6D4',
        pillBgColor: '0xFFCFFAFE',
      ),
      DoseLog(
        id: 'dose-today-3',
        patientId: 'patient-001',
        scheduleId: 'sched-3',
        medicationName: 'Metformin 500mg',
        dosage: '1 tablet',
        scheduledTime: '08:00 PM',
        scheduledDate: today.add(const Duration(hours: 20)),
        status: 'pending',
        pillColor: '0xFF8B5CF6',
        pillBgColor: '0xFFF3E8FF',
      ),

      // Yesterday
      DoseLog(
        id: 'dose-yest-1',
        patientId: 'patient-001',
        scheduleId: 'sched-1',
        medicationName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        scheduledTime: '10:00 AM',
        scheduledDate: today
            .subtract(const Duration(days: 1))
            .add(const Duration(hours: 10)),
        status: 'taken',
        confirmedAt: today
            .subtract(const Duration(days: 1))
            .add(const Duration(hours: 10, minutes: 5)),
        pillColor: '0xFF10B981',
        pillBgColor: '0xFFD1FAE5',
      ),
      DoseLog(
        id: 'dose-yest-2',
        patientId: 'patient-001',
        scheduleId: 'sched-2',
        medicationName: 'Vitamin D',
        dosage: '1 tablet',
        scheduledTime: '02:00 PM',
        scheduledDate: today
            .subtract(const Duration(days: 1))
            .add(const Duration(hours: 14)),
        status: 'taken',
        confirmedAt: today
            .subtract(const Duration(days: 1))
            .add(const Duration(hours: 14, minutes: 12)),
        pillColor: '0xFF06B6D4',
        pillBgColor: '0xFFCFFAFE',
      ),
      DoseLog(
        id: 'dose-yest-3',
        patientId: 'patient-001',
        scheduleId: 'sched-3',
        medicationName: 'Metformin 500mg',
        dosage: '1 tablet',
        scheduledTime: '08:00 PM',
        scheduledDate: today
            .subtract(const Duration(days: 1))
            .add(const Duration(hours: 20)),
        status: 'taken',
        confirmedAt: today
            .subtract(const Duration(days: 1))
            .add(const Duration(hours: 20, minutes: 1)),
        pillColor: '0xFF8B5CF6',
        pillBgColor: '0xFFF3E8FF',
      ),

      // 2 days ago (includes one missed dose for realistic adherence)
      DoseLog(
        id: 'dose-prev-1',
        patientId: 'patient-001',
        scheduleId: 'sched-1',
        medicationName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        scheduledTime: '10:00 AM',
        scheduledDate: today
            .subtract(const Duration(days: 2))
            .add(const Duration(hours: 10)),
        status: 'taken',
        pillColor: '0xFF10B981',
        pillBgColor: '0xFFD1FAE5',
      ),
      DoseLog(
        id: 'dose-prev-2',
        patientId: 'patient-001',
        scheduleId: 'sched-2',
        medicationName: 'Vitamin D',
        dosage: '1 tablet',
        scheduledTime: '02:00 PM',
        scheduledDate: today
            .subtract(const Duration(days: 2))
            .add(const Duration(hours: 14)),
        status: 'missed',
        pillColor: '0xFF06B6D4',
        pillBgColor: '0xFFCFFAFE',
      ),
      DoseLog(
        id: 'dose-prev-3',
        patientId: 'patient-001',
        scheduleId: 'sched-3',
        medicationName: 'Metformin 500mg',
        dosage: '1 tablet',
        scheduledTime: '08:00 PM',
        scheduledDate: today
            .subtract(const Duration(days: 2))
            .add(const Duration(hours: 20)),
        status: 'taken',
        pillColor: '0xFF8B5CF6',
        pillBgColor: '0xFFF3E8FF',
      ),
    ];
  }

  @override
  Future<List<DoseLog>> getTodayDoses(String patientId) async {
    await Future.delayed(const Duration(milliseconds: 250));
    final now = DateTime.now();
    return _allDoses
        .where(
          (d) =>
              d.patientId == patientId &&
              d.scheduledDate.year == now.year &&
              d.scheduledDate.month == now.month &&
              d.scheduledDate.day == now.day,
        )
        .toList();
  }

  @override
  Future<List<DoseLog>> getDosesForDate(String patientId, DateTime date) async {
    await Future.delayed(const Duration(milliseconds: 200));
    final matches = _allDoses
        .where(
          (d) =>
              d.patientId == patientId &&
              d.scheduledDate.year == date.year &&
              d.scheduledDate.month == date.month &&
              d.scheduledDate.day == date.day,
        )
        .toList();

    if (matches.isNotEmpty) return matches;

    // Generate consistent day doses for past/future week days
    final isWeekend =
        date.weekday == DateTime.saturday || date.weekday == DateTime.sunday;
    return [
      DoseLog(
        id: 'dose-${date.millisecondsSinceEpoch}-1',
        patientId: patientId,
        scheduleId: 'sched-1',
        medicationName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        scheduledTime: '10:00 AM',
        scheduledDate: DateTime(date.year, date.month, date.day, 10),
        status: date.isAfter(DateTime.now())
            ? 'pending'
            : (isWeekend ? 'missed' : 'taken'),
        pillColor: '0xFF10B981',
        pillBgColor: '0xFFD1FAE5',
      ),
      DoseLog(
        id: 'dose-${date.millisecondsSinceEpoch}-2',
        patientId: patientId,
        scheduleId: 'sched-2',
        medicationName: 'Vitamin D',
        dosage: '1 tablet',
        scheduledTime: '02:00 PM',
        scheduledDate: DateTime(date.year, date.month, date.day, 14),
        status: date.isAfter(DateTime.now()) ? 'pending' : 'taken',
        pillColor: '0xFF06B6D4',
        pillBgColor: '0xFFCFFAFE',
      ),
      DoseLog(
        id: 'dose-${date.millisecondsSinceEpoch}-3',
        patientId: patientId,
        scheduleId: 'sched-3',
        medicationName: 'Metformin 500mg',
        dosage: '1 tablet',
        scheduledTime: '08:00 PM',
        scheduledDate: DateTime(date.year, date.month, date.day, 20),
        status: date.isAfter(DateTime.now()) ? 'pending' : 'taken',
        pillColor: '0xFF8B5CF6',
        pillBgColor: '0xFFF3E8FF',
      ),
    ];
  }

  @override
  Future<DoseLog> markDoseStatus({
    required String doseId,
    required String status,
    String? confirmationMethod,
  }) async {
    await Future.delayed(const Duration(milliseconds: 200));
    final index = _allDoses.indexWhere((d) => d.id == doseId);
    if (index >= 0) {
      final updated = _allDoses[index].copyWith(
        status: status,
        confirmedAt: status == 'taken' ? DateTime.now() : null,
        confirmationMethod: confirmationMethod ?? 'manual',
      );
      _allDoses[index] = updated;
      return updated;
    }

    // If dynamic dose, create and return updated
    return DoseLog(
      id: doseId,
      patientId: 'patient-001',
      scheduleId: 'sched-1',
      medicationName: 'Paracetamol 500mg',
      dosage: '1 tablet',
      scheduledTime: '10:00 AM',
      scheduledDate: DateTime.now(),
      status: status,
      confirmedAt: status == 'taken' ? DateTime.now() : null,
      confirmationMethod: confirmationMethod ?? 'manual',
      pillColor: '0xFF10B981',
      pillBgColor: '0xFFD1FAE5',
    );
  }

  @override
  Future<void> snoozeDose(String doseId, Duration duration) async {
    await Future.delayed(const Duration(milliseconds: 150));
    final index = _allDoses.indexWhere((d) => d.id == doseId);
    if (index >= 0) {
      _allDoses[index] = _allDoses[index].copyWith(
        status: 'snoozed',
        notes: 'Snoozed for ${duration.inMinutes} minutes',
      );
    }
  }

  @override
  Future<Map<String, dynamic>> getAdherenceStats(String patientId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return {
      'todayDosesCount': 3,
      'todayTakenCount': 1,
      'weeklyTotalDoses': 21,
      'weeklyCompleted': 14,
      'monthlyAdherence': 93.0,
      'streakDays': 5,
    };
  }

  @override
  Future<DoseLog?> getNextDose(String patientId) async {
    final todayDoses = await getTodayDoses(patientId);
    for (final dose in todayDoses) {
      if (dose.isPending) return dose;
    }
    return todayDoses.isNotEmpty ? todayDoses.first : null;
  }
}
