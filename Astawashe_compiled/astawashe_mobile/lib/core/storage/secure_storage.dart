import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AppSecureStorage {
  static const String _tokenKey = 'astawashe_access_token';
  static const String _userKey = 'astawashe_user';

  const AppSecureStorage({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> readToken() async {
    return _storage.read(key: _tokenKey);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<void> saveUser(String userJson) async {
    await _storage.write(key: _userKey, value: userJson);
  }

  Future<String?> readUser() async {
    return _storage.read(key: _userKey);
  }

  Future<void> clearUser() async {
    await _storage.delete(key: _userKey);
  }

  Future<void> clearSession() async {
    await clearToken();
    await clearUser();
  }
}
