import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/auth_session.dart';

class ApiService {
  final http.Client _client;
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  Future<http.Response> checkHealth() {
    return _client.get(ApiConfig.endpoint('health'));
  }

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      ApiConfig.endpoint('auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readErrorMessage(response.body),
      );
    }

    try {
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Invalid response.');
      }

      return AuthSession.fromJson(decoded);
    } on FormatException {
      throw const ApiException(
        statusCode: 500,
        message: 'The server returned an invalid login response.',
      );
    }
  }

  Future<http.Response> get(String path, {required String accessToken}) {
    return _client.get(
      ApiConfig.endpoint(path),
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
    );
  }

  Future<http.Response> post(
    String path, {
    required String accessToken,
    required Map<String, dynamic> body,
  }) {
    return _client.post(
      ApiConfig.endpoint(path),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode(body),
    );
  }

  Future<http.Response> patch(
    String path, {
    required String accessToken,
    required Map<String, dynamic> body,
  }) {
    return _client.patch(
      ApiConfig.endpoint(path),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode(body),
    );
  }

  String _readErrorMessage(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        final message = decoded['message'] ?? decoded['error'];
        if (message is String && message.trim().isNotEmpty) {
          return message;
        }
      }
    } catch (_) {
      // Use the generic message if the response isn't JSON.
    }

    return 'The request failed.';
  }

  Future<List<Map<String, dynamic>>> getApprovedHospitals() async {
    final response = await _client.get(
      ApiConfig.endpoint('hospitals/approved'),
      headers: {'Accept': 'application/json'},
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readErrorMessage(response.body),
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic> || decoded['data'] is! List) {
      throw const FormatException('Invalid hospitals response.');
    }

    return (decoded['data'] as List).whereType<Map<String, dynamic>>().toList();
  }

  Future<List<Map<String, dynamic>>> getHospitalDoctors(
    String hospitalId,
  ) async {
    final response = await _client.get(
      ApiConfig.endpoint(
        'hospitals/${Uri.encodeComponent(hospitalId)}/doctors',
      ),
      headers: {'Accept': 'application/json'},
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readErrorMessage(response.body),
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic> || decoded['data'] is! List) {
      throw const FormatException('Invalid doctors response.');
    }

    return (decoded['data'] as List).whereType<Map<String, dynamic>>().toList();
  }

  Future<Map<String, dynamic>> registerPatient({
    required String fullName,
    required String email,
    required String password,
    required String hospitalId,
    required String doctorId,
    String? phone,
    String? dob,
    String? gender,
    String? address,
  }) async {
    final body = <String, dynamic>{
      'fullName': fullName.trim(),
      'email': email.trim(),
      'password': password,
      'role': 'PATIENT',
      'hospitalId': hospitalId,
      'doctorId': doctorId,
      if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
      if (dob != null && dob.trim().isNotEmpty) 'dob': dob.trim(),
      if (gender != null && gender.trim().isNotEmpty) 'gender': gender.trim(),
      if (address != null && address.trim().isNotEmpty)
        'address': address.trim(),
    };

    final response = await _client.post(
      ApiConfig.endpoint('auth/register'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readErrorMessage(response.body),
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Invalid registration response.');
    }

    return decoded;
  }

  Future<AuthSession> verifyEmail({
    required String email,
    required String otp,
  }) async {
    final response = await _client.post(
      ApiConfig.endpoint('auth/verify-email'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'email': email.trim(), 'otp': otp.trim()}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readErrorMessage(response.body),
      );
    }

    try {
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Invalid verification response.');
      }

      return AuthSession.fromJson(decoded);
    } on FormatException {
      throw const ApiException(
        statusCode: 500,
        message: 'The server returned an invalid verification response.',
      );
    }
  }

  Future<String?> resendVerificationCode({required String email}) async {
    final response = await _client.post(
      ApiConfig.endpoint('auth/resend-otp'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'email': email.trim()}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readErrorMessage(response.body),
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Invalid resend-code response.');
    }

    final otp = decoded['demoOtp'];
    return otp is String ? otp : null;
  }

  Future<List<Map<String, dynamic>>> getPendingPatientApprovals({
    required String accessToken,
  }) async {
    final response = await get(
      'approvals/doctor/patients/pending',
      accessToken: accessToken,
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readErrorMessage(response.body),
      );
    }

    final decoded = jsonDecode(response.body);

    if (decoded is! Map<String, dynamic> || decoded['data'] is! List) {
      throw const FormatException(
        'Invalid pending patient approvals response.',
      );
    }

    return (decoded['data'] as List).whereType<Map<String, dynamic>>().toList();
  }

  Future<String> reviewPatientApproval({
    required String accessToken,
    required String patientId,
    required String action,
    String? nickname,
    String? reason,
  }) async {
    if (!['APPROVE', 'REJECT'].contains(action)) {
      throw ArgumentError.value(action, 'action', 'Invalid approval action');
    }

    final response = await post(
      'approvals/doctor/patients/${Uri.encodeComponent(patientId)}/approve',
      accessToken: accessToken,
      body: {
        'action': action,
        if (nickname != null && nickname.trim().isNotEmpty)
          'nickname': nickname.trim(),
        if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim(),
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readErrorMessage(response.body),
      );
    }

    final decoded = jsonDecode(response.body);

    if (decoded is Map<String, dynamic> && decoded['message'] is String) {
      return decoded['message'] as String;
    }

    return 'Patient ${action.toLowerCase()}d successfully.';
  }

  Future<dynamic> getPatientSchedulesForDoctor({
    required String patientId,
    required String accessToken,
  }) async {
    return get('medications/$patientId/schedules', accessToken: accessToken);
  }

  Future<Map<String, dynamic>> updateMedicationSchedule({
    required String scheduleId,
    required String accessToken,
    required Map<String, dynamic> body,
  }) async {
    final response = await patch(
      'medications/schedules/${Uri.encodeComponent(scheduleId)}',
      accessToken: accessToken,
      body: body,
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readErrorMessage(response.body),
      );
    }

    final decoded = jsonDecode(response.body);

    if (decoded is! Map<String, dynamic> ||
        decoded['data'] is! Map<String, dynamic>) {
      throw const FormatException('Invalid schedule update response.');
    }

    return decoded['data'] as Map<String, dynamic>;
  }

  void dispose() {
    _client.close();
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  const ApiException({required this.statusCode, required this.message});

  @override
  String toString() => message;
}
