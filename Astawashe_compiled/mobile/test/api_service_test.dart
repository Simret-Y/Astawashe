import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/services/api_service.dart';

void main() {
  test('health check sends a GET request to the health endpoint', () async {
    final client = MockClient((request) async {
      expect(request.method, 'GET');
      expect(request.url.toString(), 'http://localhost:4000/api/health');

      return http.Response('{"status":"ok"}', 200);
    });

    final apiService = ApiService(client: client);

    final response = await apiService.checkHealth();

    expect(response.statusCode, 200);
    expect(response.body, '{"status":"ok"}');

    apiService.dispose();
  });
}
