import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/auth_models.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../../../core/network/api_exceptions.dart';

enum AuthStatus { initial, authenticated, unauthenticated, loading }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
  });

  bool get isAuthenticated =>
      status == AuthStatus.authenticated && user != null;
  bool get isPatient => user?.userRole == UserRole.patient;
  bool get isDoctor => user?.userRole == UserRole.doctor;

  AuthState copyWith({AuthStatus? status, User? user, String? errorMessage}) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  late AuthRepository _repository;
  late SecureStorageService _storage;

  @override
  AuthState build() {
    _repository = ref.watch(authRepositoryProvider);
    _storage = ref.watch(secureStorageServiceProvider);
    Future.microtask(() => checkSession());
    return const AuthState();
  }

  Future<void> checkSession() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final user = await _repository.getCurrentUser();
      if (user != null) {
        state = state.copyWith(status: AuthStatus.authenticated, user: user);
      } else {
        state = state.copyWith(status: AuthStatus.unauthenticated, user: null);
      }
    } catch (_) {
      state = state.copyWith(status: AuthStatus.unauthenticated, user: null);
    }
  }

  Future<bool> login({
    String? email,
    String? phone,
    required String password,
    required UserRole preferredRole,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _repository.login(
        email: email,
        phone: phone,
        password: password,
        preferredRole: preferredRole,
      );

      if (response.success && response.user != null) {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: response.user,
        );
        return true;
      } else {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: response.message ?? 'Login failed',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: ApiException.fromError(e).message,
      );
      return false;
    }
  }

  Future<AuthResponse> register({
    required String fullName,
    String? email,
    String? phone,
    required String password,
    required UserRole role,
    String? hospitalId,
    String? doctorId,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _repository.register(
        fullName: fullName,
        email: email,
        phone: phone,
        password: password,
        role: role,
        hospitalId: hospitalId,
        doctorId: doctorId,
      );

      if (response.success && response.user != null) {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: response.user,
        );
      } else if (response.requiresEmailVerification == true) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: null,
        );
      } else {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: response.message ?? 'Registration failed',
        );
      }
      return response;
    } catch (e) {
      final errorMsg = ApiException.fromError(e).message;
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: errorMsg,
      );
      return AuthResponse(success: false, message: errorMsg);
    }
  }

  Future<bool> verifyEmail({required String email, required String otp}) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final success = await _repository.verifyEmail(email: email, otp: otp);
      if (success) {
        final user = await _repository.getCurrentUser();
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
          errorMessage: null,
        );
        return true;
      } else {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: 'Invalid verification code. Please check and try again.',
        );
        return false;
      }
    } catch (e) {
      final errorMsg = ApiException.fromError(e).message;
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: errorMsg,
      );
      return false;
    }
  }

  Future<bool> resendVerificationEmail({required String email}) async {
    try {
      await _repository.resendVerificationEmail(email: email);
      return true;
    } catch (e) {
      state = state.copyWith(
        errorMessage: ApiException.fromError(e).message,
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    await _storage.clearSession();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
