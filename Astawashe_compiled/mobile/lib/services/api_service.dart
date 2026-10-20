import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'dart:convert';

class ApiService {
  final http.Client _client;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  Future<http.Response> checkHealth() {
    return _client.get(ApiConfig.endpoint('health'));
  }

  Future<http.Response> login({
    required String email,
    required String password,
  }) {
    return _client.post(
      ApiConfig.endpoint('auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
  }

  void dispose() {
    _client.close();
  }
}
