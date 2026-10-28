import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_state_provider.dart';
import '../../../../core/theme/app_colors.dart';

class OtpVerificationScreen extends ConsumerStatefulWidget {
  final String email;
  final String role;
  final String? initialDemoOtp;

  const OtpVerificationScreen({
    super.key,
    required this.email,
    required this.role,
    this.initialDemoOtp,
  });

  @override
  ConsumerState<OtpVerificationScreen> createState() =>
      _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends ConsumerState<OtpVerificationScreen> {
  final TextEditingController _otpController = TextEditingController();
  bool _isVerifying = false;
  bool _isResending = false;
  String? _feedbackMessage;
  String? _demoOtp;
  int _resendCooldown = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _demoOtp = widget.initialDemoOtp;
    if (_demoOtp != null && _demoOtp!.isNotEmpty) {
      _otpController.text = _demoOtp!;
    }
    _startCooldownTimer();
  }

  void _startCooldownTimer() {
    _resendCooldown = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendCooldown > 0) {
        setState(() => _resendCooldown--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleVerify() async {
    final otp = _otpController.text.trim();
    if (otp.length < 4) {
      setState(() {
        _feedbackMessage = 'Please enter a valid verification code.';
      });
      return;
    }

    setState(() {
      _isVerifying = true;
      _feedbackMessage = null;
    });

    try {
      final success = await ref
          .read(authStateProvider.notifier)
          .verifyEmail(email: widget.email, otp: otp);

      if (!mounted) return;

      if (success) {
        final authState = ref.read(authStateProvider);
        final status = authState.user?.status?.toUpperCase() ?? 'PENDING';

        final isPending =
            status == 'PENDING' ||
            status == 'PENDING_HOSPITAL_APPROVAL' ||
            status == 'PENDING_DOCTOR_APPROVAL' ||
            status == 'PENDING_SYSTEM_APPROVAL';

        if (isPending) {
          context.go('/pending-approval');
        } else {
          final isDoctor =
              widget.role.toUpperCase() == 'DOCTOR' ||
              authState.user?.role.toUpperCase() == 'DOCTOR';
          context.go(isDoctor ? '/doctor/home' : '/patient/home');
        }
      } else {
        setState(() {
          _feedbackMessage =
              ref.read(authStateProvider).errorMessage ??
              'Invalid code. Please verify and try again.';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isVerifying = false);
      }
    }
  }

  Future<void> _handleResend() async {
    if (_resendCooldown > 0 || _isResending) return;

    setState(() {
      _isResending = true;
      _feedbackMessage = null;
    });

    try {
      final success = await ref
          .read(authStateProvider.notifier)
          .resendVerificationEmail(email: widget.email);

      if (!mounted) return;

      if (success) {
        _startCooldownTimer();
        setState(() {
          _feedbackMessage = 'A new verification code has been sent.';
        });
      } else {
        setState(() {
          _feedbackMessage = 'Failed to resend code. Please try again.';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isResending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDoctor = widget.role.toUpperCase() == 'DOCTOR';
    final primaryColor = isDoctor ? AppColors.doctorNavy : AppColors.primary;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          isDoctor ? 'Doctor Verification' : 'Email Verification',
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 16),
              // Icon Badge
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: primaryColor.withAlpha(20),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.mark_email_read_outlined,
                  size: 40,
                  color: primaryColor,
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'Verify Your Account',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                  children: [
                    const TextSpan(
                      text:
                          'Please enter the 6-digit verification code sent to\n',
                    ),
                    TextSpan(
                      text: widget.email,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Demo OTP Banner if present
              if (_demoOtp != null && _demoOtp!.isNotEmpty) ...[
                InkWell(
                  onTap: () {
                    _otpController.text = _demoOtp!;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Demo OTP code filled!'),
                        duration: Duration(seconds: 1),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.lightbulb_outline,
                          color: Color(0xFF2563EB),
                          size: 22,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Sample Test OTP Available',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                  color: Color(0xFF1E40AF),
                                ),
                              ),
                              Text(
                                'Tap here to fill sample code: $_demoOtp',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF3B82F6),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.touch_app_outlined,
                          size: 18,
                          color: Color(0xFF2563EB),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // OTP Input Field
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  maxLength: 6,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 14,
                    color: AppColors.textPrimary,
                  ),
                  decoration: const InputDecoration(
                    counterText: '',
                    border: InputBorder.none,
                    hintText: '••••••',
                    hintStyle: TextStyle(
                      letterSpacing: 12,
                      color: Color(0xFFCBD5E1),
                    ),
                    contentPadding: EdgeInsets.symmetric(vertical: 16),
                  ),
                  onSubmitted: (_) => _handleVerify(),
                ),
              ),

              // Feedback Error or Success Message
              if (_feedbackMessage != null) ...[
                const SizedBox(height: 12),
                Text(
                  _feedbackMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _feedbackMessage!.contains('sent')
                        ? Colors.green[700]
                        : AppColors.statusDanger,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isVerifying ? null : _handleVerify,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _isVerifying
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Verify & Proceed',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 20),

              // Resend OTP Row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Didn't receive the code? ",
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  GestureDetector(
                    onTap: _resendCooldown == 0 && !_isResending
                        ? _handleResend
                        : null,
                    child: Text(
                      _resendCooldown > 0
                          ? 'Resend in ${_resendCooldown}s'
                          : 'Resend Code',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: _resendCooldown > 0
                            ? AppColors.textMuted
                            : primaryColor,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 28),

              // Back to sign in
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text(
                  'Change email or return to sign in',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
