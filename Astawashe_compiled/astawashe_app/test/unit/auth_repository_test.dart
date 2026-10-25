import 'package:flutter_test/flutter_test.dart';
import 'package:astawashe_app/core/storage/secure_storage_service.dart';
import 'package:astawashe_app/features/auth/data/repositories/mock_auth_repository.dart';
import 'package:astawashe_app/features/auth/domain/models/auth_models.dart';

// In-memory fake secure storage for fast, reliable unit tests
class FakeSecureStorageService extends SecureStorageService {
  final Map<String, String> _data = {};

  @override
  Future<void> saveSession({
    required String token,
    String? refreshToken,
    required String role,
    required String userId,
    String? userName,
    String? email,
  }) async {
    _data[SecureStorageService.keyAccessToken] = token;
    _data[SecureStorageService.keyUserRole] = role;
    _data[SecureStorageService.keyUserId] = userId;
    if (userName != null) _data[SecureStorageService.keyUserName] = userName;
    if (email != null) _data[SecureStorageService.keyUserEmail] = email;
  }

  @override
  Future<String?> getAccessToken() async =>
      _data[SecureStorageService.keyAccessToken];

  @override
  Future<String?> getUserRole() async =>
      _data[SecureStorageService.keyUserRole];

  @override
  Future<String?> getUserId() async => _data[SecureStorageService.keyUserId];

  @override
  Future<String?> getUserName() async =>
      _data[SecureStorageService.keyUserName];

  @override
  Future<String?> getUserEmail() async =>
      _data[SecureStorageService.keyUserEmail];

  @override
  Future<void> clearSession() async => _data.clear();
}

void main() {
  group('AuthRepository & Session Tests', () {
    late FakeSecureStorageService fakeStorage;
    late MockAuthRepository authRepo;

    setUp(() {
      fakeStorage = FakeSecureStorageService();
      authRepo = MockAuthRepository(storage: fakeStorage);
    });

    test('Patient login saves patient session', () async {
      final response = await authRepo.login(
        email: 'sophie@astawashe.et',
        password: 'any_password',
        preferredRole: UserRole.patient,
      );

      expect(response.success, isTrue);
      expect(response.user?.role, 'PATIENT');
      expect(response.user?.fullName, 'Sophie Bewuketu');

      final currentUser = await authRepo.getCurrentUser();
      expect(currentUser?.role, 'PATIENT');
    });

    test('Doctor login saves doctor session', () async {
      final response = await authRepo.login(
        email: 'ahmed@astawashe.et',
        password: 'doctor_password',
        preferredRole: UserRole.doctor,
      );

      expect(response.success, isTrue);
      expect(response.user?.role, 'DOCTOR');
      expect(response.user?.fullName, 'Dr. Ahmed Mohammed');

      final currentUser = await authRepo.getCurrentUser();
      expect(currentUser?.role, 'DOCTOR');
    });

    test('Logout clears session completely', () async {
      await authRepo.login(
        email: 'user@test.et',
        password: 'password',
        preferredRole: UserRole.patient,
      );

      await authRepo.logout();
      final currentUser = await authRepo.getCurrentUser();
      expect(currentUser, isNull);
    });
  });
}
