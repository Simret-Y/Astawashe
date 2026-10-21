import 'dart:convert';

import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../services/api_service.dart';

class PatientDashboardScreen extends StatefulWidget {
  final AuthSession session;

  const PatientDashboardScreen({super.key, required this.session});

  @override
  State<PatientDashboardScreen> createState() => _PatientDashboardScreenState();
}

class _PatientDashboardScreenState extends State<PatientDashboardScreen> {
  late final ApiService _apiService;

  Map<String, dynamic>? _profile;
  String? _errorMessage;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiService.get(
        'patients/me',
        accessToken: widget.session.accessToken,
      );

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          response.statusCode == 401
              ? 'Your session has expired. Please sign in again.'
              : 'Could not load your patient profile.',
        );
      }

      final decoded = jsonDecode(response.body);

      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Invalid patient profile response.');
      }

      if (!mounted) return;

      setState(() {
        _profile = decoded;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _errorMessage = error is FormatException
            ? 'The server returned an invalid profile.'
            : error.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _apiService.dispose();
    super.dispose();
  }

  Widget _profileField(String label, dynamic value) {
    final displayValue = value == null || value.toString().trim().isEmpty
        ? 'Not provided'
        : value.toString();

    return Card(
      child: ListTile(title: Text(label), subtitle: Text(displayValue)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 48),
                    const SizedBox(height: 12),
                    Text(_errorMessage!, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _loadProfile,
                      child: const Text('Try again'),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadProfile,
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  Text(
                    'Welcome, '
                    '${_profile?['fullName'] ?? widget.session.displayName}',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  const Text('Smart Healthcare Starts With Every Dose'),
                  const SizedBox(height: 24),
                  Text(
                    'My profile',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  _profileField('Full name', _profile?['fullName']),
                  _profileField('Phone', _profile?['phone']),
                  _profileField(
                    'Date of birth',
                    _profile?['dob'] == null
                        ? null
                        : _profile!['dob'].toString().split('T').first,
                  ),
                  _profileField('Gender', _profile?['gender']),
                  _profileField('Address', _profile?['address']),
                  _profileField('Medical history', _profile?['medicalHistory']),
                  _profileField(
                    'Case description',
                    _profile?['caseDescription'],
                  ),
                  _profileField('Reminder mode', _profile?['reminderMode']),
                ],
              ),
            ),
    );
  }
}
