import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import '../config/app_config.dart';
import '../storage/secure_storage_service.dart';
import '../../features/patient/presentation/providers/patient_providers.dart';
import '../../features/doctor/presentation/providers/doctor_providers.dart';
import '../../features/auth/presentation/providers/auth_state_provider.dart';

enum RealtimeStatus { connected, connecting, disconnected }

class RealtimeService with WidgetsBindingObserver {
  final Ref ref;
  final SecureStorageService storage;
  socket_io.Socket? _socket;
  Timer? _pollingTimer;
  RealtimeStatus _status = RealtimeStatus.disconnected;
  final _statusController = StreamController<RealtimeStatus>.broadcast();

  RealtimeService({required this.ref, required this.storage}) {
    WidgetsBinding.instance.addObserver(this);
    _initSocket();
  }

  Stream<RealtimeStatus> get statusStream => _statusController.stream;
  RealtimeStatus get currentStatus => _status;

  Future<void> _initSocket() async {
    final token = await storage.getAccessToken();

    _updateStatus(RealtimeStatus.connecting);

    try {
      _socket = socket_io.io(
        AppConfig.socketBaseUrl,
        socket_io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .setAuth({'token': token})
            .setExtraHeaders(
              token != null ? {'Authorization': 'Bearer $token'} : {},
            )
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(2000)
            .setReconnectionAttempts(999)
            .build(),
      );

      _socket?.onConnect((_) {
        _updateStatus(RealtimeStatus.connected);
        _stopFallbackPolling();
      });

      _socket?.onDisconnect((_) {
        _updateStatus(RealtimeStatus.disconnected);
        _startFallbackPolling();
      });

      _socket?.onConnectError((_) {
        _updateStatus(RealtimeStatus.disconnected);
        _startFallbackPolling();
      });

      _socket?.onError((_) {
        _updateStatus(RealtimeStatus.disconnected);
        _startFallbackPolling();
      });

      // 1. Dose Updated event
      _socket?.on('dose:updated', (data) {
        ref.invalidate(todayDosesProvider);
        ref.invalidate(patientDashboardProvider);
        ref.invalidate(doctorDashboardProvider);
        ref.invalidate(doctorPatientsProvider);
      });

      // 2. Alert Created event
      _socket?.on('alert:created', (data) {
        ref.invalidate(doctorDashboardProvider);
        ref.invalidate(doctorPatientsProvider);
      });

      // 3. Request Updated (Patient Approval)
      _socket?.on('request:updated', (data) {
        ref.invalidate(doctorPendingRequestsProvider);
        ref.invalidate(doctorDashboardProvider);
        // Refresh session to re-check pending approval status
        try {
          ref.read(authStateProvider.notifier).checkSession();
        } catch (_) {}
      });

      // 4. Prescription Updated event
      _socket?.on('prescription:updated', (data) {
        ref.invalidate(patientMedicationsProvider);
        ref.invalidate(patientDashboardProvider);
        ref.invalidate(todayDosesProvider);
        ref.invalidate(doctorPrescriptionsProvider);
      });

      // 5. Message New event
      _socket?.on('message:new', (data) {
        ref.invalidate(doctorConversationsProvider);
      });
    } catch (_) {
      _updateStatus(RealtimeStatus.disconnected);
      _startFallbackPolling();
    }
  }

  void _updateStatus(RealtimeStatus newStatus) {
    if (_status != newStatus) {
      _status = newStatus;
      _statusController.add(newStatus);
    }
  }

  void _startFallbackPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _refreshAllData();
    });
  }

  void _stopFallbackPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  void _refreshAllData() {
    ref.invalidate(patientDashboardProvider);
    ref.invalidate(todayDosesProvider);
    ref.invalidate(doctorDashboardProvider);
    ref.invalidate(doctorPatientsProvider);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshAllData();
      if (_socket?.disconnected ?? true) {
        _socket?.connect();
      }
    }
  }

  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _stopFallbackPolling();
    _socket?.disconnect();
    _socket?.dispose();
    _statusController.close();
  }
}

final realtimeServiceProvider = Provider<RealtimeService>((ref) {
  final storage = ref.watch(secureStorageServiceProvider);
  final service = RealtimeService(ref: ref, storage: storage);
  ref.onDispose(() => service.dispose());
  return service;
});

final realtimeStatusProvider = StreamProvider<RealtimeStatus>((ref) {
  final service = ref.watch(realtimeServiceProvider);
  return service.statusStream;
});

/// Reconnecting banner widget for Flutter app
class RealtimeStatusBanner extends ConsumerWidget {
  const RealtimeStatusBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(realtimeStatusProvider);
    final status = statusAsync.value ?? RealtimeStatus.connected;

    if (status == RealtimeStatus.connected) {
      return const SizedBox.shrink();
    }

    final isConnecting = status == RealtimeStatus.connecting;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
      color: isConnecting ? Colors.amber.shade700 : Colors.red.shade700,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 10,
            height: 10,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            isConnecting
                ? 'Connecting to live updates...'
                : 'Offline · Polling fallback active (30s)',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
