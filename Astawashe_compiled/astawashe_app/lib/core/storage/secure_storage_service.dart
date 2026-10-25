import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final secureStorageServiceProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

/// Wrapper around FlutterSecureStorage for session, tokens, and preferences.
class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserRole = 'user_role';
  static const String keyUserId = 'user_id';
  static const String keyUserName = 'user_name';
  static const String keyUserEmail = 'user_email';
  static const String keyLanguage = 'app_language';

  Future<void> saveSession({
    required String token,
    String? refreshToken,
    required String role,
    required String userId,
    String? userName,
    String? email,
  }) async {
    await _storage.write(key: keyAccessToken, value: token);
    if (refreshToken != null) {
      await _storage.write(key: keyRefreshToken, value: refreshToken);
    }
    await _storage.write(key: keyUserRole, value: role);
    await _storage.write(key: keyUserId, value: userId);
    if (userName != null) {
      await _storage.write(key: keyUserName, value: userName);
    }
    if (email != null) {
      await _storage.write(key: keyUserEmail, value: email);
    }
  }

  Future<String?> getAccessToken() => _storage.read(key: keyAccessToken);
  Future<String?> getRefreshToken() => _storage.read(key: keyRefreshToken);
  Future<String?> getUserRole() => _storage.read(key: keyUserRole);
  Future<String?> getUserId() => _storage.read(key: keyUserId);
  Future<String?> getUserName() => _storage.read(key: keyUserName);
  Future<String?> getUserEmail() => _storage.read(key: keyUserEmail);

  Future<void> saveLanguage(String langCode) =>
      _storage.write(key: keyLanguage, value: langCode);
  Future<String?> getLanguage() => _storage.read(key: keyLanguage);

  Future<bool> hasValidSession() async {
    final token = await getAccessToken();
    final role = await getUserRole();
    return token != null && token.isNotEmpty && role != null && role.isNotEmpty;
  }

  Future<void> clearSession() async {
    await _storage.delete(key: keyAccessToken);
    await _storage.delete(key: keyRefreshToken);
    await _storage.delete(key: keyUserRole);
    await _storage.delete(key: keyUserId);
    await _storage.delete(key: keyUserName);
    await _storage.delete(key: keyUserEmail);
  }
}
