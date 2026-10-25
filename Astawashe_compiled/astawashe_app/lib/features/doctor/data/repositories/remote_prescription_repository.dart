import 'package:dio/dio.dart';
import '../../domain/models/doctor_models.dart';
import '../../domain/repositories/prescription_repository.dart';

class RemotePrescriptionRepository implements PrescriptionRepository {
  final Dio dio;

  RemotePrescriptionRepository({required this.dio});

  Prescription _mapPrescription(Map<String, dynamic> json) {
    return Prescription(
      id: json['id']?.toString() ?? '',
      patientId: json['patientId']?.toString() ?? '',
      patientName: json['patientName']?.toString() ?? 'Patient',
      doctorId: json['doctorId']?.toString() ?? '',
      medicationName: json['medicationName']?.toString() ?? 'Medication',
      strength:
          json['strength']?.toString() ?? json['dosage']?.toString() ?? '500mg',
      dosage:
          json['dosage']?.toString() ??
          json['strength']?.toString() ??
          '1 dose',
      frequency: json['frequency']?.toString() ?? 'Once daily',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'].toString())
          : null,
      notes: json['notes']?.toString() ?? json['instructions']?.toString(),
      status: json['status']?.toString() ?? 'ACTIVE',
    );
  }

  @override
  Future<List<Prescription>> getPrescriptions({
    String? doctorId,
    String? patientId,
  }) async {
    final params = <String, dynamic>{};
    if (doctorId != null) params['doctorId'] = doctorId;
    if (patientId != null) params['patientId'] = patientId;

    final response = await dio.get('/prescriptions', queryParameters: params);
    final list = response.data['data'] as List<dynamic>? ?? [];
    return list
        .map((e) => _mapPrescription(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<Prescription> createPrescription(Prescription prescription) async {
    final response = await dio.post(
      '/prescriptions',
      data: prescription.toJson(),
    );
    final data =
        response.data['data'] as Map<String, dynamic>? ?? response.data;
    return _mapPrescription(data as Map<String, dynamic>);
  }

  @override
  Future<void> updatePrescriptionStatus(String id, String status) async {
    await dio.patch('/prescriptions/$id', data: {'status': status});
  }
}
