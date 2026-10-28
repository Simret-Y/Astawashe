import 'package:dio/dio.dart';
import 'package:astawashe_app/features/patient/domain/models/patient_models.dart';
import 'package:astawashe_app/features/doctor/domain/models/doctor_models.dart';
import 'package:astawashe_app/features/patient/domain/repositories/patient_repository.dart';

class RemotePatientRepository implements PatientRepository {
  final Dio dio;

  RemotePatientRepository({required this.dio});

  @override
  Future<PatientProfile> getProfile(String patientId) async {
    Response response;
    try {
      response = await dio.get('/patients/$patientId');
    } catch (_) {
      response = await dio.get('/patients/me');
    }

    final raw = response.data;
    final data = (raw is Map<String, dynamic> && raw.containsKey('data'))
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;

    return PatientProfile(
      id: data['id']?.toString() ?? patientId,
      userId: data['userId']?.toString() ?? '',
      hospitalId: data['hospitalId']?.toString() ?? '',
      doctorId: data['doctorId']?.toString() ?? '',
      fullName: data['fullName']?.toString() ?? 'Patient',
      nickname: data['nickname']?.toString(),
      dob: data['dob']?.toString(),
      gender: data['gender']?.toString(),
      phone: data['phone']?.toString(),
      address: data['address']?.toString(),
      emergencyContact: data['emergencyContact']?.toString(),
      emergencyContactPhone: data['emergencyContactPhone']?.toString(),
      bloodGroup: data['bloodGroup']?.toString(),
      allergies: data['allergies']?.toString(),
      chronicConditions: data['chronicConditions']?.toString(),
      status: data['status']?.toString() ?? 'ACTIVE',
      reminderMode: data['reminderMode']?.toString() ?? 'VOICE',
      language: data['language']?.toString() ?? 'en',
    );
  }

  @override
  Future<PatientDashboardData> getDashboardData(String patientId) async {
    final response = await dio.get('/dashboards/patient');
    final data = response.data['data'] as Map<String, dynamic>? ?? {};

    final pJson = data['patient'] as Map<String, dynamic>? ?? {};
    final patient = PatientProfile(
      id: pJson['id']?.toString() ?? patientId,
      userId: pJson['userId']?.toString() ?? '',
      hospitalId: pJson['hospitalId']?.toString() ?? '',
      doctorId:
          data['doctor']?['id']?.toString() ??
          pJson['doctorId']?.toString() ??
          '',
      fullName: pJson['fullName']?.toString() ?? 'Patient',
      nickname: pJson['nickname']?.toString(),
      dob: pJson['dob']?.toString(),
      gender: pJson['gender']?.toString(),
      phone: pJson['phone']?.toString(),
      address: pJson['address']?.toString(),
      emergencyContact: pJson['emergencyContact']?.toString(),
      emergencyContactPhone: pJson['emergencyContactPhone']?.toString(),
      bloodGroup: pJson['bloodGroup']?.toString(),
      allergies: pJson['allergies']?.toString(),
      chronicConditions: pJson['chronicConditions']?.toString(),
      status: pJson['status']?.toString() ?? 'ACTIVE',
      reminderMode: pJson['reminderMode']?.toString() ?? 'VOICE',
      language: pJson['language']?.toString() ?? 'en',
    );

    final doctorName = data['doctor']?['name']?.toString() ?? 'Assigned Doctor';
    final hospitalName =
        data['hospitalName']?.toString() ?? 'AstaWashe General Hospital';

    final guardiansList = (data['guardians'] as List<dynamic>? ?? []).map((g) {
      final gMap = g as Map<String, dynamic>;
      return Guardian(
        id: gMap['id']?.toString() ?? '',
        patientId: patient.id,
        name: gMap['name']?.toString() ?? 'Family Guardian',
        relationship: gMap['relationship']?.toString() ?? 'Caregiver',
        phone: gMap['phone']?.toString() ?? '',
        email: gMap['email']?.toString(),
        notifyOnMissedDoses: true,
      );
    }).toList();

    final schedulesList = data['today']?['schedules'] as List<dynamic>? ?? [];
    final todayDoses = schedulesList.map((s) {
      final sMap = s as Map<String, dynamic>;
      return DoseLog(
        id: sMap['id']?.toString() ?? '',
        patientId: patient.id,
        scheduleId: sMap['id']?.toString() ?? '',
        medicationName: sMap['medication']?.toString() ?? 'Medication',
        dosage: sMap['dosage']?.toString() ?? '1 dose',
        scheduledTime: sMap['time']?.toString() ?? '08:00 AM',
        scheduledDate: DateTime.now(),
        status: (sMap['doseStatus'] ?? 'pending').toString().toLowerCase(),
      );
    }).toList();

    final adherence =
        (data['today']?['adherenceRate'] as num?)?.toDouble() ??
        double.tryParse(
          data['recentWeek']?['adherenceRate']?.toString() ?? '0',
        ) ??
        0.0;

    final completedThisWeek =
        (data['recentWeek']?['stats']?['taken'] as num?)?.toInt() ?? 0;

    final nextDose = todayDoses.isNotEmpty
        ? todayDoses.firstWhere(
            (d) => d.isPending,
            orElse: () => todayDoses.first,
          )
        : null;

    return PatientDashboardData(
      patient: patient,
      doctorName: doctorName,
      hospitalName: hospitalName,
      guardians: guardiansList,
      todayDoses: todayDoses,
      adherenceRate: adherence,
      totalMedications: schedulesList.length,
      completedThisWeek: completedThisWeek,
      nextDose: nextDose,
    );
  }

