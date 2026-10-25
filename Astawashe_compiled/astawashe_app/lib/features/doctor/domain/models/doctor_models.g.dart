part of 'doctor_models.dart';

Doctor _$DoctorFromJson(Map<String, dynamic> json) => Doctor(
  id: json['id'] as String,
  userId: json['userId'] as String,
  hospitalId: json['hospitalId'] as String,
  name: json['name'] as String,
  email: json['email'] as String?,
  phone: json['phone'] as String?,
  licenseNumber: json['licenseNumber'] as String?,
  specialization: json['specialization'] as String?,
  experience: json['experience'] as String?,
  status: json['status'] as String? ?? 'ACTIVE',
);

Map<String, dynamic> _$DoctorToJson(Doctor instance) => <String, dynamic>{
  'id': instance.id,
  'userId': instance.userId,
  'hospitalId': instance.hospitalId,
  'name': instance.name,
  'email': instance.email,
  'phone': instance.phone,
  'licenseNumber': instance.licenseNumber,
  'specialization': instance.specialization,
  'experience': instance.experience,
  'status': instance.status,
};

PatientSummary _$PatientSummaryFromJson(Map<String, dynamic> json) =>
    PatientSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      age: (json['age'] as num).toInt(),
      gender: json['gender'] as String,
      adherenceRate: (json['adherenceRate'] as num).toDouble(),
      activeMedsCount: (json['activeMedsCount'] as num).toInt(),
      status: json['status'] as String,
      lastDoseStatus: json['lastDoseStatus'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      phone: json['phone'] as String?,
    );

Map<String, dynamic> _$PatientSummaryToJson(PatientSummary instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'age': instance.age,
      'gender': instance.gender,
      'adherenceRate': instance.adherenceRate,
      'activeMedsCount': instance.activeMedsCount,
      'status': instance.status,
      'lastDoseStatus': instance.lastDoseStatus,
      'avatarUrl': instance.avatarUrl,
      'phone': instance.phone,
    };

Prescription _$PrescriptionFromJson(Map<String, dynamic> json) => Prescription(
  id: json['id'] as String,
  patientId: json['patientId'] as String,
  patientName: json['patientName'] as String,
  doctorId: json['doctorId'] as String,
  medicationName: json['medicationName'] as String,
  strength: json['strength'] as String,
  dosage: json['dosage'] as String,
  frequency: json['frequency'] as String,
  startDate: DateTime.parse(json['startDate'] as String),
  endDate: json['endDate'] == null
      ? null
      : DateTime.parse(json['endDate'] as String),
  notes: json['notes'] as String?,
  status: json['status'] as String? ?? 'ACTIVE',
);

Map<String, dynamic> _$PrescriptionToJson(Prescription instance) =>
    <String, dynamic>{
      'id': instance.id,
      'patientId': instance.patientId,
      'patientName': instance.patientName,
      'doctorId': instance.doctorId,
      'medicationName': instance.medicationName,
      'strength': instance.strength,
      'dosage': instance.dosage,
      'frequency': instance.frequency,
      'startDate': instance.startDate.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'notes': instance.notes,
      'status': instance.status,
    };

PatientApprovalRequest _$PatientApprovalRequestFromJson(
  Map<String, dynamic> json,
) => PatientApprovalRequest(
  id: json['id'] as String,
  patientId: json['patientId'] as String,
  patientName: json['patientName'] as String,
  email: json['email'] as String?,
  phone: json['phone'] as String?,
  requestedAt: DateTime.parse(json['requestedAt'] as String),
  reason: json['reason'] as String?,
  status: json['status'] as String? ?? 'PENDING',
);

Map<String, dynamic> _$PatientApprovalRequestToJson(
  PatientApprovalRequest instance,
) => <String, dynamic>{
  'id': instance.id,
  'patientId': instance.patientId,
  'patientName': instance.patientName,
  'email': instance.email,
  'phone': instance.phone,
  'requestedAt': instance.requestedAt.toIso8601String(),
  'reason': instance.reason,
  'status': instance.status,
};

DoctorDashboardData _$DoctorDashboardDataFromJson(Map<String, dynamic> json) =>
    DoctorDashboardData(
      doctor: Doctor.fromJson(json['doctor'] as Map<String, dynamic>),
      totalPatients: (json['totalPatients'] as num).toInt(),
      onTrackCount: (json['onTrackCount'] as num).toInt(),
      needAttentionCount: (json['needAttentionCount'] as num).toInt(),
      missedDoseCount: (json['missedDoseCount'] as num).toInt(),
      recentPatients: (json['recentPatients'] as List<dynamic>)
          .map((e) => PatientSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      pendingRequests: (json['pendingRequests'] as List<dynamic>)
          .map(
            (e) => PatientApprovalRequest.fromJson(e as Map<String, dynamic>),
          )
          .toList(),
      riskPatients: (json['riskPatients'] as List<dynamic>)
          .map((e) => PatientSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      averageAdherence: (json['averageAdherence'] as num).toDouble(),
    );

Map<String, dynamic> _$DoctorDashboardDataToJson(
  DoctorDashboardData instance,
) => <String, dynamic>{
  'doctor': instance.doctor.toJson(),
  'totalPatients': instance.totalPatients,
  'onTrackCount': instance.onTrackCount,
  'needAttentionCount': instance.needAttentionCount,
  'missedDoseCount': instance.missedDoseCount,
  'recentPatients': instance.recentPatients.map((e) => e.toJson()).toList(),
  'pendingRequests': instance.pendingRequests.map((e) => e.toJson()).toList(),
  'riskPatients': instance.riskPatients.map((e) => e.toJson()).toList(),
  'averageAdherence': instance.averageAdherence,
};
