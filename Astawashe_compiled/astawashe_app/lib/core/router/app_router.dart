import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'router_notifier.dart';

// Auth screens
import '../../features/auth/presentation/screens/splash_welcome_screen.dart';
import '../../features/auth/presentation/screens/doctor_splash_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/pending_approval_screen.dart';
import '../../features/auth/presentation/screens/otp_verification_screen.dart';

// Patient screens
import '../../features/patient/presentation/screens/patient_main_scaffold.dart';
import '../../features/patient/presentation/screens/take_medication_success_screen.dart';
import '../../features/patient/presentation/screens/voice_reminder_screen.dart';
import '../../features/patient/presentation/screens/my_medications_screen.dart';
import '../../features/patient/presentation/screens/reminders_settings_screen.dart';
import '../../features/patient/presentation/screens/care_team_screen.dart';
import '../../features/patient/presentation/screens/health_info_screen.dart';
import '../../features/patient/presentation/screens/emergency_contacts_screen.dart';
import '../../features/patient/domain/models/patient_models.dart';

// Doctor screens
import '../../features/doctor/presentation/screens/doctor_main_scaffold.dart';
import '../../features/doctor/presentation/screens/patient_detail_screen.dart';
import '../../features/doctor/presentation/screens/adherence_insights_screen.dart';
import '../../features/doctor/presentation/screens/doctor_chat_screen.dart';
import '../../features/doctor/presentation/screens/patient_requests_screen.dart';
import '../../features/doctor/presentation/screens/prescriptions_screen.dart';
import '../../features/doctor/presentation/screens/doctor_profile_screen.dart';

// Assistant
import '../../features/assistant/presentation/screens/assistant_chat_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      // Auth routes
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashWelcomeScreen(),
      ),
      GoRoute(
        path: '/doctor/splash',
        builder: (context, state) => const DoctorSplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) {
          final tab = state.uri.queryParameters['tab'];
          final mode = state.uri.queryParameters['mode'];
          return LoginScreen(initialTab: tab, initialMode: mode);
        },
      ),
      GoRoute(
        path: '/pending-approval',
        builder: (context, state) => const PendingApprovalScreen(),
      ),
      GoRoute(
        path: '/verify-otp',
        builder: (context, state) {
          final email = state.uri.queryParameters['email'] ?? '';
          final role = state.uri.queryParameters['role'] ?? 'PATIENT';
          final demoOtp = state.uri.queryParameters['demoOtp'];
          return OtpVerificationScreen(
            email: email,
            role: role,
            initialDemoOtp: demoOtp,
          );
        },
      ),

      // Patient Routes
      GoRoute(
        path: '/patient/home',
        builder: (context, state) => const PatientMainScaffold(initialIndex: 0),
      ),
      GoRoute(
        path: '/patient/schedule',
        builder: (context, state) => const PatientMainScaffold(initialIndex: 1),
      ),
      GoRoute(
        path: '/patient/history',
        builder: (context, state) => const PatientMainScaffold(initialIndex: 2),
      ),
      GoRoute(
        path: '/patient/more',
        builder: (context, state) => const PatientMainScaffold(initialIndex: 3),
      ),
      GoRoute(
        path: '/patient/medications',
        builder: (context, state) => const MyMedicationsScreen(),
      ),
      GoRoute(
        path: '/patient/reminders',
        builder: (context, state) => const RemindersSettingsScreen(),
      ),
      GoRoute(
        path: '/patient/care-team',
        builder: (context, state) => const CareTeamScreen(),
      ),
      GoRoute(
        path: '/patient/health-info',
        builder: (context, state) => const HealthInfoScreen(),
      ),
      GoRoute(
        path: '/patient/emergency',
        builder: (context, state) => const EmergencyContactsScreen(),
      ),
      GoRoute(
        path: '/patient/take-medication',
        builder: (context, state) {
          final dose = state.extra as DoseLog?;
          return TakeMedicationSuccessScreen(dose: dose);
        },
      ),
      GoRoute(
        path: '/patient/voice-reminder',
        builder: (context, state) => const VoiceReminderScreen(),
      ),

      // Doctor Routes
      GoRoute(
        path: '/doctor/home',
        builder: (context, state) => const DoctorMainScaffold(initialIndex: 0),
      ),
      GoRoute(
        path: '/doctor/patients',
        builder: (context, state) => const DoctorMainScaffold(initialIndex: 1),
      ),
      GoRoute(
        path: '/doctor/patients/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return PatientDetailScreen(patientId: id);
        },
      ),
      GoRoute(
        path: '/doctor/messages',
        builder: (context, state) => const DoctorMainScaffold(initialIndex: 2),
      ),
      GoRoute(
        path: '/doctor/messages/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return DoctorChatScreen(conversationId: id);
        },
      ),
      GoRoute(
        path: '/doctor/more',
        builder: (context, state) => const DoctorMainScaffold(initialIndex: 3),
      ),
      GoRoute(
        path: '/doctor/insights',
        builder: (context, state) => const AdherenceInsightsScreen(),
      ),
      GoRoute(
        path: '/doctor/requests',
        builder: (context, state) => const PatientRequestsScreen(),
      ),
      GoRoute(
        path: '/doctor/prescriptions',
        builder: (context, state) => const PrescriptionsScreen(),
      ),
      GoRoute(
        path: '/doctor/profile',
        builder: (context, state) => const DoctorProfileScreen(),
      ),

      // AI Assistant Route
      GoRoute(
        path: '/assistant',
        builder: (context, state) => const AssistantChatScreen(),
      ),
    ],
    errorBuilder: (context, state) =>
        Scaffold(body: Center(child: Text('Page not found: ${state.error}'))),
  );
});
