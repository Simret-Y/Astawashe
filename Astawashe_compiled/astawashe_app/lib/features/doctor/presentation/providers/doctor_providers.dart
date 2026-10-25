import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/doctor_models.dart';
import '../../domain/models/message_models.dart';
import '../../domain/repositories/message_repository.dart';
import '../../domain/repositories/prescription_repository.dart';
import '../../../patient/domain/repositories/patient_repository.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';

final doctorDashboardProvider = FutureProvider.autoDispose<DoctorDashboardData>(
  (ref) async {
    final repo = ref.watch(patientRepositoryProvider);
    final user = ref.watch(authStateProvider).user;
    final doctorId =
        user?.profileData?['doctorId']?.toString() ?? user?.id ?? 'doctor-001';
    return repo.getDoctorDashboard(doctorId);
  },
);

class PatientFilterNotifier extends Notifier<String> {
  @override
  String build() => 'All';

  void setFilter(String filter) => state = filter;
}

final patientFilterProvider = NotifierProvider<PatientFilterNotifier, String>(
  () {
    return PatientFilterNotifier();
  },
);

class PatientSearchQueryNotifier extends Notifier<String> {
  @override
  String build() => '';

  void setQuery(String query) => state = query;
}

final patientSearchQueryProvider =
    NotifierProvider<PatientSearchQueryNotifier, String>(() {
      return PatientSearchQueryNotifier();
    });

final doctorPatientsProvider = FutureProvider.autoDispose<List<PatientSummary>>(
  (ref) async {
    final repo = ref.watch(patientRepositoryProvider);
    final filter = ref.watch(patientFilterProvider);
    final query = ref.watch(patientSearchQueryProvider);
    return repo.getDoctorPatients(query: query, filter: filter);
  },
);

final doctorConversationsProvider =
    FutureProvider.autoDispose<List<Conversation>>((ref) async {
      final repo = ref.watch(messageRepositoryProvider);
      final user = ref.watch(authStateProvider).user;
      final userId = user?.id ?? 'doctor-001';
      return repo.getConversations(userId);
    });

final doctorPendingRequestsProvider =
    FutureProvider.autoDispose<List<PatientApprovalRequest>>((ref) async {
      final repo = ref.watch(patientRepositoryProvider);
      final user = ref.watch(authStateProvider).user;
      final doctorId =
          user?.profileData?['doctorId']?.toString() ??
          user?.id ??
          'doctor-001';
      return repo.getPendingRequests(doctorId);
    });

final doctorPrescriptionsProvider =
    FutureProvider.autoDispose<List<Prescription>>((ref) async {
      final repo = ref.watch(prescriptionRepositoryProvider);
      final user = ref.watch(authStateProvider).user;
      final doctorId =
          user?.profileData?['doctorId']?.toString() ??
          user?.id ??
          'doctor-001';
      return repo.getPrescriptions(doctorId: doctorId);
    });
