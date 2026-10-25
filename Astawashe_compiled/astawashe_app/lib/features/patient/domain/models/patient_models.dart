import 'package:json_annotation/json_annotation.dart';

part 'patient_models.g.dart';

@JsonSerializable()
class PatientProfile {
  final String id;
  final String userId;
  final String hospitalId;
  final String doctorId;
  final String fullName;
  final String? nickname;
  final String? dob;
  final String? gender;
  final String? phone;
  final String? address;
  final String? emergencyContact;
  final String? emergencyContactPhone;
  final String? bloodGroup;
  final String? allergies;
  final String? chronicConditions;
  final String status;
  final String reminderMode; // 'VOICE' | 'USSD' | 'SMS' | 'PUSH'
  final String language; // 'en' | 'am'

  const PatientProfile({
    required this.id,
    required this.userId,
    required this.hospitalId,
    required this.doctorId,
    required this.fullName,
    this.nickname,
    this.dob,
    this.gender,
    this.phone,
    this.address,
    this.emergencyContact,
    this.emergencyContactPhone,
    this.bloodGroup,
    this.allergies,
    this.chronicConditions,
    this.status = 'ACTIVE',
    this.reminderMode = 'VOICE',
    this.language = 'en',
  });

  factory PatientProfile.fromJson(Map<String, dynamic> json) =>
      _$PatientProfileFromJson(json);
  Map<String, dynamic> toJson() => _$PatientProfileToJson(this);

  PatientProfile copyWith({
    String? id,
    String? userId,
    String? hospitalId,
    String? doctorId,
    String? fullName,
    String? nickname,
    String? dob,
    String? gender,
    String? phone,
    String? address,
    String? emergencyContact,
    String? emergencyContactPhone,
    String? bloodGroup,
    String? allergies,
    String? chronicConditions,
    String? status,
    String? reminderMode,
    String? language,
  }) {
    return PatientProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      hospitalId: hospitalId ?? this.hospitalId,
      doctorId: doctorId ?? this.doctorId,
      fullName: fullName ?? this.fullName,
      nickname: nickname ?? this.nickname,
      dob: dob ?? this.dob,
      gender: gender ?? this.gender,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      emergencyContact: emergencyContact ?? this.emergencyContact,
      emergencyContactPhone:
          emergencyContactPhone ?? this.emergencyContactPhone,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      allergies: allergies ?? this.allergies,
      chronicConditions: chronicConditions ?? this.chronicConditions,
      status: status ?? this.status,
      reminderMode: reminderMode ?? this.reminderMode,
      language: language ?? this.language,
    );
  }
}

@JsonSerializable()
class Medication {
  final String id;
  final String patientId;
  final String doctorId;
  final String name;
  final String dosage;
  final String form; // 'tablet' | 'capsule' | 'syrup' | 'injection'
  final String instructions;
  final bool isActive;
  final String? pillColor;
  final String? pillBgColor;

  const Medication({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.name,
    required this.dosage,
    this.form = 'tablet',
    required this.instructions,
    this.isActive = true,
    this.pillColor,
    this.pillBgColor,
  });

  factory Medication.fromJson(Map<String, dynamic> json) =>
      _$MedicationFromJson(json);
  Map<String, dynamic> toJson() => _$MedicationToJson(this);
}

@JsonSerializable()
class MedicationSchedule {
  final String id;
  final String patientId;
  final String doctorId;
  final String medicationId;
  final String medicationName;
  final String dosage;
  final String time; // '10:00 AM', '02:00 PM', '08:00 PM'
  final String frequency; // 'Once daily', 'Twice daily', etc.
  final DateTime startDate;
  final DateTime? endDate;
  final bool isActive;

  const MedicationSchedule({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.medicationId,
    required this.medicationName,
    required this.dosage,
    required this.time,
    required this.frequency,
    required this.startDate,
    this.endDate,
    this.isActive = true,
  });

  factory MedicationSchedule.fromJson(Map<String, dynamic> json) =>
      _$MedicationScheduleFromJson(json);
  Map<String, dynamic> toJson() => _$MedicationScheduleToJson(this);
}

@JsonSerializable()
class DoseLog {
  final String id;
  final String patientId;
  final String scheduleId;
  final String medicationName;
  final String dosage;
  final String scheduledTime;
  final DateTime scheduledDate;
  final String status; // 'taken', 'pending', 'missed', 'snoozed'
  final String? confirmationMethod; // 'manual', 'voice', 'ussd'
  final DateTime? confirmedAt;
  final String? notes;
  final String? pillColor;
  final String? pillBgColor;

  const DoseLog({
    required this.id,
    required this.patientId,
    required this.scheduleId,
    required this.medicationName,
    required this.dosage,
    required this.scheduledTime,
    required this.scheduledDate,
    required this.status,
    this.confirmationMethod,
    this.confirmedAt,
    this.notes,
    this.pillColor,
    this.pillBgColor,
  });

  bool get isTaken => status.toLowerCase() == 'taken';
  bool get isMissed => status.toLowerCase() == 'missed';
  bool get isPending => status.toLowerCase() == 'pending';
  bool get isSnoozed => status.toLowerCase() == 'snoozed';

  DoseLog copyWith({
    String? id,
    String? patientId,
    String? scheduleId,
    String? medicationName,
    String? dosage,
    String? scheduledTime,
    DateTime? scheduledDate,
    String? status,
    String? confirmationMethod,
    DateTime? confirmedAt,
    String? notes,
    String? pillColor,
    String? pillBgColor,
  }) {
    return DoseLog(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      scheduleId: scheduleId ?? this.scheduleId,
      medicationName: medicationName ?? this.medicationName,
      dosage: dosage ?? this.dosage,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      status: status ?? this.status,
      confirmationMethod: confirmationMethod ?? this.confirmationMethod,
      confirmedAt: confirmedAt ?? this.confirmedAt,
      notes: notes ?? this.notes,
      pillColor: pillColor ?? this.pillColor,
      pillBgColor: pillBgColor ?? this.pillBgColor,
    );
  }

  factory DoseLog.fromJson(Map<String, dynamic> json) =>
      _$DoseLogFromJson(json);
  Map<String, dynamic> toJson() => _$DoseLogToJson(this);
}

@JsonSerializable()
class Guardian {
  final String id;
  final String patientId;
  final String name;
  final String relationship; // 'Mother', 'Father', 'Spouse', 'Sibling', etc.
  final String phone;
  final String? email;
  final bool notifyOnMissedDoses;

  const Guardian({
    required this.id,
    required this.patientId,
    required this.name,
    required this.relationship,
    required this.phone,
    this.email,
    this.notifyOnMissedDoses = true,
  });

  factory Guardian.fromJson(Map<String, dynamic> json) =>
      _$GuardianFromJson(json);
  Map<String, dynamic> toJson() => _$GuardianToJson(this);
}

@JsonSerializable()
class PatientDashboardData {
  final PatientProfile patient;
  final String doctorName;
  final String hospitalName;
  final List<Guardian> guardians;
  final List<DoseLog> todayDoses;
  final double adherenceRate;
  final int totalMedications;
  final int completedThisWeek;
  final DoseLog? nextDose;

  const PatientDashboardData({
    required this.patient,
    required this.doctorName,
    required this.hospitalName,
    required this.guardians,
    required this.todayDoses,
    required this.adherenceRate,
    required this.totalMedications,
    required this.completedThisWeek,
    this.nextDose,
  });

  factory PatientDashboardData.fromJson(Map<String, dynamic> json) =>
      _$PatientDashboardDataFromJson(json);
  Map<String, dynamic> toJson() => _$PatientDashboardDataToJson(this);
}
