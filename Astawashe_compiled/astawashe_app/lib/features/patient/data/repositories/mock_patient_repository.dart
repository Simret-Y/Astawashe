import 'package:astawashe_app/features/patient/domain/models/patient_models.dart';
import 'package:astawashe_app/features/doctor/domain/models/doctor_models.dart';
import 'package:astawashe_app/features/patient/domain/repositories/patient_repository.dart';

class MockPatientRepository implements PatientRepository {
  late PatientProfile _patientProfile;
  late List<Guardian> _guardians;
  late List<PatientSummary> _doctorPatients;
  late List<PatientApprovalRequest> _pendingRequests;

  MockPatientRepository() {
    _initMockData();
  }

  void _initMockData() {
    _patientProfile = const PatientProfile(
      id: 'patient-001',
      userId: 'user-p1',
      hospitalId: 'hosp-1',
      doctorId: 'doctor-001',
      fullName: 'Sophie Bewuketu',
      nickname: 'Sophie',
      dob: '1996-05-14',
      gender: 'Female',
      phone: '+251911223344',
      address: 'Bole, Addis Ababa, Ethiopia',
      emergencyContact: 'Abebe Bewuketu (Brother)',
      emergencyContactPhone: '+251911887766',
      bloodGroup: 'O+',
      allergies: 'Penicillin',
      chronicConditions: 'Hypertension',
      status: 'ACTIVE',
      reminderMode: 'VOICE',
      language: 'en',
    );

    _guardians = [
      const Guardian(
        id: 'guard-1',
        patientId: 'patient-001',
        name: 'Abebe Bewuketu',
        relationship: 'Brother',
        phone: '+251911887766',
        notifyOnMissedDoses: true,
      ),
      const Guardian(
        id: 'guard-2',
        patientId: 'patient-001',
        name: 'Fatuma Ali',
        relationship: 'Mother',
        phone: '+251922331100',
        notifyOnMissedDoses: true,
      ),
    ];

    _doctorPatients = [
      const PatientSummary(
        id: 'p-sara',
        name: 'Sara Mohamed',
        age: 29,
        gender: 'Female',
        adherenceRate: 98.0,
        activeMedsCount: 3,
        status: 'on_track',
        lastDoseStatus: 'Taken on time',
        phone: '+251911224466',
      ),
      const PatientSummary(
        id: 'p-khalid',
        name: 'Khalid Abebe',
        age: 45,
        gender: 'Male',
        adherenceRate: 85.0,
        activeMedsCount: 2,
        status: 'on_track',
        lastDoseStatus: 'Taken on time',
        phone: '+251922335577',
      ),
      const PatientSummary(
        id: 'p-amina',
        name: 'Amina Tesfaye',
        age: 34,
        gender: 'Female',
        adherenceRate: 72.0,
        activeMedsCount: 4,
        status: 'needs_attention',
        lastDoseStatus: 'Missed 2 doses',
        phone: '+251933446688',
      ),
      const PatientSummary(
        id: 'p-daniel',
        name: 'Daniel Girma',
        age: 52,
        gender: 'Male',
        adherenceRate: 96.0,
        activeMedsCount: 1,
        status: 'on_track',
        lastDoseStatus: 'Taken on time',
        phone: '+251944557799',
      ),
      const PatientSummary(
        id: 'p-lidya',
        name: 'Lidya Kassa',
        age: 38,
        gender: 'Female',
        adherenceRate: 90.0,
        activeMedsCount: 2,
        status: 'on_track',
        lastDoseStatus: 'Taken on time',
        phone: '+251955668800',
      ),
      const PatientSummary(
        id: 'p-getachew',
        name: 'Getachew Alemu',
        age: 61,
        gender: 'Male',
        adherenceRate: 67.0,
        activeMedsCount: 3,
        status: 'needs_attention',
        lastDoseStatus: 'Missed yesterday evening',
        phone: '+251966779911',
      ),
    ];

    final now = DateTime.now();
    _pendingRequests = [
      PatientApprovalRequest(
        id: 'req-1',
        patientId: 'patient-req-1',
        patientName: 'Yared Bekele',
        email: 'yared.b@gmail.com',
        phone: '+251911778899',
        requestedAt: now.subtract(const Duration(hours: 2)),
        reason: 'Referred for hypertension management and dose tracking.',
      ),
      PatientApprovalRequest(
        id: 'req-2',
        patientId: 'patient-req-2',
        patientName: 'Martha Hailu',
        email: 'martha.h@gmail.com',
        phone: '+251922665544',
        requestedAt: now.subtract(const Duration(days: 1)),
        reason: 'Type 2 Diabetes follow-up and reminder setup.',
      ),
    ];
  }

  @override
  Future<PatientProfile> getProfile(String patientId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _patientProfile;
  }

