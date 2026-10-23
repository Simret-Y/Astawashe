import 'dart:convert';

import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../services/api_service.dart';
import 'notifications_screen.dart';
import 'messages_screen.dart';

class DoctorDashboardScreen extends StatefulWidget {
  final AuthSession session;

  const DoctorDashboardScreen({super.key, required this.session});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  late final ApiService _apiService;

  List<Map<String, dynamic>> _adherenceSummary = [];

  Map<String, dynamic>? _dashboard;
  String? _errorMessage;
  bool _isLoading = true;

  final TextEditingController _patientSearchController =
      TextEditingController();
  String _patientSearchQuery = '';

  final Set<String> _reviewingPatientIds = {};

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

      final dashboardData = decoded['data'] as Map<String, dynamic>;

      // Load additional adherence risk information separately.
      // A failure here must not prevent the main dashboard from loading.
      List<Map<String, dynamic>> adherenceSummary = [];

      try {
        adherenceSummary = await _apiService.getDoctorAdherenceSummary(
          accessToken: widget.session.accessToken,
        );
      } catch (error) {
        debugPrint('Could not load adherence summary: $error');
      }

      if (!mounted) return;

      setState(() {
        _dashboard = dashboardData;
        _adherenceSummary = adherenceSummary;
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
    _patientSearchController.dispose();
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
    final patientId = patient['id']?.toString();

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
        'Risk level: ${_display(patient['riskLevel'], fallback: 'UNKNOWN')}',
      );
      subtitleParts.add(
        'Consecutive missed doses: ${_display(patient['consecutiveMisses'], fallback: '0')}',
      );
      subtitleParts.add(
        'Active medication schedules: ${_display(patient['medicationCount'], fallback: '0')}',
      );
      subtitleParts.add(
        'Reminder mode: ${_display(patient['reminderMode'], fallback: 'VOICE')}',
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?'),
              ),
              title: Text(name),
              subtitle: Text(
                subtitleParts.isEmpty
                    ? 'Active patient'
                    : subtitleParts.join('\n'),
              ),
              isThreeLine: subtitleParts.length > 1,
            ),

