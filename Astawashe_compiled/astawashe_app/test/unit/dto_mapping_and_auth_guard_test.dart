import 'package:flutter_test/flutter_test.dart';
import 'package:astawashe_app/features/patient/domain/models/patient_models.dart';
import 'package:astawashe_app/features/doctor/domain/models/doctor_models.dart';
import 'package:astawashe_app/features/auth/domain/models/auth_models.dart';
import 'package:astawashe_app/core/router/router_notifier.dart';
import 'package:astawashe_app/features/auth/presentation/providers/auth_state_provider.dart';

void main() {
  group('DTO Mapping Tests', () {
    test('DoseLog maps correctly from backend payload', () {
      final json = {
        'id': 'sched-101',
        'medication': 'Metformin 500mg',
        'dosage': '500mg',
        'time': '08:00 AM',
        'doseStatus': 'TAKEN',
        'scheduledDate': '2026-10-22T00:00:00.000Z',
      };

      final dose = DoseLog(
        id: json['id'] as String,
        patientId: 'patient-123',
        scheduleId: json['id'] as String,
        medicationName: json['medication'] as String,
        dosage: json['dosage'] as String,
        scheduledTime: json['time'] as String,
        scheduledDate: DateTime.parse(json['scheduledDate'] as String),
        status: (json['doseStatus'] as String).toLowerCase(),
      );

      expect(dose.id, 'sched-101');
      expect(dose.isTaken, isTrue);
      expect(dose.medicationName, 'Metformin 500mg');
      expect(dose.dosage, '500mg');
    });

    test(
      'DoctorDashboardData parses doctor statistics and patient summaries',
      () {
        const doctor = Doctor(
          id: 'doc-1',
          userId: 'u-doc',
          hospitalId: 'hosp-1',
          name: 'Dr. Test',
          specialization: 'Cardiology',
        );

        const patient = PatientSummary(
          id: 'p-1',
          name: 'Patient One',
          age: 40,
          gender: 'Male',
          adherenceRate: 90.0,
          activeMedsCount: 2,
          status: 'on_track',
        );

        const dashboard = DoctorDashboardData(
          doctor: doctor,
          totalPatients: 10,
          onTrackCount: 8,
          needAttentionCount: 2,
          missedDoseCount: 1,
          recentPatients: [patient],
          pendingRequests: [],
          riskPatients: [],
          averageAdherence: 85.5,
        );

        expect(dashboard.doctor.name, 'Dr. Test');
        expect(dashboard.onTrackCount, 8);
        expect(dashboard.recentPatients.first.isOnTrack, isTrue);
        expect(dashboard.averageAdherence, 85.5);
      },
    );

    test('PatientProfile correctly maps reminderMode and language', () {
      const profile = PatientProfile(
        id: 'pat-1',
        userId: 'u-1',
        hospitalId: 'h-1',
        doctorId: 'd-1',
        fullName: 'Abebe Bikila',
        nickname: 'Abebe',
        reminderMode: 'VOICE',
        language: 'am',
      );

      expect(profile.fullName, 'Abebe Bikila');
      expect(profile.reminderMode, 'VOICE');
      expect(profile.language, 'am');
      expect(profile.status, 'ACTIVE');
    });
  });

  group('Auth Guard & Router Redirect Tests', () {
    test('Unauthenticated user is redirected to /splash', () {
      final redirect = RouterNotifier.evaluateRedirect(
        authState: const AuthState(status: AuthStatus.unauthenticated),
        loc: '/patient/home',
      );

      expect(redirect, '/splash');
    });

    test(
      'Doctor with PENDING_HOSPITAL_APPROVAL is redirected to /pending-approval',
      () {
        const user = User(
          id: 'doc-pending',
          role: 'DOCTOR',
          status: 'PENDING_HOSPITAL_APPROVAL',
        );

        final redirect = RouterNotifier.evaluateRedirect(
          authState: const AuthState(
            status: AuthStatus.authenticated,
            user: user,
          ),
          loc: '/doctor/home',
        );

        expect(redirect, '/pending-approval');
      },
    );

    test('Approved Doctor is redirected to /doctor/home from /login', () {
      const user = User(
        id: 'doc-approved',
        role: 'DOCTOR',
        status: 'ACTIVE',
      );

      final redirect = RouterNotifier.evaluateRedirect(
        authState: const AuthState(
          status: AuthStatus.authenticated,
          user: user,
        ),
        loc: '/login',
      );

      expect(redirect, '/doctor/home');
    });

    test(
      'Patient cannot access /doctor routes and is redirected to /patient/home',
      () {
        const user = User(
          id: 'pat-active',
          role: 'PATIENT',
          status: 'ACTIVE',
        );

        final redirect = RouterNotifier.evaluateRedirect(
          authState: const AuthState(
            status: AuthStatus.authenticated,
            user: user,
          ),
          loc: '/doctor/home',
        );

        expect(redirect, '/patient/home');
      },
    );

    test(
      'Doctor cannot access /patient routes and is redirected to /doctor/home',
      () {
        const user = User(
          id: 'doc-active',
          role: 'DOCTOR',
          status: 'ACTIVE',
        );

        final redirect = RouterNotifier.evaluateRedirect(
          authState: const AuthState(
            status: AuthStatus.authenticated,
            user: user,
          ),
          loc: '/patient/schedule',
        );

        expect(redirect, '/doctor/home');
      },
    );
  });
}
