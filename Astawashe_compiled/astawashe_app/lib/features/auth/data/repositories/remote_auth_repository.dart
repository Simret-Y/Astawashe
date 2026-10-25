import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/models/auth_models.dart';
import '../../domain/repositories/auth_repository.dart';

class RemoteAuthRepository implements AuthRepository {
  final Dio dio;
  final SecureStorageService storage;

  RemoteAuthRepository({required this.dio, required this.storage});

  @override
  Future<AuthResponse> login({
    String? email,
    String? phone,
    required String password,
    UserRole? preferredRole,
  }) async {
    // TODO: Endpoint POST /api/auth/login
    // Request body: { email, phone, password }
    final payload = <String, dynamic>{'password': password};
    if (email != null && email.isNotEmpty) payload['email'] = email;
    if (phone != null && phone.isNotEmpty) payload['phone'] = phone;

    final response = await dio.post('/auth/login', data: payload);

    final authResponse = AuthResponse.fromJson(
      response.data as Map<String, dynamic>,
    );
    if (authResponse.tokens != null && authResponse.user != null) {
      await storage.saveSession(
        token: authResponse.tokens!.accessToken,
        refreshToken: authResponse.tokens!.refreshToken,
        role: authResponse.user!.role,
        userId: authResponse.user!.id,
        userName: authResponse.user!.fullName,
        email: authResponse.user!.email,
      );
    }
    return authResponse;
  }

  @override
  Future<AuthResponse> register({
    required String fullName,
    String? email,
    String? phone,
    required String password,
    required UserRole role,
    String? hospitalId,
    String? doctorId,
  }) async {
    // TODO: Endpoint POST /api/auth/register
    // Request body: { fullName, email, phone, password, role, hospitalId, doctorId }
    final payload = <String, dynamic>{
      'fullName': fullName,
      'password': password,
      'role': role.toApiString(),
    };
    if (email != null && email.isNotEmpty) payload['email'] = email;
    if (phone != null && phone.isNotEmpty) payload['phone'] = phone;
    if (hospitalId != null) payload['hospitalId'] = hospitalId;
    if (doctorId != null) payload['doctorId'] = doctorId;

    final response = await dio.post('/auth/register', data: payload);

    final authResponse = AuthResponse.fromJson(
      response.data as Map<String, dynamic>,
    );
    if (authResponse.tokens != null && authResponse.user != null) {
      await storage.saveSession(
        token: authResponse.tokens!.accessToken,
        refreshToken: authResponse.tokens!.refreshToken,
        role: authResponse.user!.role,
        userId: authResponse.user!.id,
        userName: authResponse.user!.fullName,
        email: authResponse.user!.email,
      );
    }
    return authResponse;
  }

  @override
  Future<User?> getCurrentUser() async {
    // TODO: Endpoint GET /api/auth/me
    try {
      final response = await dio.get('/auth/me');
      final data = response.data;
      if (data != null && data['user'] != null) {
        return User.fromJson(data['user'] as Map<String, dynamic>);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> logout() async {
    await storage.clearSession();
  }

  @override
  Future<bool> verifyEmail({required String email, required String otp}) async {
    final response = await dio.post(
      '/auth/verify-email',
      data: {'email': email, 'otp': otp},
    );

    final data = response.data;
    if (data is Map<String, dynamic>) {
      final userJson = data['user'] as Map<String, dynamic>?;
      final tokensJson = data['tokens'] as Map<String, dynamic>?;

      if (userJson != null && tokensJson != null) {
        final user = User.fromJson(userJson);
        final tokens = AuthTokens.fromJson(tokensJson);
        await storage.saveSession(
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          role: user.role,
          userId: user.id,
          userName: user.fullName,
          email: user.email,
        );
      }
      return data['success'] == true || userJson != null;
    }
    return response.statusCode == 200;
  }

  @override
  Future<void> resendVerificationEmail({required String email}) async {
    // TODO: Endpoint POST /api/auth/resend-verification
    await dio.post('/auth/resend-verification', data: {'email': email});
  }
}
