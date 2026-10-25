import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_state_provider.dart';
import '../../../../core/theme/app_colors.dart';

class PendingApprovalScreen extends ConsumerStatefulWidget {
  const PendingApprovalScreen({super.key});

  @override
  ConsumerState<PendingApprovalScreen> createState() =>
      _PendingApprovalScreenState();
}

class _PendingApprovalScreenState extends ConsumerState<PendingApprovalScreen> {
  bool _isChecking = false;
  String? _statusMessage;

  Future<void> _checkStatus() async {
    setState(() {
      _isChecking = true;
      _statusMessage = null;
    });

    try {
      await ref.read(authStateProvider.notifier).checkSession();
      final authState = ref.read(authStateProvider);
      final user = authState.user;

      if (!mounted) return;

      final status = user?.status?.toUpperCase();
      if (status == 'ACTIVE' ||
          status == 'APPROVED' ||
          status == 'DOCTOR_APPROVED') {
        setState(() {
          _statusMessage = 'Your account has been approved! Redirecting...';
        });
        await Future.delayed(const Duration(milliseconds: 1200));
        if (mounted) {
          if (authState.isDoctor) {
            context.go('/doctor/home');
          } else {
            context.go('/patient/home');
          }
        }
      } else {
        setState(() {
          _statusMessage =
              'Application is still under review. Please check back later.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _statusMessage = 'Unable to check status. Please check your network.';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isChecking = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final user = authState.user;
    final isDoctor = authState.isDoctor;
    final status = user?.status ?? 'PENDING';

    final isRejected = status.toUpperCase().contains('REJECTED');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Account Status'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out',
            onPressed: () async {
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) {
                context.go('/splash');
              }
            },
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: isRejected
                      ? Colors.red.withAlpha(30)
                      : AppColors.primary.withAlpha(25),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isRejected
                      ? Icons.error_outline_rounded
                      : Icons.hourglass_top_rounded,
                  size: 48,
                  color: isRejected ? Colors.red : AppColors.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                isRejected
                    ? 'Registration Rejected'
                    : isDoctor
                    ? 'Doctor Application Under Review'
                    : 'Patient Approval Pending',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                isRejected
                    ? 'Your registration could not be approved at this time. Please contact your hospital administration.'
                    : isDoctor
                    ? 'Your doctor account was submitted to your selected hospital and is currently waiting for administrator review.'
                    : 'Your patient account was submitted and is waiting for your assigned doctor to approve.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(10),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _buildInfoRow('Name', user?.fullName ?? 'N/A'),
                    const Divider(height: 20),
                    _buildInfoRow('Email', user?.email ?? 'N/A'),
                    const Divider(height: 20),
                    _buildInfoRow('Role', isDoctor ? 'Doctor' : 'Patient'),
                    const Divider(height: 20),
                    _buildInfoRow(
                      'Status',
                      status,
                      color: isRejected ? Colors.red : Colors.orange[800],
                    ),
                  ],
                ),
              ),
              if (_statusMessage != null) ...[
                const SizedBox(height: 20),
                Text(
                  _statusMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: _statusMessage!.contains('approved')
                        ? Colors.green[700]
                        : Colors.blue[700],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _isChecking ? null : _checkStatus,
                  icon: _isChecking
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.refresh_rounded),
                  label: Text(_isChecking ? 'Checking...' : 'Check Status Now'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () async {
                  await ref.read(authStateProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/splash');
                  }
                },
                child: const Text('Sign in with a different account'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: color ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
