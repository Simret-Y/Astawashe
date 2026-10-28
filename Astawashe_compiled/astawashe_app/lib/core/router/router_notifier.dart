import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_state_provider.dart';

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    _ref.listen<AuthState>(authStateProvider, (_, _) => notifyListeners());
  }

  String? redirect(BuildContext context, GoRouterState state) {
    final authState = _ref.read(authStateProvider);
    return evaluateRedirect(authState: authState, loc: state.matchedLocation);
  }

  static String? evaluateRedirect({
    required AuthState authState,
    required String loc,
  }) {
    final isPatient = authState.isPatient;
    final isDoctor = authState.isDoctor;

    final isLoggingIn =
        loc == '/login' ||
        loc == '/register' ||
        loc == '/verify-otp' ||
        loc == '/splash' ||
        loc == '/doctor/splash';

    // If still in initial loading session check, stay on current location
    if (authState.status == AuthStatus.initial ||
        authState.status == AuthStatus.loading) {
      return null;
    }

    // Not authenticated
    if (!authState.isAuthenticated) {
      if (isLoggingIn) return null;
      return '/splash';
    }

    // Check for pending approval
    final status = authState.user?.status?.toUpperCase();
    final isPendingApproval =
        status != null &&
        (status == 'PENDING' ||
            status == 'PENDING_HOSPITAL_APPROVAL' ||
            status == 'PENDING_SYSTEM_APPROVAL' ||
            status == 'PENDING_DOCTOR_APPROVAL' ||
            status == 'REJECTED');

    if (isPendingApproval) {
      if (loc == '/pending-approval') return null;
      return '/pending-approval';
    }

    if (loc == '/pending-approval') {
      return isDoctor ? '/doctor/home' : '/patient/home';
    }

    if (isLoggingIn || loc == '/' || loc == '/splash') {
      return isDoctor ? '/doctor/home' : '/patient/home';
    }

    // Patient trying to access doctor routes
    if (isPatient && loc.startsWith('/doctor')) {
      return '/patient/home';
    }

    // Doctor trying to access patient routes
    if (isDoctor && loc.startsWith('/patient')) {
      return '/doctor/home';
    }

    return null;
  }
}

final routerNotifierProvider = Provider<RouterNotifier>((ref) {
  return RouterNotifier(ref);
});
