import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/primary_button.dart';
import '../providers/auth_state_provider.dart';
import '../../domain/models/auth_models.dart';
import '../../data/repositories/hospital_lookup_repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  final String? initialTab;
  final String? initialMode;

  const LoginScreen({super.key, this.initialTab, this.initialMode});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  late bool _isDoctorTab;
  late bool _isSignUpMode;

  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  final _fullNameController = TextEditingController();
  bool _obscurePassword = true;

  String? _selectedHospitalId;
  String? _selectedDoctorId;

  @override
  void initState() {
    super.initState();
    _isDoctorTab = widget.initialTab == 'doctor';
    _isSignUpMode = widget.initialMode == 'signup';

    if (_isSignUpMode) {
      _identifierController.text = '';
      _passwordController.text = '';
      _fullNameController.text = '';
    } else {
      _identifierController.text = _isDoctorTab
          ? 'ahmed@astawashe.et'
          : 'sophie@astawashe.et';
      _passwordController.text = '123456';
      _fullNameController.text = '';
    }
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _fullNameController.dispose();
    super.dispose();
  }

  void _switchTab(bool isDoctor) {
    setState(() {
      _isDoctorTab = isDoctor;
      _selectedHospitalId = null;
      _selectedDoctorId = null;
      if (_isSignUpMode) {
        _identifierController.text = '';
        _fullNameController.text = '';
      } else {
        _identifierController.text = _isDoctorTab
            ? 'ahmed@astawashe.et'
            : 'sophie@astawashe.et';
      }
    });
  }

  Future<void> _submit() async {
    final authNotifier = ref.read(authStateProvider.notifier);
    final role = _isDoctorTab ? UserRole.doctor : UserRole.patient;

    if (_isSignUpMode) {
      if (_fullNameController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please enter your full name.'),
            backgroundColor: AppColors.statusDanger,
          ),
        );
        return;
      }

      if (_selectedHospitalId == null || _selectedHospitalId!.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select an approved hospital to proceed.'),
            backgroundColor: AppColors.statusDanger,
          ),
        );
        return;
      }

      if (!_isDoctorTab && (_selectedDoctorId == null || _selectedDoctorId!.isEmpty)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select an approved doctor in your hospital.'),
            backgroundColor: AppColors.statusDanger,
          ),
        );
        return;
      }

      final email = _identifierController.text.trim().contains('@')
          ? _identifierController.text.trim()
          : null;
      final phone = !_identifierController.text.trim().contains('@')
          ? _identifierController.text.trim()
          : null;

      final response = await authNotifier.register(
        fullName: _fullNameController.text.trim(),
        email: email,
        phone: phone,
        password: _passwordController.text,
        role: role,
        hospitalId: _selectedHospitalId,
        doctorId: !_isDoctorTab ? _selectedDoctorId : null,
      );

      if (!mounted) return;

      if (response.requiresEmailVerification == true) {
        final emailParam = Uri.encodeComponent(email ?? '');
        final roleParam = Uri.encodeComponent(role.toApiString());
        final demoOtpParam = Uri.encodeComponent(response.demoOtp ?? '');
        context.push('/verify-otp?email=$emailParam&role=$roleParam&demoOtp=$demoOtpParam');
      } else if (response.success) {
        final status = response.user?.status?.toUpperCase() ?? 'PENDING';
        if (status.contains('PENDING')) {
          context.go('/pending-approval');
        } else {
          context.go(_isDoctorTab ? '/doctor/home' : '/patient/home');
        }
      }
    } else {
      final success = await authNotifier.login(
        email: _identifierController.text.trim().contains('@')
            ? _identifierController.text.trim()
            : null,
        phone: !_identifierController.text.trim().contains('@')
            ? _identifierController.text.trim()
            : null,
        password: _passwordController.text,
        preferredRole: role,
      );

      if (success && mounted) {
        final authState = ref.read(authStateProvider);
        final status = authState.user?.status?.toUpperCase() ?? 'ACTIVE';
        if (status.contains('PENDING')) {
          context.go('/pending-approval');
        } else {
          context.go(_isDoctorTab ? '/doctor/home' : '/patient/home');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isLoading = authState.status == AuthStatus.loading;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Logo
              Container(
                width: 60,
                height: 60,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(
                    Icons.show_chart_rounded,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'AstaWashe',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Medication Reminder &\nHealth Assistance',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textMuted,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 24),

              // Patient / Doctor Tab Switcher
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _switchTab(false),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: !_isDoctorTab
                                ? Colors.white
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: !_isDoctorTab
                                ? [
                                    const BoxShadow(
                                      color: Color(0x10000000),
                                      blurRadius: 4,
                                      offset: Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              'Patient',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: !_isDoctorTab
                                    ? AppColors.primary
                                    : AppColors.textMuted,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _switchTab(true),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _isDoctorTab
                                ? Colors.white
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: _isDoctorTab
                                ? [
                                    const BoxShadow(
                                      color: Color(0x10000000),
                                      blurRadius: 4,
                                      offset: Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              'Doctor',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: _isDoctorTab
                                    ? AppColors.doctorNavy
                                    : AppColors.textMuted,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Inputs
              if (_isSignUpMode) ...[
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    _isDoctorTab ? 'Full Name & Title' : 'Full Name',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _fullNameController,
                  decoration: InputDecoration(
                    hintText: _isDoctorTab
                        ? 'e.g. Dr. Abebe Bikila'
                        : 'e.g. Almaz Kebede',
                    prefixIcon: const Icon(
                      Icons.person_outline_rounded,
                      size: 20,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Approved Hospital Selection
                Align(
                  alignment: Alignment.centerLeft,
                  child: Row(
                    children: [
                      Text(
                        _isDoctorTab
                            ? 'Hospital / Clinic Affiliation *'
                            : 'Select Your Hospital *',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Approved',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF166534),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                ref.watch(approvedHospitalsProvider).when(
                  data: (hospitals) {
                    if (hospitals.isEmpty) {
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.info_outline, color: Colors.red, size: 18),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'No approved hospitals found in system.',
                                style: TextStyle(fontSize: 12, color: Colors.red),
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    return DropdownButtonFormField<String>(
                      initialValue: _selectedHospitalId,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.local_hospital_outlined, size: 20),
                        hintText: 'Choose an approved hospital',
                      ),
                      items: hospitals.map((h) {
                        final subtitle = h.city != null && h.city!.isNotEmpty
                            ? ' (${h.city})'
                            : '';
                        return DropdownMenuItem<String>(
                          value: h.id,
                          child: Text(
                            '${h.name}$subtitle',
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedHospitalId = val;
                          _selectedDoctorId = null;
                        });
                      },
                    );
                  },
                  loading: () => Container(
                    height: 50,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Text(
                          'Loading approved hospitals...',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  error: (err, stack) => DropdownButtonFormField<String>(
                    initialValue: _selectedHospitalId,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.local_hospital_outlined, size: 20),
                      hintText: 'Select hospital',
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'hosp-001',
                        child: Text('Addis Hiwot General Hospital'),
                      ),
                    ],
                    onChanged: (val) {
                      setState(() {
                        _selectedHospitalId = val;
                        _selectedDoctorId = null;
                      });
                    },
                  ),
                ),
                const SizedBox(height: 16),

                // If Patient Tab, Doctor selection is required
                if (!_isDoctorTab) ...[
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Row(
                      children: [
                        const Text(
                          'Assigned Doctor *',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (_selectedHospitalId == null) ...[
                          const SizedBox(width: 6),
                          const Text(
                            '(Select hospital first)',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.textMuted,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (_selectedHospitalId == null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.person_search_outlined,
                            size: 20,
                            color: AppColors.textMuted,
                          ),
                          SizedBox(width: 12),
                          Text(
                            'Please select a hospital above first',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ref
                        .watch(hospitalDoctorsProvider(_selectedHospitalId!))
                        .when(
                          data: (doctors) {
                            if (doctors.isEmpty) {
                              return Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: const Color(0xFFFDE68A),
                                  ),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(
                                      Icons.warning_amber_rounded,
                                      color: Colors.orange,
                                      size: 18,
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'No approved doctors listed for this hospital yet.',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.brown,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }
                            return DropdownButtonFormField<String>(
                              initialValue: _selectedDoctorId,
                              isExpanded: true,
                              decoration: const InputDecoration(
                                prefixIcon: Icon(
                                  Icons.medical_services_outlined,
                                  size: 20,
                                ),
                                hintText: 'Choose your doctor',
                              ),
                              items: doctors.map((d) {
                                final spec = d.specialization != null &&
                                        d.specialization!.isNotEmpty
                                    ? ' - ${d.specialization}'
                                    : '';
                                return DropdownMenuItem<String>(
                                  value: d.id,
                                  child: Text(
                                    '${d.name}$spec',
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                );
                              }).toList(),
                              onChanged: (val) {
                                setState(() => _selectedDoctorId = val);
                              },
                            );
                          },
                          loading: () => Container(
                            height: 50,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: const Color(0xFFE2E8F0),
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Row(
                              children: [
                                SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                                SizedBox(width: 12),
                                Text(
                                  'Loading doctors in hospital...',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          error: (err, stack) => DropdownButtonFormField<String>(
                            initialValue: _selectedDoctorId,
                            isExpanded: true,
                            decoration: const InputDecoration(
                              prefixIcon: Icon(
                                Icons.medical_services_outlined,
                                size: 20,
                              ),
                              hintText: 'Select doctor',
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: 'doc-001',
                                child: Text(
                                  'Dr. Aklilu Yilma (Internal Medicine)',
                                ),
                              ),
                            ],
                            onChanged: (val) {
                              setState(() => _selectedDoctorId = val);
                            },
                          ),
                        ),
                  const SizedBox(height: 16),
                ],
              ],

              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Email or Phone Number',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _identifierController,
                decoration: const InputDecoration(
                  hintText: 'you@example.com or +251...',
                  prefixIcon: Icon(Icons.mail_outline_rounded, size: 20),
                ),
              ),
              const SizedBox(height: 16),

              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Password',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  hintText: '••••••••',
                  prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 20,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                ),
              ),

              if (authState.errorMessage != null) ...[
                const SizedBox(height: 12),
                Text(
                  authState.errorMessage!,
                  style: const TextStyle(
                    color: AppColors.statusDanger,
                    fontSize: 13,
                  ),
                ),
              ],

              const SizedBox(height: 20),

              // Submit Button
              PrimaryButton(
                label: _isSignUpMode
                    ? (_isDoctorTab ? 'Register as Doctor' : 'Create Account')
                    : 'Sign In',
                backgroundColor: _isDoctorTab
                    ? AppColors.doctorNavy
                    : AppColors.primary,
                isLoading: isLoading,
                onPressed: _submit,
              ),

              if (!_isSignUpMode) ...[
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Demo mode: Enter any email/password to sign in.',
                        ),
                      ),
                    );
                  },
                  child: const Text(
                    'Forgot password?',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textMuted,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 16),

              // Divider
              const Row(
                children: [
                  Expanded(child: Divider()),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 14),
                    child: Text(
                      'or',
                      style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 16),

              // Toggle Sign In vs Create Account
              PrimaryButton(
                label: _isSignUpMode ? 'Sign In instead' : 'Create an account',
                isOutlined: true,
                backgroundColor: _isDoctorTab
                    ? AppColors.doctorNavy
                    : AppColors.primary,
                onPressed: () {
                  setState(() {
                    _isSignUpMode = !_isSignUpMode;
                  });
                },
              ),

              const SizedBox(height: 28),
              const Text(
                'Better health, together 💙',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
