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
  final _api = ApiService();

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
      if (!mounted) return;
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
      setState(() => _error = 'Please select a hospital and doctor.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final result = await _api.registerPatient(
        fullName: _nameController.text,
        email: _emailController.text,
        password: _passwordController.text,
        phone: _phoneController.text,
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
      if (mounted) setState(() => _submitting = false);
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
            ? const Center(child: CircularProgressIndicator())
            : Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    Text(
                      'Join AstaWashe',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Create your patient account to manage your medication and health routines.',
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 24),
                    TextFormField(
                      controller: _nameController,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        labelText: 'Full name',
                        prefixIcon: Icon(Icons.person_outline),
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          value == null || value.trim().length < 2
                          ? 'Enter your full name'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email address',
                        prefixIcon: Icon(Icons.email_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        final email = value?.trim() ?? '';
                        return RegExp(
                              r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                            ).hasMatch(email)
                            ? null
                            : 'Enter a valid email address';
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Phone number (optional)',
                        prefixIcon: Icon(Icons.phone_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        final phone = value?.trim() ?? '';
                        if (phone.isNotEmpty &&
                            (phone.length < 8 ||
                                !RegExp(r'^[0-9+\-()\s]+$').hasMatch(phone))) {
                          return 'Enter a valid phone number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        helperText: 'At least 6 characters',
                        prefixIcon: const Icon(Icons.lock_outline),
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                      validator: (value) => value == null || value.length < 6
                          ? 'Password must be at least 6 characters'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: _hospitalId,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Hospital',
                        prefixIcon: Icon(Icons.local_hospital_outlined),
                        border: OutlineInputBorder(),
                      ),
                      items: _hospitals
                          .map(
                            (hospital) => DropdownMenuItem<String>(
                              value: hospital['id'] as String,
                              child: Text(
                                hospital['name'] as String? ?? 'Hospital',
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: _submitting ? null : _selectHospital,
                      validator: (value) =>
                          value == null ? 'Select a hospital' : null,
                    ),
                    const SizedBox(height: 16),
                    if (_loadingDoctors)
                      const LinearProgressIndicator()
                    else
                      DropdownButtonFormField<String>(
                        key: ValueKey(_hospitalId),
                        initialValue: _doctorId,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Doctor',
                          prefixIcon: Icon(Icons.medical_services_outlined),
                          border: OutlineInputBorder(),
                        ),
                        hint: const Text('Select your doctor'),
                        items: _doctors
                            .map(
                              (doctor) => DropdownMenuItem<String>(
                                value: doctor['id'] as String,
                                child: Text(
                                  doctor['name'] as String? ?? 'Doctor',
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: _submitting || _hospitalId == null
                            ? null
                            : (value) => setState(() {
                                _doctorId = value;
                                _error = null;
                              }),
                        validator: (value) =>
                            value == null ? 'Select a doctor' : null,
                      ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: _gender,
                      decoration: const InputDecoration(
                        labelText: 'Gender (optional)',
                        prefixIcon: Icon(Icons.person_outline),
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'MALE', child: Text('Male')),
                        DropdownMenuItem(
                          value: 'FEMALE',
                          child: Text('Female'),
                        ),
                        DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                      ],
                      onChanged: _submitting
                          ? null
                          : (value) => setState(() => _gender = value),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: TextStyle(color: theme.colorScheme.error),
                      ),
                    ],
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _submitting ? null : _register,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: _submitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Create account'),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
