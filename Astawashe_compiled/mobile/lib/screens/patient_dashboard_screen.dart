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
  List<dynamic> _medications = [];
  List<dynamic> _schedules = [];
  Map<String, dynamic>? _todayAdherence;

  String? _errorMessage;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _loadDashboard();
  }

  Future<dynamic> _getJson(String path) async {
    final response = await _apiService.get(
      path,
      accessToken: widget.session.accessToken,
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      if (response.statusCode == 401) {
        throw Exception('Your session has expired. Please sign in again.');
      }
      if (response.statusCode == 403) {
        throw Exception(
          'You do not have permission to access this information.',
        );
      }
      throw Exception('Could not load $path (HTTP ${response.statusCode}).');
    }

    return jsonDecode(response.body);
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Load the profile first. Medication and adherence sections can fail
      // independently without hiding the patient's profile.
      final profileResult = await _getJson('patients/me');

      if (profileResult is! Map<String, dynamic>) {
        throw const FormatException('Invalid patient profile response.');
      }

      final results = await Future.wait(
        [
          _getJson('medications/my/medications'),
          _getJson('medications/my/schedules'),
          _getJson('adherence/my/today'),
          _getJson('adherence/my/weekly'),
        ].map((future) async {
          try {
            return {'value': await future, 'error': null};
          } catch (error) {
            return {'value': null, 'error': error.toString()};
          }
        }),
      );

      if (!mounted) return;

      final medicationResult = results[0];
      final scheduleResult = results[1];
      final todayResult = results[2];
      final weeklyResult = results[3];

      setState(() {
        _profile = profileResult;
        _medications = _extractList(medicationResult['value']);
        _schedules = _extractList(scheduleResult['value']);
        _todayAdherence = _extractData(todayResult['value']);

        final failures = <String>[];
        if (medicationResult['error'] != null) {
          failures.add('medications');
        }
        if (scheduleResult['error'] != null) {
          failures.add('schedules');
        }
        if (todayResult['error'] != null) {
          failures.add('today’s adherence');
        }
        if (weeklyResult['error'] != null) {
          failures.add('weekly adherence');
        }

        _errorMessage = failures.isEmpty
            ? null
            : 'Some dashboard information could not be loaded: '
                  '${failures.join(', ')}. Pull down to refresh.';
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _errorMessage = error is FormatException
            ? 'The server returned an invalid patient profile.'
            : error.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  List<dynamic> _extractList(dynamic result) {
    if (result is! Map<String, dynamic>) return [];

    final data = result['data'];
    if (data is List) return data;
    if (result['success'] == true && data == null) return [];

    return [];
  }

  Map<String, dynamic>? _extractData(dynamic result) {
    if (result is! Map<String, dynamic>) return null;

    final data = result['data'];
    return data is Map<String, dynamic> ? data : null;
  }

  String _display(dynamic value, {String fallback = 'Not provided'}) {
    if (value == null || value.toString().trim().isEmpty) return fallback;
    return value.toString();
  }

  String _date(dynamic value) {
    if (value == null) return 'Not provided';
    final text = value.toString();
    return text.contains('T') ? text.split('T').first : text;
  }

  Widget _profileField(String label, dynamic value) {
    return Card(
      child: ListTile(title: Text(label), subtitle: Text(_display(value))),
    );
  }

  Widget _sectionTitle(String title, {String? subtitle}) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ],
      ),
    );
  }

  Widget _summaryCard(String label, String value, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 28),
            const SizedBox(height: 12),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(label),
          ],
        ),
      ),
    );
  }

  Widget _medicationCard(Map<String, dynamic> medication) {
    final schedules = medication['schedules'] is List
        ? medication['schedules'] as List
        : <dynamic>[];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.medication_outlined, size: 30),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _display(medication['name'], fallback: 'Medication'),
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        [
                                  medication['dosage'],
                                  medication['strength'],
                                  medication['form'],
                                ]
                                .where(
                                  (value) =>
                                      value != null &&
                                      value.toString().trim().isNotEmpty,
                                )
                                .join(' · ')
                                .isEmpty
                            ? 'Dosage not provided'
                            : [
                                    medication['dosage'],
                                    medication['strength'],
                                    medication['form'],
                                  ]
                                  .where(
                                    (value) =>
                                        value != null &&
                                        value.toString().trim().isNotEmpty,
                                  )
                                  .join(' · '),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if ((medication['instructions'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('Instructions: ${medication['instructions']}'),
            ],
            if ((medication['notes'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 4),
              Text('Notes: ${medication['notes']}'),
            ],
            const Divider(height: 24),
            Text(
              'Active schedules (${schedules.length})',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            if (schedules.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text('No active schedule for this medication.'),
              )
            else
              ...schedules.map((schedule) {
                if (schedule is! Map<String, dynamic>) {
                  return const SizedBox.shrink();
                }
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.schedule),
                  title: Text(
                    _display(schedule['time'], fallback: 'Time not set'),
                  ),
                  subtitle: Text(
                    '${_display(schedule['frequency'], fallback: 'Frequency not set')}'
                    ' · ${_display(schedule['dosage'], fallback: 'Dosage not set')}',
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboard() {
    final adherenceLog = _todayAdherence?['adherenceLog'];
    final riskStatus = _todayAdherence?['riskStatus'];

    final todayRate = adherenceLog is Map<String, dynamic>
        ? adherenceLog['adherenceRate']
        : null;

    final riskLevel = riskStatus is Map<String, dynamic>
        ? riskStatus['riskLevel']
        : null;

    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Welcome, ${_display(_profile?['fullName'], fallback: widget.session.displayName)}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          const Text('Smart Healthcare Starts With Every Dose'),

          _sectionTitle(
            'Today at a glance',
            subtitle: 'Your medication and adherence overview',
          ),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.5,
            children: [
              _summaryCard(
                'Active medications',
                '${_medications.length}',
                Icons.medication,
              ),
              _summaryCard(
                'Active schedules',
                '${_schedules.length}',
                Icons.alarm,
              ),
              _summaryCard(
                'Today’s adherence',
                todayRate == null ? '—' : '$todayRate%',
                Icons.fact_check_outlined,
              ),
              _summaryCard(
                'Risk level',
                _display(riskLevel, fallback: 'Unavailable'),
                Icons.health_and_safety_outlined,
              ),
            ],
          ),

          _sectionTitle('My medications'),
          if (_medications.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'No active medications found. Your doctor can add '
                  'medications and schedules to your account.',
                ),
              ),
            )
          else
            ..._medications.whereType<Map<String, dynamic>>().map(
              _medicationCard,
            ),

          _sectionTitle('My schedules'),
          if (_schedules.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No active medication schedules found.'),
              ),
            )
          else
            ..._schedules.whereType<Map<String, dynamic>>().map((schedule) {
              final medication = schedule['medication'];
              final medicationName = medication is Map<String, dynamic>
                  ? medication['name']
                  : null;

              return Card(
                child: ListTile(
                  leading: const Icon(Icons.alarm),
                  title: Text(_display(medicationName, fallback: 'Medication')),
                  subtitle: Text(
                    '${_display(schedule['time'], fallback: 'Time not set')}'
                    ' · ${_display(schedule['frequency'], fallback: 'Frequency not set')}'
                    '\n${_display(schedule['dosage'], fallback: 'Dosage not set')}',
                  ),
                  isThreeLine: true,
                ),
              );
            }),

          _sectionTitle('My profile'),
          _profileField('Full name', _profile?['fullName']),
          _profileField('Phone', _profile?['phone']),
          _profileField('Date of birth', _date(_profile?['dob'])),
          _profileField('Gender', _profile?['gender']),
          _profileField('Address', _profile?['address']),
          _profileField('Medical history', _profile?['medicalHistory']),
          _profileField('Case description', _profile?['caseDescription']),
          _profileField('Reminder mode', _profile?['reminderMode']),
          if (_errorMessage != null) ...[
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
            OutlinedButton.icon(
              onPressed: _loadDashboard,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry loading dashboard data'),
            ),
          ],
        ],
      ),
    );
  }

  @override
  void dispose() {
    _apiService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loadDashboard,
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
          : _errorMessage != null && _profile == null
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
