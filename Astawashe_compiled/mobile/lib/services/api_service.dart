import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class ApiService {
  final http.Client _client;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  Future<http.Response> checkHealth() {
    return _client.get(ApiConfig.endpoint('health'));
  }

  void dispose() {
    _client.close();
  }
}
