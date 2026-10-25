part of 'patient_models.dart';

PatientProfile _$PatientProfileFromJson(Map<String, dynamic> json) =>
    PatientProfile(
      id: json['id'] as String,
      userId: json['userId'] as String,
      hospitalId: json['hospitalId'] as String,
      doctorId: json['doctorId'] as String,
      fullName: json['fullName'] as String,
      nickname: json['nickname'] as String?,
      dob: json['dob'] as String?,
      gender: json['gender'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      emergencyContact: json['emergencyContact'] as String?,
      emergencyContactPhone: json['emergencyContactPhone'] as String?,
      bloodGroup: json['bloodGroup'] as String?,
      allergies: json['allergies'] as String?,
      chronicConditions: json['chronicConditions'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      reminderMode: json['reminderMode'] as String? ?? 'VOICE',
      language: json['language'] as String? ?? 'en',
    );

Map<String, dynamic> _$PatientProfileToJson(PatientProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'hospitalId': instance.hospitalId,
      'doctorId': instance.doctorId,
      'fullName': instance.fullName,
      'nickname': instance.nickname,
      'dob': instance.dob,
      'gender': instance.gender,
      'phone': instance.phone,
      'address': instance.address,
      'emergencyContact': instance.emergencyContact,
      'emergencyContactPhone': instance.emergencyContactPhone,
      'bloodGroup': instance.bloodGroup,
      'allergies': instance.allergies,
      'chronicConditions': instance.chronicConditions,
      'status': instance.status,
      'reminderMode': instance.reminderMode,
      'language': instance.language,
    };

Medication _$MedicationFromJson(Map<String, dynamic> json) => Medication(
  id: json['id'] as String,
  patientId: json['patientId'] as String,
  doctorId: json['doctorId'] as String,
  name: json['name'] as String,
  dosage: json['dosage'] as String,
  form: json['form'] as String? ?? 'tablet',
  instructions: json['instructions'] as String,
  isActive: json['isActive'] as bool? ?? true,
  pillColor: json['pillColor'] as String?,
  pillBgColor: json['pillBgColor'] as String?,
);

Map<String, dynamic> _$MedicationToJson(Medication instance) =>
    <String, dynamic>{
      'id': instance.id,
      'patientId': instance.patientId,
      'doctorId': instance.doctorId,
      'name': instance.name,
      'dosage': instance.dosage,
      'form': instance.form,
      'instructions': instance.instructions,
      'isActive': instance.isActive,
      'pillColor': instance.pillColor,
      'pillBgColor': instance.pillBgColor,
    };

MedicationSchedule _$MedicationScheduleFromJson(Map<String, dynamic> json) =>
    MedicationSchedule(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      doctorId: json['doctorId'] as String,
      medicationId: json['medicationId'] as String,
      medicationName: json['medicationName'] as String,
      dosage: json['dosage'] as String,
      time: json['time'] as String,
      frequency: json['frequency'] as String,
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      isActive: json['isActive'] as bool? ?? true,
    );

Map<String, dynamic> _$MedicationScheduleToJson(MedicationSchedule instance) =>
    <String, dynamic>{
      'id': instance.id,
      'patientId': instance.patientId,
      'doctorId': instance.doctorId,
      'medicationId': instance.medicationId,
      'medicationName': instance.medicationName,
      'dosage': instance.dosage,
      'time': instance.time,
      'frequency': instance.frequency,
      'startDate': instance.startDate.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'isActive': instance.isActive,
    };

DoseLog _$DoseLogFromJson(Map<String, dynamic> json) => DoseLog(
  id: json['id'] as String,
  patientId: json['patientId'] as String,
  scheduleId: json['scheduleId'] as String,
  medicationName: json['medicationName'] as String,
  dosage: json['dosage'] as String,
  scheduledTime: json['scheduledTime'] as String,
  scheduledDate: DateTime.parse(json['scheduledDate'] as String),
  status: json['status'] as String,
  confirmationMethod: json['confirmationMethod'] as String?,
  confirmedAt: json['confirmedAt'] == null
      ? null
      : DateTime.parse(json['confirmedAt'] as String),
  notes: json['notes'] as String?,
  pillColor: json['pillColor'] as String?,
  pillBgColor: json['pillBgColor'] as String?,
);

Map<String, dynamic> _$DoseLogToJson(DoseLog instance) => <String, dynamic>{
  'id': instance.id,
  'patientId': instance.patientId,
  'scheduleId': instance.scheduleId,
  'medicationName': instance.medicationName,
  'dosage': instance.dosage,
  'scheduledTime': instance.scheduledTime,
  'scheduledDate': instance.scheduledDate.toIso8601String(),
  'status': instance.status,
  'confirmationMethod': instance.confirmationMethod,
  'confirmedAt': instance.confirmedAt?.toIso8601String(),
  'notes': instance.notes,
  'pillColor': instance.pillColor,
  'pillBgColor': instance.pillBgColor,
};

Guardian _$GuardianFromJson(Map<String, dynamic> json) => Guardian(
  id: json['id'] as String,
  patientId: json['patientId'] as String,
  name: json['name'] as String,
  relationship: json['relationship'] as String,
  phone: json['phone'] as String,
  email: json['email'] as String?,
  notifyOnMissedDoses: json['notifyOnMissedDoses'] as bool? ?? true,
);

Map<String, dynamic> _$GuardianToJson(Guardian instance) => <String, dynamic>{
  'id': instance.id,
  'patientId': instance.patientId,
  'name': instance.name,
  'relationship': instance.relationship,
  'phone': instance.phone,
  'email': instance.email,
  'notifyOnMissedDoses': instance.notifyOnMissedDoses,
};

PatientDashboardData _$PatientDashboardDataFromJson(
  Map<String, dynamic> json,
) => PatientDashboardData(
  patient: PatientProfile.fromJson(json['patient'] as Map<String, dynamic>),
  doctorName: json['doctorName'] as String,
  hospitalName: json['hospitalName'] as String,
  guardians: (json['guardians'] as List<dynamic>)
      .map((e) => Guardian.fromJson(e as Map<String, dynamic>))
      .toList(),
  todayDoses: (json['todayDoses'] as List<dynamic>)
      .map((e) => DoseLog.fromJson(e as Map<String, dynamic>))
      .toList(),
  adherenceRate: (json['adherenceRate'] as num).toDouble(),
  totalMedications: (json['totalMedications'] as num).toInt(),
  completedThisWeek: (json['completedThisWeek'] as num).toInt(),
  nextDose: json['nextDose'] == null
      ? null
      : DoseLog.fromJson(json['nextDose'] as Map<String, dynamic>),
);

Map<String, dynamic> _$PatientDashboardDataToJson(
  PatientDashboardData instance,
) => <String, dynamic>{
  'patient': instance.patient.toJson(),
  'doctorName': instance.doctorName,
  'hospitalName': instance.hospitalName,
  'guardians': instance.guardians.map((e) => e.toJson()).toList(),
  'todayDoses': instance.todayDoses.map((e) => e.toJson()).toList(),
  'adherenceRate': instance.adherenceRate,
  'totalMedications': instance.totalMedications,
  'completedThisWeek': instance.completedThisWeek,
  'nextDose': instance.nextDose?.toJson(),
};
