import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/config/app_config.dart';
import '../../domain/models/hospital_lookup.dart';

abstract class HospitalLookupRepository {
  Future<List<HospitalLookup>> getApprovedHospitals();
  Future<List<DoctorLookup>> getHospitalDoctors(String hospitalId);
}

class RemoteHospitalLookupRepository implements HospitalLookupRepository {
  final Dio dio;

  RemoteHospitalLookupRepository({required this.dio});

  static const List<HospitalLookup> _fallbackHospitals = [
    HospitalLookup(
      id: 'hosp-001',
      name: 'Addis Hiwot General Hospital',
      organizationType: 'General Hospital',
      city: 'Addis Ababa',
    ),
    HospitalLookup(
      id: 'hosp-002',
      name: 'Tikur Anbessa Specialized Hospital',
      organizationType: 'Specialized Hospital',
      city: 'Addis Ababa',
    ),
    HospitalLookup(
      id: 'hosp-003',
      name: 'St. Paul Hospital Millennium Medical College',
      organizationType: 'Referral Hospital',
      city: 'Addis Ababa',
    ),
  ];

  static const List<DoctorLookup> _fallbackDoctors = [
    DoctorLookup(
      id: 'doc-001',
      name: 'Dr. Aklilu Yilma',
      specialization: 'Internal Medicine',
      experience: '8 years',
      status: 'ACTIVE',
    ),
    DoctorLookup(
      id: 'doc-002',
      name: 'Dr. Selamawit Tadesse',
      specialization: 'Cardiology',
      experience: '12 years',
      status: 'ACTIVE',
    ),
  ];

  @override
  Future<List<HospitalLookup>> getApprovedHospitals() async {
    if (AppConfig.useMock) {
      return _fallbackHospitals;
    }
    try {
      final response = await dio.get('/hospitals/approved');
      final data = response.data;
      if (data is Map<String, dynamic> && data['data'] is List) {
        final list = (data['data'] as List)
            .map(
              (item) => HospitalLookup.fromJson(item as Map<String, dynamic>),
            )
            .toList();
        if (list.isNotEmpty) return list;
      }
      return _fallbackHospitals;
    } catch (_) {
      return _fallbackHospitals;
    }
  }

  @override
  Future<List<DoctorLookup>> getHospitalDoctors(String hospitalId) async {
    if (hospitalId.isEmpty) return [];
    if (AppConfig.useMock) {
      return _fallbackDoctors;
    }
    try {
      final response = await dio.get('/hospitals/$hospitalId/doctors');
      final data = response.data;
      if (data is Map<String, dynamic> && data['data'] is List) {
        final list = (data['data'] as List)
            .map((item) => DoctorLookup.fromJson(item as Map<String, dynamic>))
            .toList();
        if (list.isNotEmpty) return list;
      }
      return _fallbackDoctors;
    } catch (_) {
      return _fallbackDoctors;
    }
  }
}

final hospitalLookupRepositoryProvider = Provider<HospitalLookupRepository>((
  ref,
) {
  final dio = ref.watch(dioProvider);
  return RemoteHospitalLookupRepository(dio: dio);
});

final approvedHospitalsProvider = FutureProvider<List<HospitalLookup>>((
  ref,
) async {
  final repo = ref.watch(hospitalLookupRepositoryProvider);
  return repo.getApprovedHospitals();
});

final hospitalDoctorsProvider =
    FutureProvider.family<List<DoctorLookup>, String>((ref, hospitalId) async {
      if (hospitalId.isEmpty) return [];
      final repo = ref.watch(hospitalLookupRepositoryProvider);
      return repo.getHospitalDoctors(hospitalId);
    });
