import 'dart:convert';

import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../services/api_service.dart';

class DoctorDashboardScreen extends StatefulWidget {
  final AuthSession session;

  const DoctorDashboardScreen({super.key, required this.session});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  late final ApiService _apiService;

  Map<String, dynamic>? _dashboard;
  String? _errorMessage;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiService.get(
        'dashboard/doctor',
        accessToken: widget.session.accessToken,
      );

      if (response.statusCode < 200 || response.statusCode >= 300) {
        if (response.statusCode == 401) {
          throw Exception('Your session has expired. Please sign in again.');
        }

        if (response.statusCode == 403) {
          throw Exception(
            'You do not have permission to access this dashboard.',
          );
        }

        if (response.statusCode == 404) {
          throw Exception(
            'Doctor profile not found. Check that your account has a doctor profile.',
          );
        }

        throw Exception(
          'Could not load the doctor dashboard '
          '(HTTP ${response.statusCode}).',
        );
      }

      final decoded = jsonDecode(response.body);

      if (decoded is! Map<String, dynamic> ||
          decoded['success'] != true ||
          decoded['data'] is! Map<String, dynamic>) {
        throw const FormatException('Invalid doctor dashboard response.');
      }

      if (!mounted) return;

      setState(() {
        _dashboard = decoded['data'] as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _errorMessage = error is FormatException
            ? 'The server returned an invalid dashboard response.'
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

  String _display(dynamic value, {String fallback = 'Not provided'}) {
    if (value == null || value.toString().trim().isEmpty) {
      return fallback;
    }
    return value.toString();
  }

  Widget _statCard(String label, dynamic value, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 28),
            const SizedBox(height: 12),
            Text(
              _display(value, fallback: '0'),
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 4),
            Text(label),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 8),
      child: Text(title, style: Theme.of(context).textTheme.titleLarge),
    );
  }

  Widget _patientTile(
    Map<String, dynamic> patient, {
    bool showAdherence = false,
  }) {
    final name = _display(patient['fullName'], fallback: 'Unnamed patient');

    final nickname = patient['nickname'];
    final subtitleParts = <String>[];

    if (nickname != null && nickname.toString().trim().isNotEmpty) {
      subtitleParts.add('Nickname: $nickname');
    }

    if (showAdherence) {
      subtitleParts.add(
        'Adherence today: ${_display(patient['adherenceToday'], fallback: '0')}%',
      );
      subtitleParts.add(
        'Active medication schedules: ${_display(patient['medicationCount'], fallback: '0')}',
      );
      subtitleParts.add(
        'Reminder mode: ${_display(patient['reminderMode'], fallback: 'VOICE')}',
      );
    }

    return Card(
      child: ListTile(
        leading: CircleAvatar(
          child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?'),
        ),
        title: Text(name),
        subtitle: Text(
          subtitleParts.isEmpty
              ? 'Awaiting doctor approval'
              : subtitleParts.join('\n'),
        ),
        isThreeLine: subtitleParts.length > 1,
      ),
    );
  }

  Widget _buildDashboard() {
    final data = _dashboard!;
    final doctor = data['doctor'] as Map<String, dynamic>? ?? {};
    final stats = data['stats'] as Map<String, dynamic>? ?? {};

    final patients = (data['patients'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .toList();

    final pendingPatients =
        (data['pendingPatientsList'] as List<dynamic>? ?? [])
            .whereType<Map<String, dynamic>>()
            .toList();

    final riskPatients = (data['riskPatients'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .toList();

    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Welcome, ${_display(doctor['name'], fallback: widget.session.displayName)}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            _display(doctor['specialization'], fallback: 'Doctor dashboard'),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: Chip(label: Text('Status: ${_display(doctor['status'])}')),
          ),
          const SizedBox(height: 12),
          Text(
            'Pull down to refresh your dashboard.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          _sectionTitle('Patient overview'),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.5,
            children: [
              _statCard(
                'Total patients',
                stats['totalPatients'],
                Icons.people_outline,
              ),
              _statCard(
                'Pending approvals',
                stats['pendingPatients'],
                Icons.pending_actions,
              ),
              _statCard(
                'High-risk patients',
                stats['highRiskPatients'],
                Icons.warning_amber_outlined,
              ),
              _statCard(
                'Missed doses today',
                stats['missedDosesToday'],
                Icons.medication_outlined,
              ),
            ],
          ),
          _sectionTitle('Adherence overview'),
          Card(
            child: ListTile(
              leading: const Icon(Icons.insights),
              title: const Text('Average adherence today'),
              subtitle: Text(
                '${_display(data['averageAdherence'], fallback: '0.0')}%',
              ),
            ),
          ),
          _sectionTitle('Active patients (${patients.length})'),
          if (patients.isEmpty)
            const Card(
              child: ListTile(
                title: Text('No active patients yet'),
                subtitle: Text(
                  'Active patients assigned to you will appear here.',
                ),
              ),
            )
          else
            ...patients.map(
              (patient) => _patientTile(patient, showAdherence: true),
            ),
          _sectionTitle('Patients needing attention (${riskPatients.length})'),
          if (riskPatients.isEmpty)
            const Card(
              child: ListTile(
                leading: Icon(Icons.check_circle_outline),
                title: Text('No high-risk patients'),
                subtitle: Text(
                  'No active patients are currently below the adherence threshold.',
                ),
              ),
            )
          else
            ...riskPatients.map(
              (patient) => _patientTile(patient, showAdherence: true),
            ),
          _sectionTitle(
            'Pending patient approvals (${pendingPatients.length})',
          ),
          if (pendingPatients.isEmpty)
            const Card(child: ListTile(title: Text('No pending approvals')))
          else
            ...pendingPatients.map(_patientTile),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Doctor Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Refresh dashboard',
            onPressed: _isLoading ? null : _loadDashboard,
            icon: const Icon(Icons.refresh),
          ),
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
                      onPressed: _loadDashboard,
                      child: const Text('Try again'),
                    ),
                  ],
                ),
              ),
            )
          : _buildDashboard(),
    );
  }
}