  @override
  Future<void> updateReminderMode(String patientId, String reminderMode) async {
    await dio.patch(
      '/patients/$patientId/reminder-mode',
      data: {'reminderMode': reminderMode},
    );
  }

  @override
  Future<List<Guardian>> getGuardians(String patientId) async {
    final response = await dio.get('/patients/$patientId/guardians');
    final list = response.data['data'] as List<dynamic>? ?? [];
    return list
        .map((e) => Guardian.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<Guardian> addGuardian(String patientId, Guardian guardian) async {
    final response = await dio.post(
      '/patients/$patientId/guardians',
      data: guardian.toJson(),
    );
    return Guardian.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  @override
  Future<List<PatientSummary>> getDoctorPatients({
    String? query,
    String? filter,
  }) async {
    final queryParams = <String, dynamic>{};
    if (query != null) queryParams['query'] = query;
    if (filter != null) queryParams['filter'] = filter;

    final response = await dio.get(
      '/doctor/patients',
      queryParameters: queryParams,
    );
    final list = response.data['data'] as List<dynamic>? ?? [];
    return list
        .map((e) => PatientSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<PatientSummary?> getPatientDetail(String patientId) async {
    Response? pRes;
    try {
      pRes = await dio.get('/patients/$patientId');
    } catch (_) {
      try {
        pRes = await dio.get('/patients/me');
      } catch (_) {}
    }

    Response? adhRes;
    try {
      adhRes = await dio.get('/adherence/doctor/patients/$patientId');
    } catch (_) {}

    final pRaw = pRes?.data;
    final pData = (pRaw is Map<String, dynamic> && pRaw.containsKey('data'))
        ? pRaw['data'] as Map<String, dynamic>
        : (pRaw is Map<String, dynamic> ? pRaw : <String, dynamic>{});

    final aRaw = adhRes?.data;
    final aData = (aRaw is Map<String, dynamic> && aRaw.containsKey('data'))
        ? aRaw['data'] as Map<String, dynamic>
        : (aRaw is Map<String, dynamic> ? aRaw : <String, dynamic>{});

    final adherence =
        (aData['thisWeek']?['adherenceRate'] as num?)?.toDouble() ??
        (aData['today']?['adherenceRate'] as num?)?.toDouble() ??
        0.0;

    String status = 'on_track';
    if (adherence < 60) {
      status = 'high_risk';
    } else if (adherence < 80) {
      status = 'needs_attention';
    }

    final dobStr = pData['dob']?.toString();
    int age = 35;
    if (dobStr != null) {
      final dob = DateTime.tryParse(dobStr);
      if (dob != null) {
        age = DateTime.now().year - dob.year;
      }
    }

    final schedules = pData['schedules'] as List<dynamic>? ?? [];

    return PatientSummary(
      id: pData['id']?.toString() ?? patientId,
      name:
          pData['nickname']?.toString() ??
          pData['fullName']?.toString() ??
          'Patient',
      age: age,
      gender: pData['gender']?.toString() ?? 'Not specified',
      adherenceRate: adherence,
      activeMedsCount: schedules.isNotEmpty ? schedules.length : 1,
      status: status,
      lastDoseStatus: 'pending',
      phone: pData['phone']?.toString(),
    );
  }

  @override
  Future<DoctorDashboardData> getDoctorDashboard(String doctorId) async {
    final response = await dio.get('/dashboards/doctor');
    final data = response.data['data'] as Map<String, dynamic>? ?? {};

    final dMap = data['doctor'] as Map<String, dynamic>? ?? {};
    final doctor = Doctor(
      id: dMap['id']?.toString() ?? doctorId,
      userId: dMap['userId']?.toString() ?? '',
      hospitalId: dMap['hospitalId']?.toString() ?? '',
      name: dMap['name']?.toString() ?? 'Doctor',
      email: dMap['email']?.toString(),
      phone: dMap['phone']?.toString(),
      specialization: dMap['specialization']?.toString() ?? 'General Physician',
      status: dMap['status']?.toString() ?? 'ACTIVE',
    );

    final stats = data['stats'] as Map<String, dynamic>? ?? {};
    final totalPatients = (stats['totalPatients'] as num?)?.toInt() ?? 0;
    final missedDoseCount = (stats['missedDosesToday'] as num?)?.toInt() ?? 0;

    List<PatientSummary> parsePatients(List<dynamic>? rawList) {
      if (rawList == null) return [];
      return rawList.map((p) {
        final pMap = p as Map<String, dynamic>;
        final adherence =
            (pMap['adherenceToday'] as num?)?.toDouble() ??
            (pMap['adherenceRate'] as num?)?.toDouble() ??
            0.0;
        String status = 'on_track';
        if (adherence < 60) {
          status = 'high_risk';
        } else if (adherence < 80) {
          status = 'needs_attention';
        }

        return PatientSummary(
          id: pMap['id']?.toString() ?? '',
          name:
              pMap['nickname']?.toString() ??
              pMap['fullName']?.toString() ??
              'Patient',
          age: (pMap['age'] as num?)?.toInt() ?? 35,
          gender: pMap['gender']?.toString() ?? 'Not specified',
          adherenceRate: adherence,
          activeMedsCount: (pMap['medicationCount'] as num?)?.toInt() ?? 1,
          status: status,
          lastDoseStatus: pMap['lastDoseStatus']?.toString() ?? 'pending',
          phone:
              pMap['phone']?.toString() ?? pMap['user']?['phone']?.toString(),
        );
      }).toList();
    }

    final recentPatients = parsePatients(data['patients'] as List<dynamic>?);
    final riskPatients = parsePatients(data['riskPatients'] as List<dynamic>?);

    final pendingList = data['pendingPatientsList'] as List<dynamic>? ?? [];
    final pendingRequests = pendingList.map((req) {
      final reqMap = req as Map<String, dynamic>;
      return PatientApprovalRequest(
        id: reqMap['id']?.toString() ?? '',
        patientId: reqMap['id']?.toString() ?? '',
        patientName:
            reqMap['nickname']?.toString() ??
            reqMap['fullName']?.toString() ??
            'New Patient',
        email: reqMap['user']?['email']?.toString(),
        phone:
            reqMap['user']?['phone']?.toString() ?? reqMap['phone']?.toString(),
        requestedAt: reqMap['createdAt'] != null
            ? DateTime.tryParse(reqMap['createdAt'].toString()) ??
                  DateTime.now()
            : DateTime.now(),
        reason: reqMap['hospital']?['name'] != null
            ? 'Hospital: ${reqMap['hospital']['name']}'
            : 'Registration request',
        status: reqMap['status']?.toString() ?? 'PENDING',
      );
    }).toList();

    final onTrackCount = recentPatients.where((p) => p.isOnTrack).length;
    final needAttentionCount = recentPatients
        .where((p) => p.needsAttention || p.isHighRisk)
        .length;
    final averageAdherence =
        double.tryParse(data['averageAdherence']?.toString() ?? '0') ?? 0.0;

    return DoctorDashboardData(
      doctor: doctor,
      totalPatients: totalPatients,
      onTrackCount: onTrackCount,
      needAttentionCount: needAttentionCount,
      missedDoseCount: missedDoseCount,
      recentPatients: recentPatients,
      pendingRequests: pendingRequests,
      riskPatients: riskPatients,
      averageAdherence: averageAdherence,
    );
  }

  @override
  Future<List<PatientApprovalRequest>> getPendingRequests(
    String doctorId,
  ) async {
    final response = await dio.get('/approvals/doctor/patients/pending');
    final list = response.data['data'] as List<dynamic>? ?? [];
    return list.map((e) {
      final map = e as Map<String, dynamic>;
      return PatientApprovalRequest(
        id: map['id']?.toString() ?? '',
        patientId: map['id']?.toString() ?? '',
        patientName:
            map['nickname']?.toString() ??
            map['fullName']?.toString() ??
            'New Patient',
        email: map['user']?['email']?.toString(),
        phone: map['user']?['phone']?.toString() ?? map['phone']?.toString(),
        requestedAt: map['createdAt'] != null
            ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
            : DateTime.now(),
        reason: map['hospital']?['name'] != null
            ? 'Hospital: ${map['hospital']['name']}'
            : 'Registration request',
        status: map['status']?.toString() ?? 'PENDING',
      );
    }).toList();
  }

  @override
  Future<void> handleApprovalRequest(String requestId, String action) async {
    final nickSuffix = requestId.length >= 4
        ? requestId.substring(0, 4)
        : requestId;
    await dio.post(
      '/approvals/doctor/patients/$requestId/approve',
      data: {'action': action.toUpperCase(), 'nickname': 'Patient_$nickSuffix'},
    );
  }
}
