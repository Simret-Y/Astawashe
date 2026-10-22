import 'package:flutter/material.dart';

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
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final session = await _api.verifyEmail(
        email: widget.email,
        otp: _otpController.text,
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
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _resendCode() async {
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
        const SnackBar(content: Text('Verification request completed.')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException
            ? e.message
            : 'Could not resend the code. Please try again.';
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
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
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Icon(
              Icons.mark_email_read_outlined,
              size: 64,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(height: 20),
            Text(
              'Check your email',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Text('Enter the verification code for ${widget.email}.'),
            if (_demoOtp != null) ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Development verification code'),
                    const SizedBox(height: 8),
                    SelectableText(
                      _demoOtp!,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            Form(
              key: _formKey,
              child: TextFormField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: const InputDecoration(
                  labelText: 'Verification code',
                  prefixIcon: Icon(Icons.password),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  final otp = value?.trim() ?? '';
                  return otp.length < 4 || otp.length > 6
                      ? 'Enter the 4–6 digit code'
                      : null;
                },
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submitting ? null : _verify,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Verify and continue'),
              ),
            ),
            TextButton(
              onPressed: _submitting ? null : _resendCode,
              child: const Text('Resend verification code'),
            ),
          ],
        ),
      ),
    );
  }
}

class PatientApprovalPendingScreen extends StatelessWidget {
  final AuthSession session;

  const PatientApprovalPendingScreen({super.key, required this.session});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Account created')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.hourglass_top, size: 64),
              const SizedBox(height: 20),
              Text(
                'Awaiting doctor approval',
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                'Your email is verified. Your doctor must approve your patient account before you can continue.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
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
    );
  }
}
