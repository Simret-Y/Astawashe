import 'package:flutter/material.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/presentation/auth_screen.dart';
import 'features/doctor/data/doctor_repository.dart';
import 'features/doctor/presentation/doctor_home_screen.dart';
import 'features/patient/data/patient_repository.dart';
import 'features/patient/presentation/patient_home_screen.dart';
import 'features/notifications/data/reminder_notification_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  ReminderNotificationService.instance.initialize();
  runApp(const AstaWasheApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) => const AstaWasheApp();
}

class AstaWasheApp extends StatefulWidget {
  const AstaWasheApp({super.key});

  @override
  State<AstaWasheApp> createState() => _AstaWasheAppState();
}

class _AstaWasheAppState extends State<AstaWasheApp> {
  final _authRepository = AuthRepository();
  final _patientRepository = PatientRepository();
  final _doctorRepository = DoctorRepository();
  AuthUser? _user;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    AuthUser? user;
    try {
      user = await _authRepository.restoreSession();
    } catch (_) {
      user = null;
    }
    if (!mounted) return;
    setState(() {
      _user = user;
      _loading = false;
    });
  }

  void _onAuthenticated(AuthUser user) {
    setState(() => _user = user);
  }

  Future<void> _signOut() async {
    await _authRepository.signOut();
    if (mounted) setState(() => _user = null);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AstaWashe',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: _loading
          ? const _LoadingScreen()
          : _user == null
          ? AuthScreen(
              repository: _authRepository,
              onAuthenticated: _onAuthenticated,
            )
          : _requiresApproval(_user!.status)
          ? _PendingApprovalScreen(
              user: _user!,
              repository: _authRepository,
              onRefresh: _onAuthenticated,
              onSignOut: _signOut,
            )
          : _user!.role == AppUserRole.patient
          ? PatientHomeScreen(
              user: _user!,
              repository: _patientRepository,
              onSignOut: _signOut,
            )
          : _user!.role == AppUserRole.doctor
          ? DoctorHomeScreen(
              user: _user!,
              repository: _doctorRepository,
              onSignOut: _signOut,
            )
          : AuthScreen(
              repository: _authRepository,
              onAuthenticated: _onAuthenticated,
            ),
    );
  }

  bool _requiresApproval(String status) => const {
    'PENDING',
    'PENDING_HOSPITAL_APPROVAL',
    'PENDING_DOCTOR_APPROVAL',
    'HOSPITAL_APPROVED',
    'DOCTOR_APPROVED',
    'REJECTED',
    'SUSPENDED',
  }.contains(status.toUpperCase());
}

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: CircularProgressIndicator()));
}

class _PendingApprovalScreen extends StatefulWidget {
  const _PendingApprovalScreen({
    required this.user,
    required this.repository,
    required this.onRefresh,
    required this.onSignOut,
  });
  final AuthUser user;
  final AuthRepository repository;
  final ValueChanged<AuthUser> onRefresh;
  final VoidCallback onSignOut;

  @override
  State<_PendingApprovalScreen> createState() => _PendingApprovalScreenState();
}

class _PendingApprovalScreenState extends State<_PendingApprovalScreen> {
  bool _checking = false;
  String? _error;

  Future<void> _check() async {
    setState(() {
      _checking = true;
      _error = null;
    });
    try {
      widget.onRefresh(await widget.repository.me());
    } catch (error) {
      if (mounted) setState(() => _error = AuthRepository.errorMessage(error));
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Account status'),
      actions: [
        IconButton(
          onPressed: widget.onSignOut,
          icon: const Icon(Icons.logout_rounded),
        ),
      ],
    ),
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.hourglass_top_rounded, size: 56),
            const SizedBox(height: 14),
            Text(
              widget.user.status.replaceAll('_', ' '),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Your account is awaiting approval or activation by the care team.',
              textAlign: TextAlign.center,
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: _checking ? null : _check,
              child: _checking
                  ? const CircularProgressIndicator()
                  : const Text('Check status'),
            ),
          ],
        ),
      ),
    ),
  );
}
