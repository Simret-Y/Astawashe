import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/auth_session.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'patient_dashboard_screen.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String email;
  final String? demoOtp;

  const VerifyEmailScreen({super.key, required this.email, this.demoOtp});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();
  final _api = ApiService();

  bool _submitting = false;
  String? _error;
  String? _demoOtp;

  @override
  void initState() {
    super.initState();
    _demoOtp = widget.demoOtp;
  }

  Future<void> _verify() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final session = await _api.verifyEmail(
        email: widget.email,
        otp: _otpController.text.trim(),
      );

      if (!mounted) return;

      if (session.role != 'PATIENT') {
        setState(() {
          _error = 'This registration flow is for patient accounts only.';
        });
        return;
      }

      final status = session.user['status']?.toString();

      if (status == 'PENDING_DOCTOR_APPROVAL') {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (_) => PatientApprovalPendingScreen(session: session),
          ),
          (_) => false,
        );
        return;
      }

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => PatientDashboardScreen(session: session),
        ),
        (_) => false,
      );
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = e is ApiException
            ? e.message
            : 'Verification failed. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  Future<void> _resendCode() async {
    if (_submitting) return;

    FocusScope.of(context).unfocus();

    setState(() {
      _error = null;
      _submitting = true;
    });

    try {
      final otp = await _api.resendVerificationCode(email: widget.email);

      if (!mounted) return;

      setState(() {
        _demoOtp = otp;
        _error = otp == null
            ? 'If your email is registered, a new code has been sent.'
            : null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Verification request completed.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = e is ApiException
            ? e.message
            : 'Could not resend the code. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  void dispose() {
    _otpController.dispose();
    _api.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Verify email')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 86,
                      height: 86,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withValues(
                          alpha: 0.09,
                        ),
                        borderRadius: BorderRadius.circular(26),
                      ),
                      child: Icon(
                        Icons.mark_email_read_rounded,
                        size: 45,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Verify your email',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'You’re almost there. Enter the verification code associated with your account.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: const Color(0xFF65748B),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFDCE3ED)),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.email_outlined,
                          color: Color(0xFF315A91),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            widget.email,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: const Color(0xFF18283F),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_demoOtp != null) ...[
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer.withValues(
                          alpha: 0.55,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: theme.colorScheme.primary.withValues(
                            alpha: 0.16,
                          ),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.developer_mode_rounded,
                                color: theme.colorScheme.primary,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Development verification code',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'For development and testing only.',
                            style: theme.textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 16),
                          Center(
                            child: SelectableText(
                              _demoOtp!,
                              style: theme.textTheme.headlineMedium?.copyWith(
                                color: theme.colorScheme.primary,
                                fontSize: 30,
                                letterSpacing: 7,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 28),
                  Text(
                    'Verification code',
                    style: theme.textTheme.titleLarge?.copyWith(fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Enter the 4–6 digit code to continue.',
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 14),
                  Form(
                    key: _formKey,
                    child: TextFormField(
                      controller: _otpController,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.oneTimeCode],
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(6),
                      ],
                      enabled: !_submitting,
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontSize: 24,
                        letterSpacing: 8,
                      ),
                      decoration: const InputDecoration(
                        hintText: '000000',
                        prefixIcon: Icon(Icons.lock_outline),
                        counterText: '',
                      ),
                      onFieldSubmitted: (_) {
                        if (!_submitting) _verify();
                      },
                      validator: (value) {
                        final otp = value?.trim() ?? '';

                        if (otp.length < 4 || otp.length > 6) {
                          return 'Enter a 4–6 digit code.';
                        }

                        return null;
                      },
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 18),
                    _VerificationErrorPanel(message: _error!),
                  ],
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _submitting ? null : _verify,
                    child: _submitting
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.4,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Verify and continue'),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward_rounded, size: 19),
                            ],
                          ),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: _submitting ? null : _resendCode,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Resend verification code'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      foregroundColor: theme.colorScheme.primary,
                      side: BorderSide(
                        color: theme.colorScheme.primary.withValues(
                          alpha: 0.35,
                        ),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Keep your verification code private.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _VerificationErrorPanel extends StatelessWidget {
  const _VerificationErrorPanel({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.errorContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.error.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline_rounded, color: colors.error, size: 21),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: colors.onErrorContainer, height: 1.45),
            ),
          ),
        ],
      ),
    );
  }
}

class PatientApprovalPendingScreen extends StatelessWidget {
  final AuthSession session;

  const PatientApprovalPendingScreen({super.key, required this.session});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Account created'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 94,
                      height: 94,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF2D8),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: const Icon(
                        Icons.hourglass_top_rounded,
                        size: 46,
                        color: Color(0xFF986515),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    'Email verified!',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Your account is almost ready.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.titleLarge?.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Your doctor needs to approve your patient account before you can access the app. Please return to sign in after your account has been approved.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: const Color(0xFF65748B),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFDCE3ED)),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          color: Color(0xFF315A91),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'No further action is needed on this screen. Approval must come from your doctor.',
                            style: TextStyle(height: 1.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  FilledButton(
                    onPressed: () {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                        (_) => false,
                      );
                    },
                    child: const Text('Return to sign in'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
