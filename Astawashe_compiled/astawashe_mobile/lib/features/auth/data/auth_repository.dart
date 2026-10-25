import 'dart:convert';

import 'package:dio/dio.dart';

import '../../../core/network/dio_client.dart';
import '../../../core/router/app_router.dart';
import '../../../core/storage/secure_storage.dart';

class AuthUser {
  const AuthUser({
    required this.id,
    required this.role,
    required this.status,
    required this.email,
    required this.fullName,
    required this.raw,
  });

  final String id;
  final AppUserRole role;
  final String status;
  final String email;
  final String fullName;
  final Map<String, dynamic> raw;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final role = switch ((json['role'] ?? '').toString().toUpperCase()) {
      'PATIENT' => AppUserRole.patient,
      'DOCTOR' => AppUserRole.doctor,
      _ => AppUserRole.guest,
    };
    final profile = json['profileData'];
    final profileData = profile is Map
        ? Map<String, dynamic>.from(profile)
        : const <String, dynamic>{};

    return AuthUser(
      id: (json['id'] ?? json['sub'] ?? '').toString(),
      role: role,
      status: (json['status'] ?? '').toString().toUpperCase(),
      email: (json['email'] ?? '').toString(),
      fullName:
          (json['fullName'] ?? json['name'] ?? profileData['fullName'] ?? '')
              .toString(),
      raw: Map<String, dynamic>.from(json),
    );
  }

  Map<String, dynamic> toJson() => raw;
}

class AuthResult {
  const AuthResult({
    required this.user,
    this.requiresVerification = false,
    this.demoOtp,
  });

  final AuthUser? user;
  final bool requiresVerification;
  final String? demoOtp;
}

class AuthRepository {
  AuthRepository({AppDioClient? client, AppSecureStorage? storage})
    : _client = client ?? AppDioClient(secureStorage: storage),
      _storage = storage ?? const AppSecureStorage();

  final AppDioClient _client;
  final AppSecureStorage _storage;

  Future<List<Map<String, dynamic>>> getApprovedHospitals() async {
    final response = await _client.dio.get('/hospitals/approved');
    return _listFromEnvelope(response.data);
  }

  Future<List<Map<String, dynamic>>> getDoctors(String hospitalId) async {
    final response = await _client.dio.get('/hospitals/$hospitalId/doctors');
    return _listFromEnvelope(response.data);
  }

  Future<AuthResult> login({
    required String identifier,
    required String password,
  }) async {
    final trimmed = identifier.trim();
    final payload = trimmed.contains('@')
        ? {'email': trimmed, 'password': password}
        : {'phone': trimmed, 'password': password};
    final response = await _client.dio.post('/auth/login', data: payload);
    return _persistAuthResponse(response.data);
  }

  Future<AuthResult> register(Map<String, dynamic> payload) async {
    final response = await _client.dio.post('/auth/register', data: payload);
    final body = _asMap(response.data);
    if (body['requiresEmailVerification'] == true) {
      return AuthResult(
        user: null,
        requiresVerification: true,
        demoOtp: body['demoOtp']?.toString(),
      );
    }
    return _persistAuthResponse(body);
  }

  Future<AuthResult> verifyEmail({
    required String email,
    required String otp,
  }) async {
    final response = await _client.dio.post(
      '/auth/verify-email',
      data: {'email': email.trim(), 'otp': otp.trim()},
    );
    return _persistAuthResponse(response.data);
  }

  Future<String?> resendOtp(String email) async {
    final response = await _client.dio.post(
      '/auth/resend-otp',
      data: {'email': email.trim()},
    );
    return _asMap(response.data)['demoOtp']?.toString();
  }

  Future<AuthUser> me() async {
    final response = await _client.dio.get('/auth/me');
    final body = _asMap(response.data);
    final user = AuthUser.fromJson(_asMap(body['user']));
    await _storage.saveUser(jsonEncode(user.toJson()));
    return user;
  }

  Future<AuthUser?> restoreSession() async {
    final token = await _storage.readToken();
    final userJson = await _storage.readUser();
    if (token == null || token.isEmpty || userJson == null) return null;
    try {
      final user = AuthUser.fromJson(_asMap(jsonDecode(userJson)));
      if (user.role == AppUserRole.guest) return null;
      return user;
    } on FormatException {
      await _storage.clearSession();
      return null;
    }
  }

  Future<void> signOut() => _storage.clearSession();

  Future<AuthResult> _persistAuthResponse(dynamic rawResponse) async {
    final body = _asMap(rawResponse);
    final tokenData = _asMap(body['tokens']);
    final accessToken = (tokenData['accessToken'] ?? body['accessToken'] ?? '')
        .toString();
    final userMap = _asMap(body['user']);
    final user = AuthUser.fromJson(userMap);
    if (accessToken.isNotEmpty) {
      await _storage.saveToken(accessToken);
      await _storage.saveUser(jsonEncode(user.toJson()));
    }
    return AuthResult(user: user);
  }

  List<Map<String, dynamic>> _listFromEnvelope(dynamic response) {
    final body = _asMap(response);
    final data = body['data'];
    if (data is! List) return const [];
    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Map<String, dynamic> _asMap(dynamic value) {
    return value is Map
        ? Map<String, dynamic>.from(value)
        : <String, dynamic>{};
  }

  static String errorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
      return error.message ?? 'Unable to connect to AstaWashe server.';
    }
    return error.toString();
  }
}