            // Medication actions appear only in Active patients.
            if (!showAdherence)
              Align(
                alignment: Alignment.centerRight,
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.end,
                  children: [
                    OutlinedButton.icon(
                      onPressed: patientId == null || patientId.isEmpty
                          ? null
                          : () => _showPrescribeDialog(patient),
                      icon: const Icon(Icons.medication_outlined),
                      label: const Text('Prescribe medication'),
                    ),
                    OutlinedButton.icon(
                      onPressed: patientId == null || patientId.isEmpty
                          ? null
                          : () => _showPatientPrescriptions(patient),
                      icon: const Icon(Icons.medication_outlined),
                      label: const Text('View prescriptions'),
                    ),
                    OutlinedButton.icon(
                      onPressed: patientId == null || patientId.isEmpty
                          ? null
                          : () => _showPatientSchedules(patient),
                      icon: const Icon(Icons.edit_calendar_outlined),
                      label: const Text('Edit schedules'),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _showPatientSchedules(Map<String, dynamic> patient) async {
    final patientId = patient['id']?.toString();

    if (patientId == null || patientId.isEmpty) return;

    try {
      final response = await _apiService.getPatientSchedulesForDoctor(
        patientId: patientId,
        accessToken: widget.session.accessToken,
      );

      if (!mounted) return;

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final decoded = jsonDecode(response.body);
        final message = decoded is Map<String, dynamic>
            ? (decoded['message'] ??
                  decoded['error'] ??
                  'Could not load schedules.')
            : 'Could not load schedules.';

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message.toString())));
        return;
      }

      final decoded = jsonDecode(response.body);

      if (decoded is! Map<String, dynamic> || decoded['data'] is! List) {
        throw const FormatException('Invalid schedules response.');
      }

      final schedules = (decoded['data'] as List)
          .whereType<Map<String, dynamic>>()
          .toList();

      if (!mounted) return;

      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(
            '${patient['nickname'] ?? patient['fullName'] ?? 'Patient'}'
            ' — Medication Schedules',
          ),
          content: SizedBox(
            width: 500,
            child: schedules.isEmpty
                ? const Text('No medication schedules found.')
                : SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: schedules.map((schedule) {
                        final medication =
                            schedule['medication'] as Map<String, dynamic>?;

                        final medicationName =
                            medication?['name']?.toString() ?? 'Medication';

                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(medicationName),
                          subtitle: Text(
                            'Dosage: ${schedule['dosage'] ?? 'Not specified'}\n'
                            'Time: ${schedule['time'] ?? 'Not specified'}\n'
                            'Frequency: ${schedule['frequency'] ?? 'Not specified'}',
                          ),
                          isThreeLine: true,
                          trailing: IconButton(
                            tooltip: 'Edit schedule',
                            icon: const Icon(Icons.edit_outlined),
                            onPressed: () async {
                              Navigator.of(dialogContext).pop();
                              await _showEditScheduleDialog(patient, schedule);
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not load schedules: $error')),
      );
    }
  }

  Future<void> _showPatientPrescriptions(Map<String, dynamic> patient) async {
    final patientId = patient['id']?.toString();

    if (patientId == null || patientId.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Patient ID is missing.')));
      return;
    }

    try {
      final prescriptions = await _apiService.getPatientPrescriptionsForDoctor(
        patientId: patientId,
        accessToken: widget.session.accessToken,
      );

      if (!mounted) return;

      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(
            'Prescriptions — ${_display(patient['fullName'], fallback: 'Patient')}',
          ),
          content: SizedBox(
            width: 500,
            child: prescriptions.isEmpty
                ? const Text('No prescriptions found for this patient.')
                : ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 450),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: prescriptions.length,
                      separatorBuilder: (_, _) => const Divider(),
                      itemBuilder: (context, index) {
                        final prescription = prescriptions[index];
                        final medication =
                            prescription['medication'] is Map<String, dynamic>
                            ? prescription['medication'] as Map<String, dynamic>
                            : <String, dynamic>{};

                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            medication['name']?.toString() ?? 'Medication',
                          ),
                          subtitle: Text(
                            'Dose: ${prescription['dose'] ?? '—'}\n'
                            'Frequency: ${prescription['frequency'] ?? '—'}\n'
                            'Start: ${prescription['startDate']?.toString().split('T').first ?? '—'}\n'
                            'End: ${prescription['endDate']?.toString().split('T').first ?? 'Not set'}\n'
                            'Instructions: ${prescription['instructions'] ?? 'None'}',
                          ),
                          trailing: IconButton(
                            tooltip: 'Edit prescription',
                            icon: const Icon(Icons.edit_outlined),
                            onPressed: () async {
                              Navigator.pop(dialogContext);
                              await _showEditPrescriptionDialog(
                                prescription,
                                patient,
                              );
                            },
                          ),
                        );
                      },
                    ),
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not load prescriptions: $error')),
      );
    }
  }

  Future<void> _showEditPrescriptionDialog(
    Map<String, dynamic> prescription,
    Map<String, dynamic> patient,
  ) async {
    final prescriptionId = prescription['id']?.toString();

    if (prescriptionId == null || prescriptionId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Prescription ID is missing.')),
      );
      return;
    }

    final formKey = GlobalKey<FormState>();

    final doseController = TextEditingController(
      text: prescription['dose']?.toString() ?? '',
    );
    final startDateController = TextEditingController(
      text: prescription['startDate']?.toString().split('T').first ?? '',
    );
    final endDateController = TextEditingController(
      text: prescription['endDate']?.toString().split('T').first ?? '',
    );
    final instructionsController = TextEditingController(
      text: prescription['instructions']?.toString() ?? '',
    );

    const allowedFrequencies = ['DAILY', 'TWICE_DAILY', 'WEEKLY'];
    final currentFrequency = prescription['frequency']?.toString() ?? 'DAILY';

    String frequency = allowedFrequencies.contains(currentFrequency)
        ? currentFrequency
        : 'DAILY';

    bool saving = false;

    try {
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            title: const Text('Edit prescription'),
            content: SizedBox(
              width: 450,
              child: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        initialValue:
                            (prescription['medication']
                                    as Map<String, dynamic>?)?['name']
                                ?.toString() ??
                            'Medication',
                        readOnly: true,
                        decoration: const InputDecoration(
                          labelText: 'Medication',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: doseController,
                        decoration: const InputDecoration(
                          labelText: 'Prescription dose',
                          hintText: 'e.g. 500 mg',
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Enter the prescription dose.'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: frequency,
                        decoration: const InputDecoration(
                          labelText: 'Frequency',
                        ),
                        items: allowedFrequencies
                            .map(
                              (value) => DropdownMenuItem(
                                value: value,
                                child: Text(value.replaceAll('_', ' ')),
                              ),
                            )
                            .toList(),
                        onChanged: saving
                            ? null
                            : (value) {
                                if (value != null) {
                                  setDialogState(() => frequency = value);
                                }
                              },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: startDateController,
                        decoration: const InputDecoration(
                          labelText: 'Start date',
                          hintText: 'YYYY-MM-DD',
                        ),
                        validator: (value) {
                          final date = value?.trim() ?? '';

                          if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(date) ||
                              DateTime.tryParse(date) == null) {
                            return 'Enter a valid date (YYYY-MM-DD).';
                          }

                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: endDateController,
                        decoration: const InputDecoration(
                          labelText: 'End date (optional)',
                          hintText: 'YYYY-MM-DD',
                        ),
                        validator: (value) {
                          final date = value?.trim() ?? '';

                          if (date.isEmpty) return null;

                          if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(date) ||
                              DateTime.tryParse(date) == null) {
                            return 'Enter a valid date (YYYY-MM-DD).';
                          }

                          final start = DateTime.tryParse(
                            startDateController.text.trim(),
                          );
                          final end = DateTime.tryParse(date);

                          if (start != null &&
                              end != null &&
                              end.isBefore(start)) {
                            return 'End date cannot be before start date.';
                          }

                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: instructionsController,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Instructions',
                          hintText: 'e.g. Take after a meal',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: saving ? null : () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: saving
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;

                        setDialogState(() => saving = true);

                        try {
                          await _apiService.updatePrescription(
                            prescriptionId: prescriptionId,
                            accessToken: widget.session.accessToken,
                            body: {
                              'dose': doseController.text.trim(),
                              'frequency': frequency,
                              'startDate': startDateController.text.trim(),
                              'endDate': endDateController.text.trim().isEmpty
                                  ? null
                                  : endDateController.text.trim(),
                              'instructions': instructionsController.text
                                  .trim(),
                            },
                          );

                          if (!mounted || !dialogContext.mounted) return;

                          Navigator.pop(dialogContext);

                          ScaffoldMessenger.of(this.context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Prescription updated successfully.',
                              ),
                            ),
                          );

                          await _showPatientPrescriptions(patient);
                        } catch (error) {
                          if (!dialogContext.mounted) return;

                          setDialogState(() => saving = false);

                          ScaffoldMessenger.of(dialogContext).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Could not update prescription: $error',
                              ),
                            ),
                          );
                        }
                      },
                child: saving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save changes'),
              ),
            ],
          ),
        ),
      );
    } finally {
      doseController.dispose();
      startDateController.dispose();
      endDateController.dispose();
      instructionsController.dispose();
    }
  }

  Future<void> _showEditScheduleDialog(
    Map<String, dynamic> patient,
    Map<String, dynamic> schedule,
  ) async {
    final formKey = GlobalKey<FormState>();

    final dosageController = TextEditingController(
      text: schedule['dosage']?.toString() ?? '',
    );
    final timeController = TextEditingController(
      text: schedule['time']?.toString() ?? '',
    );
    final startDateController = TextEditingController(
      text: schedule['startDate']?.toString().split('T').first ?? '',
    );
    final endDateController = TextEditingController(
      text: schedule['endDate'] == null
          ? ''
          : schedule['endDate'].toString().split('T').first,
    );

    final allowedFrequencies = ['DAILY', 'TWICE_DAILY', 'WEEKLY'];

    final initialFrequency = schedule['frequency']?.toString() ?? 'DAILY';

    String frequency = allowedFrequencies.contains(initialFrequency)
        ? initialFrequency
        : 'DAILY';

    bool saving = false;

    try {
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            title: const Text('Edit medication schedule'),
            content: SizedBox(
              width: 450,
              child: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        initialValue:
                            (schedule['medication']
                                    as Map<String, dynamic>?)?['name']
                                ?.toString() ??
                            'Medication',
                        readOnly: true,
                        decoration: const InputDecoration(
                          labelText: 'Medication',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: dosageController,
                        decoration: const InputDecoration(
                          labelText: 'Schedule dosage',
                          hintText: 'e.g. 1 tablet',
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Enter the dosage.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: timeController,
                        decoration: const InputDecoration(
                          labelText: 'Time',
                          hintText: 'HH:mm',
                          helperText:
                              'Use the time format expected by the backend.',
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Enter a time.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: frequency,
                        decoration: const InputDecoration(
                          labelText: 'Frequency',
                        ),
                        items: allowedFrequencies
                            .map(
                              (value) => DropdownMenuItem(
                                value: value,
                                child: Text(value.replaceAll('_', ' ')),
                              ),
                            )
                            .toList(),
                        onChanged: saving
                            ? null
                            : (value) {
                                if (value != null) {
                                  setDialogState(() => frequency = value);
                                }
                              },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: startDateController,
                        decoration: const InputDecoration(
                          labelText: 'Start date',
                          hintText: 'YYYY-MM-DD',
                        ),
                        validator: (value) {
                          final date = value?.trim() ?? '';
                          if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(date)) {
                            return 'Use YYYY-MM-DD.';
                          }
                          if (DateTime.tryParse(date) == null) {
                            return 'Enter a valid date.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: endDateController,
                        decoration: const InputDecoration(
                          labelText: 'End date (optional)',
                          hintText: 'YYYY-MM-DD',
                        ),
                        validator: (value) {
                          final date = value?.trim() ?? '';
                          if (date.isEmpty) return null;

                          if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(date) ||
                              DateTime.tryParse(date) == null) {
                            return 'Enter a valid date in YYYY-MM-DD format.';
                          }

                          final start = DateTime.tryParse(
                            startDateController.text.trim(),
                          );
                          final end = DateTime.tryParse(date);

                          if (start != null &&
                              end != null &&
                              end.isBefore(start)) {
                            return 'End date cannot be before start date.';
                          }

                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: saving
                    ? null
                    : () => Navigator.of(dialogContext).pop(),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: saving
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;

                        setDialogState(() => saving = true);

                        try {
                          await _apiService.updateMedicationSchedule(
                            scheduleId: schedule['id'].toString(),
                            accessToken: widget.session.accessToken,
                            body: {
                              'dosage': dosageController.text.trim(),
                              'time': timeController.text.trim(),
                              'frequency': frequency,
                              'startDate': startDateController.text.trim(),
                              'endDate': endDateController.text.trim().isEmpty
                                  ? null
                                  : endDateController.text.trim(),
                            },
                          );

                          if (!mounted || !dialogContext.mounted) return;

                          Navigator.of(dialogContext).pop();

                          ScaffoldMessenger.of(this.context).showSnackBar(
                            const SnackBar(
                              content: Text('Schedule updated successfully.'),
                            ),
                          );

                          await _loadDashboard();
                          await _showPatientSchedules(patient);
                        } catch (error) {
                          if (!dialogContext.mounted) return;

                          setDialogState(() => saving = false);

                          ScaffoldMessenger.of(dialogContext).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Could not update schedule: $error',
                              ),
                            ),
                          );
                        }
                      },
                child: saving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save changes'),
              ),
            ],
          ),
        ),
      );
    } finally {
      dosageController.dispose();
      timeController.dispose();
      startDateController.dispose();
      endDateController.dispose();
    }
  }

  Future<void> _showPrescribeDialog(Map<String, dynamic> patient) async {
    final patientId = patient['id']?.toString();
    final patientName = _display(
      patient['fullName'],
      fallback: 'Unnamed patient',
    );

    if (patientId == null || patientId.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Patient ID is missing.')));
      return;
    }

    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController();
    final dosageController = TextEditingController();
    final doseController = TextEditingController();
    final instructionsController = TextEditingController();
    final timeController = TextEditingController(text: '08:00');
    final startDateController = TextEditingController(
      text: DateTime.now().toIso8601String().substring(0, 10),
    );
    final endDateController = TextEditingController();

    String frequency = 'DAILY';
    bool isSaving = false;

    try {
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            title: Text('Prescribe for $patientName'),
            content: SizedBox(
              width: 420,
              child: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        controller: nameController,
                        decoration: const InputDecoration(
                          labelText: 'Medication name *',
                          hintText: 'Enter the prescribed medication',
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Medication name is required'
                            : null,
                      ),
                      TextFormField(
                        controller: dosageController,
                        decoration: const InputDecoration(
                          labelText: 'Schedule dosage *',
                          hintText: 'e.g. 1 tablet',
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Dosage is required'
                            : null,
                      ),
                      TextFormField(
                        controller: doseController,
                        decoration: const InputDecoration(
                          labelText: 'Prescription dose *',
                          hintText: 'e.g. 500 mg',
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Dose is required'
                            : null,
                      ),
                      TextFormField(
                        controller: instructionsController,
                        decoration: const InputDecoration(
                          labelText: 'Instructions',
                          hintText: 'e.g. Take after a meal',
                        ),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: frequency,
                        decoration: const InputDecoration(
                          labelText: 'Frequency',
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'DAILY',
                            child: Text('Daily'),
                          ),
                          DropdownMenuItem(
                            value: 'TWICE_DAILY',
                            child: Text('Twice daily'),
                          ),
                          DropdownMenuItem(
                            value: 'WEEKLY',
                            child: Text('Weekly'),
                          ),
                        ],
                        onChanged: isSaving
                            ? null
                            : (value) {
                                if (value != null) {
                                  setDialogState(() => frequency = value);
                                }
                              },
                      ),
                      TextFormField(
                        controller: timeController,
                        decoration: const InputDecoration(
                          labelText: 'Reminder time * (24-hour HH:MM)',
                          hintText: '08:00',
                        ),
                        validator: (value) =>
                            value == null ||
                                !RegExp(
                                  r'^([01]\d|2[0-3]):[0-5]\d$',
                                ).hasMatch(value.trim())
                            ? 'Enter a valid time, e.g. 08:00'
                            : null,
                      ),
                      TextFormField(
                        controller: startDateController,
                        decoration: const InputDecoration(
                          labelText: 'Start date * (YYYY-MM-DD)',
                        ),
                        validator: (value) =>
                            value == null ||
                                !RegExp(
                                  r'^\d{4}-\d{2}-\d{2}$',
                                ).hasMatch(value.trim()) ||
                                DateTime.tryParse(value.trim()) == null
                            ? 'Enter a valid start date'
                            : null,
                      ),
                      TextFormField(
                        controller: endDateController,
                        decoration: const InputDecoration(
                          labelText: 'End date (optional, YYYY-MM-DD)',
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return null;
                          }
                          if (!RegExp(
                                r'^\d{4}-\d{2}-\d{2}$',
                              ).hasMatch(value.trim()) ||
                              DateTime.tryParse(value.trim()) == null) {
                            return 'Enter a valid end date';
                          }
                          if (value.trim().compareTo(
                                startDateController.text.trim(),
                              ) <
                              0) {
                            return 'End date must not precede start date';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSaving ? null : () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;

                        setDialogState(() => isSaving = true);

                        try {
                          final startDate = startDateController.text.trim();
                          final endDate = endDateController.text.trim();
                          final instructions = instructionsController.text
                              .trim();

                          final medicationResponse = await _apiService.post(
                            'medications/$patientId/medications',
                            accessToken: widget.session.accessToken,
                            body: {
                              'name': nameController.text.trim(),
                              'dosage': dosageController.text.trim(),
                              'instructions': instructions,
                            },
                          );

                          if (medicationResponse.statusCode < 200 ||
                              medicationResponse.statusCode >= 300) {
                            throw Exception(
                              _apiErrorMessage(
                                medicationResponse.body,
                                'Could not create medication',
                              ),
                            );
                          }

                          final medicationData =
                              jsonDecode(medicationResponse.body)
                                  as Map<String, dynamic>;
                          final medication =
                              medicationData['data'] as Map<String, dynamic>;
                          final medicationId = medication['id']?.toString();

                          if (medicationId == null || medicationId.isEmpty) {
                            throw Exception(
                              'The server did not return a medication ID.',
                            );
                          }

                          final prescriptionResponse = await _apiService.post(
                            'medications/$patientId/prescriptions',
                            accessToken: widget.session.accessToken,
                            body: {
                              'medicationId': medicationId,
                              'dose': doseController.text.trim(),
                              'frequency': frequency,
                              'startDate': startDate,
                              if (endDate.isNotEmpty) 'endDate': endDate,
                              'instructions': instructions,
                            },
                          );

                          if (prescriptionResponse.statusCode < 200 ||
                              prescriptionResponse.statusCode >= 300) {
                            throw Exception(
                              'Medication saved, but prescription creation failed: '
                              '${_apiErrorMessage(prescriptionResponse.body, 'Request failed')} '
                              'Please retry after checking the patient medication list.',
                            );
                          }

                          final prescriptionData =
                              jsonDecode(prescriptionResponse.body)
                                  as Map<String, dynamic>;
                          final prescription =
                              prescriptionData['data'] as Map<String, dynamic>;
                          final prescriptionId = prescription['id']?.toString();

                          final scheduleResponse = await _apiService.post(
                            'medications/$patientId/schedules',
                            accessToken: widget.session.accessToken,
                            body: {
                              'medicationId': medicationId,
                              'prescriptionId': prescriptionId,
                              'dosage': dosageController.text.trim(),
                              'time': timeController.text.trim(),
                              'frequency': frequency,
                              'startDate': startDate,
                              if (endDate.isNotEmpty) 'endDate': endDate,
                            },
                          );

                          if (scheduleResponse.statusCode < 200 ||
                              scheduleResponse.statusCode >= 300) {
                            throw Exception(
                              'Medication and prescription were saved, but schedule creation failed: '
                              '${_apiErrorMessage(scheduleResponse.body, 'Request failed')} '
                              'Please check the medication before retrying.',
                            );
                          }

                          if (!dialogContext.mounted) return;
                          Navigator.pop(dialogContext);

                          if (!mounted) return;
                          ScaffoldMessenger.of(this.context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Medication, prescription, and schedule created.',
                              ),
                            ),
                          );

                          await _loadDashboard();
                        } catch (error) {
                          if (!dialogContext.mounted) return;
                          setDialogState(() => isSaving = false);

                          ScaffoldMessenger.of(dialogContext).showSnackBar(
                            SnackBar(
                              content: Text(
                                error.toString().replaceFirst(
                                  'Exception: ',
                                  '',
                                ),
                              ),
                            ),
                          );
                        }
                      },
                child: isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save prescription'),
              ),
            ],
          ),
        ),
      );
    } finally {
      nameController.dispose();
      dosageController.dispose();
      doseController.dispose();
      instructionsController.dispose();
      timeController.dispose();
      startDateController.dispose();
      endDateController.dispose();
    }
  }

  String _apiErrorMessage(String body, String fallback) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        return decoded['message']?.toString() ?? fallback;
      }
    } catch (_) {
      // Use the fallback when the response is not JSON.
    }
    return fallback;
  }

  Future<void> _showApproveDialog(Map<String, dynamic> patient) async {
    final nicknameController = TextEditingController();
    String? validationError;

    try {
      final nickname = await showDialog<String>(
        context: context,
        builder: (dialogContext) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            title: const Text('Approve patient'),
            content: TextField(
              controller: nicknameController,
              autofocus: true,
              decoration: InputDecoration(
                labelText: 'Patient nickname',
                hintText: 'e.g. AST-1234',
                border: const OutlineInputBorder(),
                errorText: validationError,
              ),
              onChanged: (_) {
                if (validationError != null) {
                  setDialogState(() => validationError = null);
                }
              },
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () {
                  final value = nicknameController.text.trim();

                  if (value.isEmpty) {
                    setDialogState(() {
                      validationError = 'Please enter a patient nickname';
                    });
                    return;
                  }

                  Navigator.pop(dialogContext, value);
                },
                child: const Text('Approve'),
              ),
            ],
          ),
        ),
      );

      if (nickname == null || !mounted) return;

      await _submitPatientDecision(
        patient: patient,
        action: 'APPROVE',
        nickname: nickname,
      );
    } finally {
      nicknameController.dispose();
    }
  }

  Future<void> _showRejectDialog(Map<String, dynamic> patient) async {
    final reasonController = TextEditingController();

    final reason = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Reject patient'),
        content: TextField(
          controller: reasonController,
          autofocus: true,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Reason (optional)',
            hintText: 'Explain why the registration is rejected',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.pop(dialogContext, reasonController.text.trim()),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Theme.of(context).colorScheme.onError,
            ),
            child: const Text('Reject patient'),
          ),
        ],
      ),
    );

    reasonController.dispose();

    if (reason == null || !mounted) return;

    await _submitPatientDecision(
      patient: patient,
      action: 'REJECT',
      reason: reason,
    );
  }

  Future<void> _submitPatientDecision({
    required Map<String, dynamic> patient,
    required String action,
    String? nickname,
    String? reason,
  }) async {
    final patientId = patient['id']?.toString();

    if (patientId == null || patientId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cannot review this patient: missing patient ID.'),
        ),
      );
      return;
    }

    if (_reviewingPatientIds.contains(patientId)) return;

    setState(() {
      _reviewingPatientIds.add(patientId);
    });

    try {
      final message = await _apiService.reviewPatientApproval(
        accessToken: widget.session.accessToken,
        patientId: patientId,
        action: action,
        nickname: nickname,
        reason: reason,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            message.isNotEmpty
                ? message
                : 'Patient ${action.toLowerCase()}d successfully.',
          ),
        ),
      );

      await _loadDashboard();
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _reviewingPatientIds.remove(patientId);
        });
      }
    }
  }

  Widget _pendingPatientTile(Map<String, dynamic> patient) {
    final name = _display(patient['fullName'], fallback: 'Unnamed patient');

    final patientId = patient['id']?.toString() ?? '';
    final isReviewing = _reviewingPatientIds.contains(patientId);

    final email = patient['user'] is Map<String, dynamic>
        ? patient['user']['email']?.toString()
        : null;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?'),
              ),
              title: Text(name),
              subtitle: Text(
                [
                  if (email != null && email.isNotEmpty) email,
                  if (patient['hospital'] is Map<String, dynamic>)
                    (patient['hospital']['name']?.toString() ?? ''),
                  'Awaiting doctor approval',
                ].where((value) => value.isNotEmpty).join('\n'),
              ),
            ),
            const SizedBox(height: 8),
            if (isReviewing)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(8),
                  child: CircularProgressIndicator(),
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: patientId.isEmpty
                          ? null
                          : () => _showApproveDialog(patient),
                      icon: const Icon(Icons.check),
                      label: const Text('Approve'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: patientId.isEmpty
                          ? null
                          : () => _showRejectDialog(patient),
                      icon: const Icon(Icons.close),
                      label: const Text('Reject'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
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

    final adherenceByPatientId = {
      for (final item in _adherenceSummary)
        if (item['patientId'] != null) item['patientId'].toString(): item,
    };

    Map<String, dynamic> enrichPatient(Map<String, dynamic> patient) {
      final summary = adherenceByPatientId[patient['id']?.toString()];

      return {
        ...patient,
        if (summary != null) 'riskLevel': summary['riskLevel'],
        if (summary != null) 'consecutiveMisses': summary['consecutiveMisses'],
        if (summary != null && summary['todayAdherence'] != null)
          'adherenceToday': summary['todayAdherence'],
      };
    }

    final enrichedPatients = patients.map(enrichPatient).toList();
    final enrichedRiskPatients = riskPatients.map(enrichPatient).toList();

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
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => NotificationsScreen(
                    session: widget.session,
                    onOpenNotification: (notification) async {
                      final relatedId = notification['relatedId']?.toString();

                      if (relatedId == null || relatedId.isEmpty) {
                        return;
                      }

                      final patients = (_dashboard?['patients'] as List?) ?? [];

                      final patient = patients
                          .cast<Map<String, dynamic>>()
                          .where((item) => item['id']?.toString() == relatedId)
                          .firstOrNull;

                      if (!mounted) return;

                      if (patient == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Patient details are not available in the dashboard.',
                            ),
                          ),
                        );
                        return;
                      }

                      Navigator.pop(context);

                      await showDialog<void>(
                        context: context,
                        builder: (dialogContext) {
                          final patientName =
                              patient['nickname'] ??
                              patient['fullName'] ??
                              'Patient';

                          return AlertDialog(
                            title: Text(patientName.toString()),
                            content: const Text(
                              'This patient has a notification requiring attention. '
                              'Return to the dashboard to review their medication '
                              'schedules and adherence information.',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(dialogContext),
                                child: const Text('Close'),
                              ),
                            ],
                          );
                        },
                      );
                    },
                  ),
                ),
              );
            },
            icon: const Icon(Icons.notifications_outlined),
            label: const Text('Notifications'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => MessagesScreen(session: widget.session),
                ),
              );
            },
            icon: const Icon(Icons.message_outlined),
            label: const Text('Messages'),
          ),
          _sectionTitle('Active patients (${patients.length})'),
          TextField(
            controller: _patientSearchController,
            decoration: InputDecoration(
              labelText: 'Search patients',
              hintText: 'Search by name or nickname',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _patientSearchQuery.isEmpty
                  ? null
                  : IconButton(
                      tooltip: 'Clear search',
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _patientSearchController.clear();
                        setState(() => _patientSearchQuery = '');
                      },
                    ),
              border: const OutlineInputBorder(),
            ),
            onChanged: (value) {
              setState(() => _patientSearchQuery = value.trim());
            },
          ),
          const SizedBox(height: 8),
          Builder(
            builder: (context) {
              final query = _patientSearchQuery.toLowerCase();

              final filteredPatients = enrichedPatients.where((patient) {
                final name = (patient['fullName'] ?? '')
                    .toString()
                    .toLowerCase();
                final nickname = (patient['nickname'] ?? '')
                    .toString()
                    .toLowerCase();

                return name.contains(query) || nickname.contains(query);
              }).toList();

              if (filteredPatients.isEmpty) {
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.person_search),
                    title: Text(
                      patients.isEmpty
                          ? 'No active patients yet'
                          : 'No matching patients',
                    ),
                    subtitle: Text(
                      patients.isEmpty
                          ? 'Active patients assigned to you will appear here.'
                          : 'Try a different name or nickname.',
                    ),
                  ),
                );
              }

              return Column(
                children: filteredPatients.map(_patientTile).toList(),
              );
            },
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
            ...enrichedRiskPatients.map(
              (patient) => _patientTile(patient, showAdherence: true),
            ),
          _sectionTitle(
            'Pending patient approvals (${pendingPatients.length})',
          ),
          if (pendingPatients.isEmpty)
            const Card(child: ListTile(title: Text('No pending approvals')))
          else
            ...pendingPatients.map(_pendingPatientTile),
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
            tooltip: 'Messages',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => MessagesScreen(session: widget.session),
                ),
              );
            },
            icon: const Icon(Icons.message_outlined),
          ),
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
