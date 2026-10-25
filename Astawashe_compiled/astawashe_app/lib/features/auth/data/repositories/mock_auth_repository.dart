import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/models/auth_models.dart';
import '../../domain/repositories/auth_repository.dart';

class MockAuthRepository implements AuthRepository {
  final SecureStorageService storage;

  MockAuthRepository({required this.storage});

  @override
  Future<AuthResponse> login({
    String? email,
    String? phone,
    required String password,
    UserRole? preferredRole,
  }) async {
    await Future.delayed(const Duration(milliseconds: 300));

    final effectiveRole = preferredRole ?? UserRole.patient;
    final isPatient = effectiveRole == UserRole.patient;

    final user = User(
      id: isPatient ? 'patient-001' : 'doctor-001',
      email:
          email ?? (isPatient ? 'sophie@astawashe.et' : 'ahmed@astawashe.et'),
      phone: phone ?? (isPatient ? '+251911223344' : '+251922334455'),
      role: effectiveRole.toApiString(),
      fullName: isPatient ? 'Sophie Bewuketu' : 'Dr. Ahmed Mohammed',
      status: 'ACTIVE',
      emailVerified: true,
      profileData: {'hospital': 'Tikur Anbessa Specialized Hospital'},
    );

    const tokens = AuthTokens(
      accessToken: 'mock_jwt_access_token_astawashe_demo',
      refreshToken: 'mock_jwt_refresh_token_astawashe_demo',
    );

    await storage.saveSession(
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
      userId: user.id,
      userName: user.fullName,
      email: user.email,
    );

    return AuthResponse(
      success: true,
      user: user,
      tokens: tokens,
      requiresEmailVerification: false,
      message: 'Login successful',
    );
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
    await Future.delayed(const Duration(milliseconds: 350));

    final user = User(
      id: role == UserRole.patient ? 'patient-001' : 'doctor-001',
      email:
          email ?? '${fullName.toLowerCase().replaceAll(' ', '')}@astawashe.et',
      phone: phone ?? '+251911000000',
      role: role.toApiString(),
      fullName: fullName,
      status: 'ACTIVE',
      emailVerified: true,
    );

    const tokens = AuthTokens(
      accessToken: 'mock_jwt_access_token_astawashe_demo',
      refreshToken: 'mock_jwt_refresh_token_astawashe_demo',
    );

    await storage.saveSession(
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
      userId: user.id,
      userName: user.fullName,
      email: user.email,
    );

    return AuthResponse(
      success: true,
      user: user,
      tokens: tokens,
      requiresEmailVerification: false,
      message: 'Account created successfully',
    );
  }

  @override
  Future<User?> getCurrentUser() async {
    final token = await storage.getAccessToken();
    if (token == null || token.isEmpty) return null;

    final role = await storage.getUserRole();
    final userId = await storage.getUserId();
    final userName = await storage.getUserName();
    final email = await storage.getUserEmail();

    if (userId == null) return null;

    return User(
      id: userId,
      email: email,
      role: role ?? 'PATIENT',
      fullName:
          userName ??
          (role == 'DOCTOR' ? 'Dr. Ahmed Mohammed' : 'Sophie Bewuketu'),
      status: 'ACTIVE',
      emailVerified: true,
    );
  }

  @override
  Future<void> logout() async {
    await storage.clearSession();
  }

  @override
  Future<bool> verifyEmail({required String email, required String otp}) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return true;
  }

  @override
  Future<void> resendVerificationEmail({required String email}) async {
    await Future.delayed(const Duration(milliseconds: 200));
  }
}
