import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../models/auth_models.dart';
import '../../data/repositories/mock_auth_repository.dart';
import '../../data/repositories/remote_auth_repository.dart';

abstract class AuthRepository {
  Future<AuthResponse> login({
    String? email,
    String? phone,
    required String password,
    UserRole? preferredRole,
  });

  Future<AuthResponse> register({
    required String fullName,
    String? email,
    String? phone,
    required String password,
    required UserRole role,
    String? hospitalId,
    String? doctorId,
  });

  Future<User?> getCurrentUser();

  Future<void> logout();

  Future<bool> verifyEmail({required String email, required String otp});

  Future<void> resendVerificationEmail({required String email});
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final storage = ref.watch(secureStorageServiceProvider);
  if (AppConfig.useMock) {
    return MockAuthRepository(storage: storage);
  } else {
    final dio = ref.watch(dioProvider);
    return RemoteAuthRepository(dio: dio, storage: storage);
  }
});
