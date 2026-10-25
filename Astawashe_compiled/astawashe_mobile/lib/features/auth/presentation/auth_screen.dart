import 'package:flutter/material.dart';

import '../../../core/router/app_router.dart';
import '../data/auth_repository.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    required this.repository,
    required this.onAuthenticated,
    super.key,
  });

  final AuthRepository repository;
  final ValueChanged<AuthUser> onAuthenticated;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  final _specialization = TextEditingController();
  final _experience = TextEditingController();
  bool _register = false;
  bool _verifying = false;
  bool _busy = false;
  AppUserRole _role = AppUserRole.patient;
  String? _error;
  String? _demoOtp;
  String? _hospitalId;
  String? _doctorId;
  List<Map<String, dynamic>> _hospitals = [];
  List<Map<String, dynamic>> _doctors = [];

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    _name.dispose();
    _phone.dispose();
    _otp.dispose();
    _specialization.dispose();
    _experience.dispose();
    super.dispose();
  }

  Future<void> _loadHospitals() async {
    try {
      final hospitals = await widget.repository.getApprovedHospitals();
      if (mounted) setState(() => _hospitals = hospitals);
    } catch (error) {
      if (mounted) setState(() => _error = AuthRepository.errorMessage(error));
    }
  }

  Future<void> _loadDoctors(String hospitalId) async {
    setState(() {
      _hospitalId = hospitalId;
      _doctorId = null;
      _doctors = [];
    });
    if (_role != AppUserRole.patient) return;
    try {
      final doctors = await widget.repository.getDoctors(hospitalId);
      if (mounted) {
        setState(
          () => _doctors = doctors.where((doctor) {
            final status = (doctor['status'] ?? '').toString().toUpperCase();
            return status == 'ACTIVE' || status == 'HOSPITAL_APPROVED';
          }).toList(),
        );
      }
    } catch (error) {
      if (mounted) setState(() => _error = AuthRepository.errorMessage(error));
    }
  }

  void _setRegister(bool value) {
    setState(() {
      _register = value;
      _error = null;
      _verifying = false;
    });
    if (value && _hospitals.isEmpty) _loadHospitals();
  }

  Future<void> _submit() async {
    if (_busy) return;
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      if (_verifying) {
        final result = await widget.repository.verifyEmail(
          email: _identifier.text,
          otp: _otp.text,
        );
        if (result.user != null) widget.onAuthenticated(result.user!);
        return;
      }

      if (!_register) {
        final result = await widget.repository.login(
          identifier: _identifier.text,
          password: _password.text,
        );
        final user = result.user;
        if (user == null) throw StateError('The server did not return a user.');
        if (user.role != _role) {
          await widget.repository.signOut();
          throw StateError(
            'This account is registered as ${user.role.name}, not ${_role.name}.',
          );
        }
        widget.onAuthenticated(user);
        return;
      }

      final roleName = _role == AppUserRole.patient ? 'PATIENT' : 'DOCTOR';
      final payload =
          <String, dynamic>{
            'email': _identifier.text.trim(),
            'phone': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
            'password': _password.text,
            'role': roleName,
            'fullName': _name.text.trim(),
            'name': _name.text.trim(),
            'hospitalId': _hospitalId,
            if (_role == AppUserRole.patient) 'doctorId': _doctorId,
            if (_role == AppUserRole.doctor) ...{
              'specialization': _specialization.text.trim(),
              'experience': _experience.text.trim(),
            },
          }..removeWhere(
            (key, value) => value == null || (value is String && value.isEmpty),
          );

      final result = await widget.repository.register(payload);
      if (result.requiresVerification) {
        setState(() {
          _verifying = true;
          _demoOtp = result.demoOtp;
        });
      } else if (result.user != null) {
        widget.onAuthenticated(result.user!);
      } else {
        throw StateError(
          'Registration response did not include verification details.',
        );
      }
    } catch (error) {
      setState(() => _error = AuthRepository.errorMessage(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String? _required(String? value, String label) =>
      value == null || value.trim().isEmpty ? '$label is required' : null;

  @override
  Widget build(BuildContext context) {
    final isDoctor = _role == AppUserRole.doctor;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.health_and_safety_rounded,
                              size: 34,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(width: 10),
                            Text(
                              'AstaWashe',
                              style: Theme.of(context).textTheme.headlineSmall
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _verifying
                              ? 'Verify your email'
                              : _register
                              ? 'Create your account'
                              : 'Sign in to continue',
                        ),
                        const SizedBox(height: 20),
                        if (!_verifying)
                          SegmentedButton<bool>(
                            segments: const [
                              ButtonSegment(
                                value: false,
                                label: Text('Sign in'),
                              ),
                              ButtonSegment(
                                value: true,
                                label: Text('Register'),
                              ),
                            ],
                            selected: {_register},
                            onSelectionChanged: (value) =>
                                _setRegister(value.first),
                          ),
                        const SizedBox(height: 18),
                        if (_verifying) ...[
                          TextFormField(
                            controller: _otp,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: '6-digit code',
                              prefixIcon: Icon(Icons.verified_user_outlined),
                            ),
                            validator: (value) =>
                                _required(value, 'Verification code'),
                          ),
                          if (_demoOtp != null) ...[
                            const SizedBox(height: 8),
                            Text(
                              'Development OTP: $_demoOtp',
                              style: Theme.of(context).textTheme.labelLarge,
                            ),
                          ],
                          TextButton(
                            onPressed: _busy
                                ? null
                                : () async {
                                    try {
                                      final otp = await widget.repository
                                          .resendOtp(_identifier.text);
                                      if (mounted) {
                                        setState(() => _demoOtp = otp);
                                      }
                                    } catch (error) {
                                      if (mounted) {
                                        setState(
                                          () => _error =
                                              AuthRepository.errorMessage(
                                                error,
                                              ),
                                        );
                                      }
                                    }
                                  },
                            child: const Text('Resend code'),
                          ),
                        ] else ...[
                          if (_register)
                            TextFormField(
                              controller: _name,
                              textCapitalization: TextCapitalization.words,
                              decoration: const InputDecoration(
                                labelText: 'Full name',
                                prefixIcon: Icon(Icons.person_outline),
                              ),
                              validator: (value) =>
                                  _required(value, 'Full name'),
                            ),
                          if (_register) const SizedBox(height: 14),
                          TextFormField(
                            controller: _identifier,
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              labelText: _register ? 'Email' : 'Email or phone',
                              prefixIcon: const Icon(Icons.alternate_email),
                            ),
                            validator: (value) {
                              final required = _required(
                                value,
                                _register ? 'Email' : 'Email or phone',
                              );
                              if (required != null) return required;
                              if (_register && !(value ?? '').contains('@')) {
                                return 'Enter a valid email address';
                              }
                              return null;
                            },
                          ),
                          if (_register) ...[
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _phone,
                              keyboardType: TextInputType.phone,
                              decoration: const InputDecoration(
                                labelText: 'Phone (optional)',
                                prefixIcon: Icon(Icons.phone_outlined),
                              ),
                            ),
                          ],
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _password,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Password',
                              prefixIcon: Icon(Icons.lock_outline),
                            ),
                            validator: (value) {
                              final required = _required(value, 'Password');
                              if (required != null) return required;
                              if (_register && (value ?? '').length < 6) {
                                return 'Use at least 6 characters';
                              }
                              return null;
                            },
                          ),
                          if (_register) ...[
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _confirmPassword,
                              obscureText: true,
                              decoration: const InputDecoration(
                                labelText: 'Confirm password',
                                prefixIcon: Icon(Icons.lock_reset_outlined),
                              ),
                              validator: (value) => value != _password.text
                                  ? 'Passwords do not match'
                                  : null,
                            ),
                          ],
                          const SizedBox(height: 14),
                          DropdownButtonFormField<AppUserRole>(
                            initialValue: _role,
                            decoration: const InputDecoration(
                              labelText: 'Account type',
                              prefixIcon: Icon(Icons.badge_outlined),
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: AppUserRole.patient,
                                child: Text('Patient'),
                              ),
                              DropdownMenuItem(
                                value: AppUserRole.doctor,
                                child: Text('Doctor'),
                              ),
                            ],
                            onChanged: (role) {
                              if (role == null) return;
                              setState(() {
                                _role = role;
                                _hospitalId = null;
                                _doctorId = null;
                                _doctors = [];
                              });
                              if (_register && _hospitals.isEmpty) {
                                _loadHospitals();
                              }
                            },
                          ),
                          if (_register) ...[
                            const SizedBox(height: 14),
                            if (_hospitals.isEmpty)
                              OutlinedButton.icon(
                                onPressed: _loadHospitals,
                                icon: const Icon(Icons.refresh),
                                label: const Text('Load approved hospitals'),
                              )
                            else
                              DropdownButtonFormField<String>(
                                initialValue: _hospitalId,
                                decoration: const InputDecoration(
                                  labelText: 'Approved hospital',
                                  prefixIcon: Icon(
                                    Icons.local_hospital_outlined,
                                  ),
                                ),
                                items: _hospitals
                                    .map(
                                      (hospital) => DropdownMenuItem<String>(
                                        value: hospital['id'].toString(),
                                        child: Text(
                                          (hospital['name'] ?? 'Hospital')
                                              .toString(),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (id) {
                                  if (id != null) _loadDoctors(id);
                                },
                                validator: (value) =>
                                    value == null ? 'Select a hospital' : null,
                              ),
                            if (!isDoctor && _hospitalId != null) ...[
                              const SizedBox(height: 14),
                              DropdownButtonFormField<String>(
                                initialValue: _doctorId,
                                decoration: const InputDecoration(
                                  labelText: 'Doctor',
                                  prefixIcon: Icon(
                                    Icons.medical_services_outlined,
                                  ),
                                ),
                                items: _doctors
                                    .map(
                                      (doctor) => DropdownMenuItem<String>(
                                        value: doctor['id'].toString(),
                                        child: Text(
                                          (doctor['name'] ?? 'Doctor')
                                              .toString(),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (id) =>
                                    setState(() => _doctorId = id),
                                validator: (value) =>
                                    value == null ? 'Select a doctor' : null,
                              ),
                            ],
                            if (isDoctor) ...[
                              const SizedBox(height: 14),
                              TextFormField(
                                controller: _specialization,
                                decoration: const InputDecoration(
                                  labelText: 'Specialization',
                                ),
                              ),
                              const SizedBox(height: 14),
                              TextFormField(
                                controller: _experience,
                                decoration: const InputDecoration(
                                  labelText: 'Experience',
                                ),
                              ),
                            ],
                          ],
                        ],
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _error!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ],
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: _busy ? null : _submit,
                          child: _busy
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  _verifying
                                      ? 'Verify email'
                                      : _register
                                      ? 'Create account'
                                      : 'Sign in',
                                ),
                        ),
                        if (_verifying)
                          TextButton(
                            onPressed: () => setState(() {
                              _verifying = false;
                              _demoOtp = null;
                            }),
                            child: const Text('Back to sign in'),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
