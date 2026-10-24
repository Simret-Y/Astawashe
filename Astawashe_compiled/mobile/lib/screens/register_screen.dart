import 'package:flutter/material.dart';

import '../services/api_service.dart';
import 'verify_email_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  List<Map<String, dynamic>> _hospitals = [];
  List<Map<String, dynamic>> _doctors = [];

  String? _hospitalId;
  String? _doctorId;
  String? _gender;

  bool _loadingHospitals = true;
  bool _loadingDoctors = false;
  bool _submitting = false;
  bool _obscurePassword = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadHospitals();
  }

  Future<void> _loadHospitals() async {
    try {
      final hospitals = await _api.getApprovedHospitals();
      if (!mounted) return;

      setState(() {
        _hospitals = hospitals;
        _loadingHospitals = false;
        if (hospitals.isEmpty) {
          _error = 'No approved hospitals are available yet.';
        }
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _loadingHospitals = false;
        _error = e is ApiException
            ? e.message
            : 'Could not load hospitals. Please try again.';
      });
    }
  }

  Future<void> _selectHospital(String? hospitalId) async {
    setState(() {
      _hospitalId = hospitalId;
      _doctorId = null;
      _doctors = [];
      _error = null;
      _loadingDoctors = hospitalId != null;
    });

    if (hospitalId == null) return;

    try {
      final doctors = await _api.getHospitalDoctors(hospitalId);
      if (!mounted || _hospitalId != hospitalId) return;

      setState(() {
        _doctors = doctors;
        _loadingDoctors = false;
        if (doctors.isEmpty) {
          _error = 'No eligible doctors are available at this hospital.';
        }
      });
    } catch (e) {
      if (!mounted || _hospitalId != hospitalId) return;

      setState(() {
        _loadingDoctors = false;
        _error = e is ApiException
            ? e.message
            : 'Could not load doctors. Please try again.';
      });
    }
  }

  Future<void> _register() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) return;

    if (_hospitalId == null || _doctorId == null) {
      setState(() {
        _error = 'Please select a hospital and doctor.';
      });
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final result = await _api.registerPatient(
        fullName: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        phone: _phoneController.text.trim(),
        hospitalId: _hospitalId!,
        doctorId: _doctorId!,
        gender: _gender,
      );

      if (!mounted) return;

      if (result['requiresEmailVerification'] != true) {
        setState(() {
          _error =
              'Registration did not request email verification. Please contact support.';
        });
        return;
      }

      final demoOtp = result['demoOtp'];

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => VerifyEmailScreen(
            email: _emailController.text.trim(),
            demoOtp: demoOtp is String ? demoOtp : null,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = e is ApiException
            ? e.message
            : 'Registration failed. Please check your details and try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _api.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: SafeArea(
        child: _loadingHospitals
            ? const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Preparing registration...'),
                  ],
                ),
              )
            : Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 600),
                  child: Form(
                    key: _formKey,
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
                      children: [
                        Center(
                          child: Container(
                            width: 68,
                            height: 68,
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary.withValues(
                                alpha: 0.09,
                              ),
                              borderRadius: BorderRadius.circular(21),
                            ),
                            child: Icon(
                              Icons.person_add_alt_1_rounded,
                              color: theme.colorScheme.primary,
                              size: 34,
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          'Join AstaWashe',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.headlineMedium,
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Create your patient account to manage your medication and health routines.',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: const Color(0xFF65748B),
                          ),
                        ),
                        const SizedBox(height: 30),
                        const _SectionHeading(
                          title: 'Personal information',
                          subtitle: 'Tell us a little about yourself.',
                        ),
                        const SizedBox(height: 18),
                        TextFormField(
                          controller: _nameController,
                          textCapitalization: TextCapitalization.words,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.name],
                          enabled: !_submitting,
                          decoration: const InputDecoration(
                            labelText: 'Full name',
                            hintText: 'Enter your full name',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().length < 2) {
                              return 'Enter your full name.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.email],
                          enabled: !_submitting,
                          decoration: const InputDecoration(
                            labelText: 'Email address',
                            hintText: 'you@example.com',
                            prefixIcon: Icon(Icons.email_outlined),
                          ),
                          validator: (value) {
                            final email = value?.trim() ?? '';

                            if (email.isEmpty) {
                              return 'Enter your email address.';
                            }

                            if (!RegExp(
                              r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                            ).hasMatch(email)) {
                              return 'Enter a valid email address.';
                            }

                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.telephoneNumber],
                          enabled: !_submitting,
                          decoration: const InputDecoration(
                            labelText: 'Phone number (optional)',
                            hintText: 'Enter your phone number',
                            prefixIcon: Icon(Icons.phone_outlined),
                          ),
                          validator: (value) {
                            final phone = value?.trim() ?? '';

                            if (phone.isNotEmpty &&
                                (phone.length < 8 ||
                                    !RegExp(
                                      r'^[0-9+\-()\s]+$',
                                    ).hasMatch(phone))) {
                              return 'Enter a valid phone number.';
                            }

                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.newPassword],
                          enabled: !_submitting,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            hintText: 'Create a password',
                            helperText: 'Use at least 6 characters.',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              tooltip: _obscurePassword
                                  ? 'Show password'
                                  : 'Hide password',
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.length < 6) {
                              return 'Password must be at least 6 characters.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 28),
                        const _SectionHeading(
                          title: 'Your healthcare provider',
                          subtitle:
                              'Choose the hospital and doctor associated with your care.',
                        ),
                        const SizedBox(height: 18),
                        DropdownButtonFormField<String>(
                          initialValue: _hospitalId,
                          isExpanded: true,
                          decoration: const InputDecoration(
                            labelText: 'Hospital',
                            prefixIcon: Icon(Icons.local_hospital_outlined),
                          ),
                          hint: const Text('Select your hospital'),
                          items: _hospitals.map((hospital) {
                            return DropdownMenuItem<String>(
                              value: hospital['id'] as String,
                              child: Text(
                                hospital['name'] as String? ?? 'Hospital',
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }).toList(),
                          onChanged: _submitting ? null : _selectHospital,
                          validator: (value) {
                            return value == null
                                ? 'Please select a hospital.'
                                : null;
                          },
                        ),
                        const SizedBox(height: 16),
                        if (_loadingDoctors) ...[
                          const LinearProgressIndicator(),
                          const SizedBox(height: 12),
                          Text(
                            'Loading doctors...',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ] else
                          DropdownButtonFormField<String>(
                            key: ValueKey(_hospitalId),
                            initialValue: _doctorId,
                            isExpanded: true,
                            decoration: const InputDecoration(
                              labelText: 'Doctor',
                              prefixIcon: Icon(Icons.medical_services_outlined),
                            ),
                            hint: Text(
                              _hospitalId == null
                                  ? 'Select a hospital first'
                                  : 'Select your doctor',
                            ),
                            items: _doctors.map((doctor) {
                              return DropdownMenuItem<String>(
                                value: doctor['id'] as String,
                                child: Text(
                                  doctor['name'] as String? ?? 'Doctor',
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                            onChanged: _submitting || _hospitalId == null
                                ? null
                                : (value) {
                                    setState(() {
                                      _doctorId = value;
                                      _error = null;
                                    });
                                  },
                            validator: (value) {
                              return value == null
                                  ? 'Please select a doctor.'
                                  : null;
                            },
                          ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          initialValue: _gender,
                          isExpanded: true,
                          decoration: const InputDecoration(
                            labelText: 'Gender (optional)',
                            prefixIcon: Icon(Icons.wc_outlined),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'MALE',
                              child: Text('Male'),
                            ),
                            DropdownMenuItem(
                              value: 'FEMALE',
                              child: Text('Female'),
                            ),
                            DropdownMenuItem(
                              value: 'OTHER',
                              child: Text('Other'),
                            ),
                          ],
                          onChanged: _submitting
                              ? null
                              : (value) {
                                  setState(() => _gender = value);
                                },
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 20),
                          _ErrorPanel(message: _error!),
                        ],
                        const SizedBox(height: 28),
                        FilledButton(
                          onPressed: _submitting ? null : _register,
                          child: _submitting
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.4,
                                  ),
                                )
                              : const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('Create account'),
                                    SizedBox(width: 8),
                                    Icon(Icons.arrow_forward_rounded, size: 19),
                                  ],
                                ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          'You will verify your email to complete registration.',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontSize: 12,
                          ),
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

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: theme.textTheme.titleLarge),
        const SizedBox(height: 5),
        Text(subtitle, style: theme.textTheme.bodyMedium),
      ],
    );
  }
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({required this.message});

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
              style: TextStyle(color: colors.onErrorContainer, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
