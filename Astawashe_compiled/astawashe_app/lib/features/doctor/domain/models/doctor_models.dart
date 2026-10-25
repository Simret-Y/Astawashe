import 'package:json_annotation/json_annotation.dart';

part 'doctor_models.g.dart';

@JsonSerializable()
class Doctor {
  final String id;
  final String userId;
  final String hospitalId;
  final String name;
  final String? email;
  final String? phone;
  final String? licenseNumber;
  final String? specialization;
  final String? experience;
  final String status;

  const Doctor({
    required this.id,
    required this.userId,
    required this.hospitalId,
    required this.name,
    this.email,
    this.phone,
    this.licenseNumber,
    this.specialization,
    this.experience,
    this.status = 'ACTIVE',
  });

  factory Doctor.fromJson(Map<String, dynamic> json) => _$DoctorFromJson(json);
  Map<String, dynamic> toJson() => _$DoctorToJson(this);
}

@JsonSerializable()
class PatientSummary {
  final String id;
  final String name;
  final int age;
  final String gender;
  final double adherenceRate;
  final int activeMedsCount;
  final String status; // 'on_track' | 'needs_attention' | 'high_risk'
  final String? lastDoseStatus;
  final String? avatarUrl;
  final String? phone;

  const PatientSummary({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.adherenceRate,
    required this.activeMedsCount,
    required this.status,
    this.lastDoseStatus,
    this.avatarUrl,
    this.phone,
  });

  bool get isOnTrack => adherenceRate >= 80;
  bool get needsAttention => adherenceRate >= 60 && adherenceRate < 80;
  bool get isHighRisk => adherenceRate < 60;

  factory PatientSummary.fromJson(Map<String, dynamic> json) =>
      _$PatientSummaryFromJson(json);
  Map<String, dynamic> toJson() => _$PatientSummaryToJson(this);
}

@JsonSerializable()
class Prescription {
  final String id;
  final String patientId;
  final String patientName;
  final String doctorId;
  final String medicationName;
  final String strength; // e.g. "500mg"
  final String dosage; // e.g. "1 tablet"
  final String frequency; // e.g. "Once daily", "Twice daily"
  final DateTime startDate;
  final DateTime? endDate;
  final String? notes;
  final String status; // 'ACTIVE', 'COMPLETED', 'DISCONTINUED'

  const Prescription({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.doctorId,
    required this.medicationName,
    required this.strength,
    required this.dosage,
    required this.frequency,
    required this.startDate,
    this.endDate,
    this.notes,
    this.status = 'ACTIVE',
  });

  factory Prescription.fromJson(Map<String, dynamic> json) =>
      _$PrescriptionFromJson(json);
  Map<String, dynamic> toJson() => _$PrescriptionToJson(this);
}

@JsonSerializable()
class PatientApprovalRequest {
  final String id;
  final String patientId;
  final String patientName;
  final String? email;
  final String? phone;
  final DateTime requestedAt;
  final String? reason;
  final String status; // 'PENDING' | 'APPROVED' | 'REJECTED'

  const PatientApprovalRequest({
    required this.id,
    required this.patientId,
    required this.patientName,
    this.email,
    this.phone,
    required this.requestedAt,
    this.reason,
    this.status = 'PENDING',
  });

  factory PatientApprovalRequest.fromJson(Map<String, dynamic> json) =>
      _$PatientApprovalRequestFromJson(json);
  Map<String, dynamic> toJson() => _$PatientApprovalRequestToJson(this);
}

@JsonSerializable()
class DoctorDashboardData {
  final Doctor doctor;
  final int totalPatients;
  final int onTrackCount;
  final int needAttentionCount;
  final int missedDoseCount;
  final List<PatientSummary> recentPatients;
  final List<PatientApprovalRequest> pendingRequests;
  final List<PatientSummary> riskPatients;
  final double averageAdherence;

  const DoctorDashboardData({
    required this.doctor,
    required this.totalPatients,
    required this.onTrackCount,
    required this.needAttentionCount,
    required this.missedDoseCount,
    required this.recentPatients,
    required this.pendingRequests,
    required this.riskPatients,
    required this.averageAdherence,
  });

  factory DoctorDashboardData.fromJson(Map<String, dynamic> json) =>
      _$DoctorDashboardDataFromJson(json);
  Map<String, dynamic> toJson() => _$DoctorDashboardDataToJson(this);
}
