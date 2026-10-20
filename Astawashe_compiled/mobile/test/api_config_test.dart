import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/config/api_config.dart';

void main() {
  test('uses the existing backend base URL by default', () {
    expect(ApiConfig.baseUrl, 'http://localhost:4000/api');
  });

  test('builds endpoint URLs correctly', () {
    expect(
      ApiConfig.endpoint('/health').toString(),
      'http://localhost:4000/api/health',
    );

    expect(
      ApiConfig.endpoint('auth/login').toString(),
      'http://localhost:4000/api/auth/login',
    );
  });
}