  @override
  Future<PatientDashboardData> getDashboardData(String patientId) async {
    await Future.delayed(const Duration(milliseconds: 250));
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final todayDoses = [
      DoseLog(
        id: 'dose-today-1',
        patientId: patientId,
        scheduleId: 'sched-1',
        medicationName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        scheduledTime: '10:00 AM',
        scheduledDate: today.add(const Duration(hours: 10)),
        status: 'taken',
        pillColor: '0xFF10B981',
        pillBgColor: '0xFFD1FAE5',
      ),
      DoseLog(
        id: 'dose-today-2',
        patientId: patientId,
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
        patientId: patientId,
        scheduleId: 'sched-3',
        medicationName: 'Metformin 500mg',
        dosage: '1 tablet',
        scheduledTime: '08:00 PM',
        scheduledDate: today.add(const Duration(hours: 20)),
        status: 'pending',
        pillColor: '0xFF8B5CF6',
        pillBgColor: '0xFFF3E8FF',
      ),
    ];

    return PatientDashboardData(
      patient: _patientProfile,
      doctorName: 'Dr. Ahmed Mohammed',
      hospitalName: 'Tikur Anbessa Hospital',
      guardians: _guardians,
      todayDoses: todayDoses,
      adherenceRate: 93.0,
      totalMedications: 3,
      completedThisWeek: 14,
      nextDose: todayDoses.firstWhere(
        (d) => d.isPending,
        orElse: () => todayDoses.first,
      ),
    );
  }

  @override
  Future<void> updateReminderMode(String patientId, String reminderMode) async {
    await Future.delayed(const Duration(milliseconds: 150));
    _patientProfile = _patientProfile.copyWith(reminderMode: reminderMode);
  }

  @override
  Future<List<Guardian>> getGuardians(String patientId) async {
    await Future.delayed(const Duration(milliseconds: 150));
    return _guardians;
  }

  @override
  Future<Guardian> addGuardian(String patientId, Guardian guardian) async {
    await Future.delayed(const Duration(milliseconds: 200));
    _guardians.add(guardian);
    return guardian;
  }

  @override
  Future<List<PatientSummary>> getDoctorPatients({
    String? query,
    String? filter,
  }) async {
    await Future.delayed(const Duration(milliseconds: 200));
    var list = List<PatientSummary>.from(_doctorPatients);

    if (query != null && query.trim().isNotEmpty) {
      final q = query.trim().toLowerCase();
      list = list.where((p) => p.name.toLowerCase().contains(q)).toList();
    }

    if (filter != null && filter != 'All') {
      if (filter == 'On Track') {
        list = list.where((p) => p.isOnTrack).toList();
      } else if (filter == 'Needs Attention') {
        list = list.where((p) => !p.isOnTrack).toList();
      }
    }

    return list;
  }

  @override
  Future<PatientSummary?> getPatientDetail(String patientId) async {
    await Future.delayed(const Duration(milliseconds: 150));
    try {
      return _doctorPatients.firstWhere((p) => p.id == patientId);
    } catch (_) {
      return const PatientSummary(
        id: 'p-amina',
        name: 'Amina Tesfaye',
        age: 34,
        gender: 'Female',
        adherenceRate: 72.0,
        activeMedsCount: 3,
        status: 'needs_attention',
        lastDoseStatus: 'Missed 2 doses this week',
        phone: '+251933446688',
      );
    }
  }

  @override
  Future<DoctorDashboardData> getDoctorDashboard(String doctorId) async {
    await Future.delayed(const Duration(milliseconds: 250));
    return DoctorDashboardData(
      doctor: const Doctor(
        id: 'doctor-001',
        userId: 'user-d1',
        hospitalId: 'hosp-1',
        name: 'Dr. Ahmed',
        specialization: 'Internal Medicine',
        experience: '8 years',
        status: 'ACTIVE',
      ),
      totalPatients: 24,
      onTrackCount: 20,
      needAttentionCount: 3,
      missedDoseCount: 1,
      recentPatients: _doctorPatients.take(4).toList(),
      pendingRequests: _pendingRequests,
      riskPatients: _doctorPatients.where((p) => !p.isOnTrack).toList(),
      averageAdherence: 72.0,
    );
  }

  @override
  Future<List<PatientApprovalRequest>> getPendingRequests(
    String doctorId,
  ) async {
    await Future.delayed(const Duration(milliseconds: 150));
    return _pendingRequests.where((r) => r.status == 'PENDING').toList();
  }

  @override
  Future<void> handleApprovalRequest(String requestId, String action) async {
    await Future.delayed(const Duration(milliseconds: 200));
    final index = _pendingRequests.indexWhere((r) => r.id == requestId);
    if (index >= 0) {
      final req = _pendingRequests[index];
      _pendingRequests[index] = PatientApprovalRequest(
        id: req.id,
        patientId: req.patientId,
        patientName: req.patientName,
        email: req.email,
        phone: req.phone,
        requestedAt: req.requestedAt,
        reason: req.reason,
        status: action == 'APPROVE' ? 'APPROVED' : 'REJECTED',
      );
    }
  }
}
