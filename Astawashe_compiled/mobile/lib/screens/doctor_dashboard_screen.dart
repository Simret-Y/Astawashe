import 'dart:convert';

import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../services/api_service.dart';
import 'messages_screen.dart';
import 'notifications_screen.dart';

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

  int _selectedTabIndex = 0;

  static const _pageBackground = Color(0xFFF6F8FC);

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _loadDashboard();
  }

  @override
  void dispose() {
    _patientSearchController.dispose();
    _apiService.dispose();
    super.dispose();
  }

  Future<void> _loadDashboard() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

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
          'Could not load the dashboard (HTTP ${response.statusCode}).',
        );
      }

      final decoded = jsonDecode(response.body);

      if (decoded is! Map<String, dynamic> ||
          decoded['success'] != true ||
          decoded['data'] is! Map<String, dynamic>) {
        throw const FormatException('Invalid doctor dashboard response.');
      }

      final dashboardData = decoded['data'] as Map<String, dynamic>;

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

  String _display(dynamic value, {String fallback = 'Not provided'}) {
    if (value == null || value.toString().trim().isEmpty) {
      return fallback;
    }
    return value.toString();
  }

  List<Map<String, dynamic>> _mapList(dynamic value) {
    if (value is! List) return [];

    return value.whereType<Map<String, dynamic>>().toList();
  }

  String _patientName(Map<String, dynamic> patient) {
    final user = patient['user'] is Map
        ? Map<String, dynamic>.from(patient['user'] as Map)
        : <String, dynamic>{};

    final profile = patient['profile'] is Map
        ? Map<String, dynamic>.from(patient['profile'] as Map)
        : <String, dynamic>{};

    final candidates = [
      patient['fullName'],
      patient['name'],
      patient['nickname'],
      user['fullName'],
      user['name'],
      profile['fullName'],
      profile['name'],
    ];

    for (final candidate in candidates) {
      final value = candidate?.toString().trim();
      if (value != null && value.isNotEmpty && value != 'null') {
        return value;
      }
    }

    return 'Unnamed patient';
  }

  String _patientNickname(Map<String, dynamic> patient) {
    final user = patient['user'] is Map
        ? Map<String, dynamic>.from(patient['user'] as Map)
        : <String, dynamic>{};

    final profile = patient['profile'] is Map
        ? Map<String, dynamic>.from(patient['profile'] as Map)
        : <String, dynamic>{};

    final candidates = [
      patient['nickname'],
      user['nickname'],
      profile['nickname'],
    ];

    for (final candidate in candidates) {
      final value = candidate?.toString().trim();
      if (value != null && value.isNotEmpty && value != 'null') {
        return value;
      }
    }

    return '';
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';

    if (parts.length == 1) {
      return parts.first.characters.first.toUpperCase();
    }

    return '${parts.first.characters.first}${parts.last.characters.first}'
        .toUpperCase();
  }

  Color _riskColor(String risk) {
    switch (risk.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return const Color(0xFFB42318);
      case 'MEDIUM':
      case 'MODERATE':
        return const Color(0xFFB54708);
      case 'LOW':
        return const Color(0xFF027A48);
      default:
        return const Color(0xFF667085);
    }
  }

  Widget _sectionHeading(String title, {String? subtitle, Widget? trailing}) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF172B4D),
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF667085),
                    ),
                  ),
                ],
              ],
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }

  Widget _surface({
    required Widget child,
    EdgeInsetsGeometry padding = const EdgeInsets.all(16),
  }) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE8EDF5)),
      ),
      child: child,
    );
  }

  Widget _emptyState({
    required IconData icon,
    required String title,
    required String message,
  }) {
    return _surface(
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 28),
      child: Column(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: const BoxDecoration(
              color: Color(0xFFEEF2FF),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFF4759A8), size: 26),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF172B4D),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(height: 1.5, color: Color(0xFF667085)),
          ),
        ],
      ),
    );
  }

  Widget _statCard({
    required String label,
    required dynamic value,
    required IconData icon,
    required Color color,
    required Color iconBackground,
  }) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE8EDF5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBackground,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 15),
          Text(
            _display(value, fallback: '0'),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 25,
              fontWeight: FontWeight.w800,
              color: Color(0xFF172B4D),
            ),
          ),
          const SizedBox(height: 5),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF667085),
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }

  Widget _personAvatar(String name, {double radius = 23}) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: const Color(0xFFE8EDFF),
      foregroundColor: const Color(0xFF4053A5),
      child: Text(
        _initials(name),
        style: TextStyle(fontWeight: FontWeight.w700, fontSize: radius * 0.55),
      ),
    );
  }

  Widget _statusPill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }

  Widget _patientTile(
    Map<String, dynamic> patient, {
    bool showAdherence = false,
  }) {
    final patientId = patient['id']?.toString();

    final risk = _display(patient['riskLevel'], fallback: 'UNKNOWN');
    final riskColor = _riskColor(risk);

    final name = _patientName(patient);
    final nickname = _patientNickname(patient);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8EDF5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            nickname.isNotEmpty && nickname != name
                ? '$name ($nickname)'
                : name,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF172B4D),
            ),
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 380;

              final prescribeButton = OutlinedButton.icon(
                onPressed: patientId == null || patientId.isEmpty
                    ? null
                    : () => _showPrescribeDialog(patient),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Prescribe'),
              );

              final prescriptionsButton = FilledButton.tonalIcon(
                onPressed: patientId == null || patientId.isEmpty
                    ? null
                    : () => _showPatientPrescriptions(patient),
                icon: const Icon(Icons.description_outlined, size: 18),
                label: const Text(
                  'Prescriptions',
                  maxLines: 1,
                  softWrap: false,
                  overflow: TextOverflow.ellipsis,
                ),
              );

              final notesButton = OutlinedButton.icon(
                onPressed: patientId == null || patientId.isEmpty
                    ? null
                    : () => _showPatientNotes(patient),
                icon: const Icon(Icons.note_alt_outlined, size: 18),
                label: const Text('Patient Notes'),
              );

              if (compact) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    prescribeButton,
                    const SizedBox(height: 8),
                    prescriptionsButton,
                    const SizedBox(height: 8),
                    notesButton,
                  ],
                );
              }

              return Column(
                children: [
                  Row(
                    children: [
                      Expanded(child: prescribeButton),
                      const SizedBox(width: 8),
                      Expanded(child: prescriptionsButton),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(width: double.infinity, child: notesButton),
                ],
              );
            },
          ),

          if (showAdherence) ...[
            const SizedBox(height: 14),
            const Divider(height: 1, color: Color(0xFFEEF1F6)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _miniMetric(
                    'Adherence today',
                    '${_display(patient['adherenceToday'], fallback: '0')}%',
                    Icons.insights_outlined,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _miniMetric(
                    'Missed doses',
                    _display(patient['consecutiveMisses'], fallback: '0'),
                    Icons.medication_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Risk level',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF667085),
                    ),
                  ),
                ),
                _statusPill(risk, riskColor),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Active schedules',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF667085),
                    ),
                  ),
                ),
                Text(
                  _display(patient['medicationCount'], fallback: '0'),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF172B4D),
                  ),
                ),
              ],
            ),
          ] else ...[
            const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }

  Widget _miniMetric(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F8FC),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF5265B5)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: Color(0xFF172B4D),
                  ),
                ),
                Text(
                  label,
                  maxLines: 2,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF667085),
                  ),
                ),
              ],
            ),
          ),
        ],
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
        final message = _apiErrorMessage(
          response.body,
          'Could not load schedules.',
        );
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
        return;
      }

      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic> || decoded['data'] is! List) {
        throw const FormatException('Invalid schedules response.');
      }

      final schedules = _mapList(decoded['data']);

      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(
            '${patient['nickname'] ?? patient['fullName'] ?? 'Patient'}'
            ' — Medication schedules',
          ),
          content: SizedBox(
            width: 500,
            child: schedules.isEmpty
                ? const Text('No medication schedules found.')
                : ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 450),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: schedules.length,
                      separatorBuilder: (_, _) => const Divider(),
                      itemBuilder: (context, index) {
                        final schedule = schedules[index];
                        final medication =
                            schedule['medication'] as Map<String, dynamic>?;

                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.medication_outlined),
                          title: Text(
                            medication?['name']?.toString() ?? 'Medication',
                          ),
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
                      },
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

  Future<void> _showPatientNotes(Map<String, dynamic> patient) async {
    final patientId = patient['id']?.toString();

    if (patientId == null || patientId.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Patient ID is missing.')));
      return;
    }

    try {
      final response = await _apiService.getPatientSchedulesForDoctor(
        patientId: patientId,
        accessToken: widget.session.accessToken,
      );

      if (!mounted) return;

      if (response.statusCode < 200 || response.statusCode >= 300) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _apiErrorMessage(
                response.body,
                'Could not load patient medications.',
              ),
            ),
          ),
        );
        return;
      }

      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic> || decoded['data'] is! List) {
        throw const FormatException('Invalid patient medications response.');
      }

      final schedules = _mapList(decoded['data']);
      final medicationsById = <String, Map<String, dynamic>>{};

      for (final schedule in schedules) {
        final medication = schedule['medication'];
        if (medication is! Map<String, dynamic>) continue;

        final medicationId = medication['id']?.toString();
        if (medicationId == null || medicationId.isEmpty) continue;

        medicationsById.putIfAbsent(
          medicationId,
          () => Map<String, dynamic>.from(medication),
        );
      }

      final medications = medicationsById.values.toList();

      await showDialog<void>(
        context: context,
        builder: (dialogContext) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            title: Text('Patient notes — ${_patientName(patient)}'),
            content: SizedBox(
              width: 500,
              child: medications.isEmpty
                  ? const Text(
                      'No medications with schedules were found for this patient.',
                    )
                  : ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 450),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: medications.length,
                        separatorBuilder: (_, _) => const Divider(),
                        itemBuilder: (context, index) {
                          final medication = medications[index];
                          final notes =
                              medication['notes']?.toString().trim() ?? '';

                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: const Icon(Icons.medication_outlined),
                            title: Text(
                              medication['name']?.toString() ?? 'Medication',
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(
                                notes.isEmpty ? 'No notes added.' : notes,
                              ),
                            ),
                            trailing: IconButton(
                              tooltip: 'Edit notes',
                              icon: const Icon(Icons.edit_outlined),
                              onPressed: () async {
                                await _showEditMedicationNotesDialog(
                                  medication: medication,
                                  onSaved: (updatedNotes) {
                                    setDialogState(() {
                                      medication['notes'] = updatedNotes;
                                    });
                                  },
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
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: const Text('Close'),
              ),
            ],
          ),
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
        SnackBar(content: Text('Could not load patient notes: $error')),
      );
    }
  }

  Future<void> _showEditMedicationNotesDialog({
    required Map<String, dynamic> medication,
    required ValueChanged<String> onSaved,
  }) async {
    final medicationId = medication['id']?.toString();

    if (medicationId == null || medicationId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Medication ID is missing.')),
      );
      return;
    }

    final notesController = TextEditingController(
      text: medication['notes']?.toString() ?? '',
    );

    bool saving = false;

    try {
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            title: Text('Notes — ${medication['name'] ?? 'Medication'}'),
            content: SizedBox(
              width: 450,
              child: TextField(
                controller: notesController,
                autofocus: true,
                minLines: 4,
                maxLines: 8,
                enabled: !saving,
                decoration: const InputDecoration(
                  labelText: 'Instructions for the patient',
                  hintText: 'Enter medication-specific instructions...',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(),
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
                        setDialogState(() => saving = true);

                        try {
                          final updatedNotes = notesController.text.trim();

                          await _apiService.updateMedicationNotes(
                            medicationId: medicationId,
                            notes: updatedNotes,
                            accessToken: widget.session.accessToken,
                          );

                          if (!mounted || !dialogContext.mounted) return;

                          onSaved(updatedNotes);
                          Navigator.pop(dialogContext);

                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Patient notes saved successfully.',
                              ),
                            ),
                          );
                        } catch (error) {
                          if (!dialogContext.mounted) return;

                          setDialogState(() => saving = false);
                          ScaffoldMessenger.of(dialogContext).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Could not save patient notes: '
                                '${error.toString().replaceFirst('Exception: ', '')}',
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
                    : const Text('Save notes'),
              ),
            ],
          ),
        ),
      );
    } finally {
      notesController.dispose();
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
          title: Text('Prescriptions — ${_patientName(patient)}'),
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

    const allowedFrequencies = ['DAILY', 'TWICE_DAILY', 'WEEKLY'];
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
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Enter the dosage.'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: timeController,
                        decoration: const InputDecoration(
                          labelText: 'Time',
                          hintText: 'HH:mm',
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Enter a time.'
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
                            return 'Enter a valid start date.';
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
                          Navigator.pop(dialogContext);

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
    final patientName = _patientName(patient);

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
                            ? 'Medication name is required.'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: dosageController,
                        decoration: const InputDecoration(
                          labelText: 'Schedule dosage *',
                          hintText: 'e.g. 1 tablet',
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Dosage is required.'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: doseController,
                        decoration: const InputDecoration(
                          labelText: 'Prescription dose *',
                          hintText: 'e.g. 500 mg',
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Dose is required.'
                            : null,
                      ),
                      const SizedBox(height: 12),
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
                      const SizedBox(height: 12),
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
                            ? 'Enter a valid time, e.g. 08:00.'
                            : null,
                      ),
                      const SizedBox(height: 12),
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
                            ? 'Enter a valid start date.'
                            : null,
                      ),
                      const SizedBox(height: 12),
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
                            return 'Enter a valid end date.';
                          }

                          final start = DateTime.tryParse(
                            startDateController.text.trim(),
                          );
                          final end = DateTime.tryParse(value.trim());

                          if (start != null &&
                              end != null &&
                              end.isBefore(start)) {
                            return 'End date must not precede start date.';
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
                                'Could not create medication.',
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
                              '${_apiErrorMessage(prescriptionResponse.body, 'Request failed')}. '
                              'Check the patient medication list before retrying.',
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
                              '${_apiErrorMessage(scheduleResponse.body, 'Request failed')}. '
                              'Check the medication before retrying.',
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
      // Fall back when the response is not JSON.
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
                      validationError = 'Please enter a patient nickname.';
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
            hintText: 'Explain why the registration is rejected.',
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

    setState(() => _reviewingPatientIds.add(patientId));

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
        setState(() => _reviewingPatientIds.remove(patientId));
      }
    }
  }

  Widget _pendingPatientTile(Map<String, dynamic> patient) {
    final name = _patientName(patient);
    final patientId = patient['id']?.toString() ?? '';
    final isReviewing = _reviewingPatientIds.contains(patientId);
    final nickname = _patientNickname(patient);

    final email = patient['user'] is Map<String, dynamic>
        ? patient['user']['email']?.toString()
        : null;

    final hospital = patient['hospital'] is Map<String, dynamic>
        ? patient['hospital']['name']?.toString()
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8EDF5)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _personAvatar(name),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nickname.isNotEmpty && nickname != name
                          ? '$name ($nickname)'
                          : name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF172B4D),
                      ),
                    ),
                    if (email != null && email.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        email,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF667085),
                        ),
                      ),
                    ],
                    if (hospital != null && hospital.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        hospital,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF667085),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              _statusPill('Pending', const Color(0xFFB54708)),
            ],
          ),
          const SizedBox(height: 14),
          if (isReviewing)
            const Padding(
              padding: EdgeInsets.all(8),
              child: Center(child: CircularProgressIndicator()),
            )
          else
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: patientId.isEmpty
                        ? null
                        : () => _showApproveDialog(patient),
                    icon: const Icon(Icons.check, size: 18),
                    label: const Text('Approve'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: patientId.isEmpty
                        ? null
                        : () => _showRejectDialog(patient),
                    icon: const Icon(Icons.close, size: 18),
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
    );
  }

  // ---------------------------------------------------------------------------
  // Navigation destinations
  // ---------------------------------------------------------------------------

  Widget _buildOverview(
    Map<String, dynamic> data,
    Map<String, dynamic> doctor,
    Map<String, dynamic> stats,
    List<Map<String, dynamic>> patients,
    List<Map<String, dynamic>> riskPatients,
    List<Map<String, dynamic>> pendingPatients,
  ) {
    final name = _display(doctor['name'], fallback: widget.session.displayName);

    final averageAdherence = _display(
      data['averageAdherence'],
      fallback: '0.0',
    );

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 24),
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Good to see you,',
                    style: TextStyle(fontSize: 14, color: Color(0xFF667085)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 23,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF172B4D),
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    _display(
                      doctor['specialization'],
                      fallback: 'Your clinical overview',
                    ),
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF667085),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE8EDFF),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.medical_services_outlined,
                color: Color(0xFF4053A5),
                size: 27,
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF34469B), Color(0xFF5869C2)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Patient adherence',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.insights_outlined,
                    color: Colors.white.withValues(alpha: 0.9),
                    size: 23,
                  ),
                ],
              ),
              const SizedBox(height: 9),
              Text(
                '$averageAdherence%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 34,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Average adherence today',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 18),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: ((double.tryParse(averageAdherence) ?? 0) / 100).clamp(
                    0.0,
                    1.0,
                  ),
                  minHeight: 7,
                  backgroundColor: Colors.white.withValues(alpha: 0.22),
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            ],
          ),
        ),
        _sectionHeading('Today at a glance'),

        LayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.maxWidth < 340
                ? 1
                : constraints.maxWidth < 900
                ? 2
                : 4;

            return GridView.count(
              crossAxisCount: columns,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 11,
              mainAxisSpacing: 11,
              childAspectRatio:
                  (constraints.maxWidth - 11 * (columns - 1)) / columns / 175,
              children: [
                _statCard(
                  label: 'Active patients',
                  value: stats['totalPatients'] ?? patients.length,
                  icon: Icons.people_alt_outlined,
                  color: const Color(0xFF4053A5),
                  iconBackground: const Color(0xFFE8EDFF),
                ),
                _statCard(
                  label: 'Pending approvals',
                  value: stats['pendingPatients'] ?? pendingPatients.length,
                  icon: Icons.person_add_alt_1_outlined,
                  color: const Color(0xFFB54708),
                  iconBackground: const Color(0xFFFFF1DB),
                ),
                _statCard(
                  label: 'High-risk patients',
                  value: stats['highRiskPatients'] ?? riskPatients.length,
                  icon: Icons.health_and_safety_outlined,
                  color: const Color(0xFFB42318),
                  iconBackground: const Color(0xFFFFE9E7),
                ),
                _statCard(
                  label: 'Missed doses today',
                  value: stats['missedDosesToday'],
                  icon: Icons.medication_outlined,
                  color: const Color(0xFF027A48),
                  iconBackground: const Color(0xFFE3F7EC),
                ),
              ],
            );
          },
        ),

        _sectionHeading(
          'Needs your attention',
          subtitle: 'Patients flagged for adherence review',
          trailing: TextButton(
            onPressed: () => setState(() => _selectedTabIndex = 2),
            child: const Text('View all'),
          ),
        ),
        if (riskPatients.isEmpty)
          _emptyState(
            icon: Icons.check_circle_outline,
            title: 'No patients flagged',
            message: 'There are no high-risk patients listed right now.',
          )
        else
          ...riskPatients
              .take(3)
              .map((patient) => _patientTile(patient, showAdherence: true)),
        _sectionHeading(
          'Your patients',
          subtitle: '${patients.length} active patients',
          trailing: TextButton(
            onPressed: () => setState(() => _selectedTabIndex = 1),
            child: const Text('View all'),
          ),
        ),
        if (patients.isEmpty)
          _emptyState(
            icon: Icons.people_outline,
            title: 'No active patients yet',
            message: 'Patients assigned to you will appear here.',
          )
        else
          ...patients.take(3).map(_patientTile),
      ],
    );
  }

  Widget _buildPatients(List<Map<String, dynamic>> patients) {
    final query = _patientSearchQuery.toLowerCase();

    final filteredPatients = patients.where((patient) {
      final name = (patient['fullName'] ?? '').toString().toLowerCase();
      final nickname = (patient['nickname'] ?? '').toString().toLowerCase();

      return name.contains(query) || nickname.contains(query);
    }).toList();

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 24),
      children: [
        const Text(
          'Patients',
          style: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.w800,
            color: Color(0xFF172B4D),
          ),
        ),
        const SizedBox(height: 5),
        Text(
          '${patients.length} active patients assigned to you',
          style: const TextStyle(color: Color(0xFF667085)),
        ),
        const SizedBox(height: 20),
        TextField(
          controller: _patientSearchController,
          decoration: InputDecoration(
            hintText: 'Search by name or patient ID',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _patientSearchQuery.isEmpty
                ? null
                : IconButton(
                    tooltip: 'Clear search',
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      _patientSearchController.clear();
                      setState(() => _patientSearchQuery = '');
                    },
                  ),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(color: Color(0xFFE8EDF5)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(color: Color(0xFFE8EDF5)),
            ),
          ),
          onChanged: (value) {
            setState(() => _patientSearchQuery = value.trim());
          },
        ),
        const SizedBox(height: 18),
        if (filteredPatients.isEmpty)
          _emptyState(
            icon: Icons.person_search_outlined,
            title: patients.isEmpty
                ? 'No active patients yet'
                : 'No matching patients',
            message: patients.isEmpty
                ? 'Patients assigned to you will appear here.'
                : 'Try another patient name or ID.',
          )
        else ...[
          Text(
            '${filteredPatients.length} result${filteredPatients.length == 1 ? '' : 's'}',
            style: const TextStyle(
              color: Color(0xFF667085),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 10),
          ...filteredPatients.map(_patientTile),
        ],
      ],
    );
  }

  Widget _buildMonitoring(
    Map<String, dynamic> data,
    List<Map<String, dynamic>> riskPatients,
  ) {
    final averageAdherence = _display(
      data['averageAdherence'],
      fallback: '0.0',
    );

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 24),
      children: [
        const Text(
          'Monitoring',
          style: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.w800,
            color: Color(0xFF172B4D),
          ),
        ),
        const SizedBox(height: 5),
        const Text(
          'Review adherence and identify patients who may need attention.',
          style: TextStyle(color: Color(0xFF667085), height: 1.5),
        ),
        const SizedBox(height: 20),
        _surface(
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8EDFF),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.insights_outlined,
                  color: Color(0xFF4053A5),
                  size: 25,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Average adherence today',
                      style: TextStyle(color: Color(0xFF667085), fontSize: 12),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      '$averageAdherence%',
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF172B4D),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        _sectionHeading(
          'Patients needing attention',
          subtitle: '${riskPatients.length} patient(s) listed',
        ),
        if (riskPatients.isEmpty)
          _emptyState(
            icon: Icons.check_circle_outline,
            title: 'All clear for now',
            message:
                'No patients are currently listed as needing adherence attention.',
          )
        else
          ...riskPatients.map(
            (patient) => _patientTile(patient, showAdherence: true),
          ),
      ],
    );
  }

  Widget _buildMore(List<Map<String, dynamic>> pendingPatients) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 24),
      children: [
        const Text(
          'More',
          style: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.w800,
            color: Color(0xFF172B4D),
          ),
        ),
        const SizedBox(height: 5),
        const Text(
          'Approvals and communication',
          style: TextStyle(color: Color(0xFF667085)),
        ),
        _sectionHeading(
          'Communication',
          subtitle: 'Stay connected with patients and your care team',
        ),
        _surface(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              _actionRow(
                icon: Icons.notifications_none_rounded,
                iconColor: const Color(0xFF4053A5),
                iconBackground: const Color(0xFFE8EDFF),
                title: 'Notifications',
                subtitle: 'View updates that may need attention',
                onTap: _openDoctorNotifications,
              ),
              const Divider(height: 1, indent: 66),
              _actionRow(
                icon: Icons.chat_bubble_outline_rounded,
                iconColor: const Color(0xFF027A48),
                iconBackground: const Color(0xFFE3F7EC),
                title: 'Messages',
                subtitle: 'Open your conversations',
                onTap: _openDoctorMessages,
              ),
            ],
          ),
        ),
        _sectionHeading(
          'Patient approvals',
          subtitle: 'Review requests to join your patient list',
          trailing: _statusPill(
            '${pendingPatients.length} pending',
            pendingPatients.isEmpty
                ? const Color(0xFF027A48)
                : const Color(0xFFB54708),
          ),
        ),
        if (pendingPatients.isEmpty)
          _emptyState(
            icon: Icons.task_alt_outlined,
            title: 'You are all caught up',
            message: 'There are no pending patient approvals.',
          )
        else
          ...pendingPatients.map(_pendingPatientTile),
      ],
    );
  }

  Widget _actionRow({
    required IconData icon,
    required Color iconColor,
    required Color iconBackground,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: iconBackground,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: iconColor),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: Color(0xFF172B4D),
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            subtitle,
            style: const TextStyle(fontSize: 12, color: Color(0xFF667085)),
          ),
        ),
        trailing: const Icon(Icons.chevron_right, color: Color(0xFF98A2B3)),
        onTap: onTap,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Account menu and communication
  // ---------------------------------------------------------------------------

  Future<void> _showAccountMenu() async {
    final data = _dashboard ?? {};
    final doctor = data['doctor'] as Map<String, dynamic>? ?? {};

    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      builder: (sheetContext) {
        final name = _display(
          doctor['name'],
          fallback: widget.session.displayName,
        );

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _personAvatar(name, radius: 30),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF172B4D),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _display(
                              doctor['specialization'],
                              fallback: 'Doctor',
                            ),
                            style: const TextStyle(color: Color(0xFF667085)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.badge_outlined),
                  title: const Text('Account status'),
                  subtitle: Text(_display(doctor['status'])),
                  contentPadding: EdgeInsets.zero,
                ),
                ListTile(
                  leading: const Icon(Icons.medical_services_outlined),
                  title: const Text('Specialization'),
                  subtitle: Text(
                    _display(
                      doctor['specialization'],
                      fallback: 'Not provided',
                    ),
                  ),
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(sheetContext);
                      _confirmSignOut();
                    },
                    icon: const Icon(Icons.logout),
                    label: const Text('Sign out'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFB42318),
                      side: const BorderSide(color: Color(0xFFF2C7C4)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _openDoctorNotifications() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => NotificationsScreen(
          session: widget.session,
          onOpenNotification: (notification) async {
            final relatedId = notification['relatedId']?.toString();
            if (relatedId == null || relatedId.isEmpty) return;

            final patients = _mapList(_dashboard?['patients']);

            Map<String, dynamic>? patient;

            for (final item in patients) {
              if (item['id']?.toString() == relatedId) {
                patient = item;
                break;
              }
            }

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
              builder: (dialogContext) => AlertDialog(
                title: Text(
                  (patient?['nickname'] ?? patient?['fullName'] ?? 'Patient')
                      .toString(),
                ),
                content: const Text(
                  'This patient has a notification requiring attention. '
                  'Review their medication schedules and adherence from the '
                  'Patients or Monitoring section.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(dialogContext),
                    child: const Text('Close'),
                  ),
                  FilledButton(
                    onPressed: () {
                      Navigator.pop(dialogContext);
                      setState(() => _selectedTabIndex = 2);
                    },
                    child: const Text('Open monitoring'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _openDoctorMessages() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MessagesScreen(session: widget.session),
      ),
    );
  }

  Future<void> _confirmSignOut() async {
    final shouldSignOut = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text(
          'Are you sure you want to sign out of your doctor account?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );

    if (shouldSignOut != true || !mounted) return;
    Navigator.of(context).pop();
  }

  // ---------------------------------------------------------------------------
  // Main screen
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final data = _dashboard ?? <String, dynamic>{};
    final doctor = data['doctor'] as Map<String, dynamic>? ?? {};
    final stats = data['stats'] as Map<String, dynamic>? ?? {};

    final patients = _mapList(data['patients']);
    final pendingPatients = _mapList(data['pendingPatientsList']);
    final riskPatients = _mapList(data['riskPatients']);

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

    final destinations = <Widget>[
      _buildOverview(
        data,
        doctor,
        stats,
        enrichedPatients,
        enrichedRiskPatients,
        pendingPatients,
      ),
      _buildPatients(enrichedPatients),
      _buildMonitoring(data, enrichedRiskPatients),
      _buildMore(pendingPatients),
    ];

    return Scaffold(
      backgroundColor: _pageBackground,
      appBar: AppBar(
        backgroundColor: _pageBackground,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleSpacing: 18,
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFF34469B),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.health_and_safety_outlined,
                color: Colors.white,
                size: 23,
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'AstaWashe',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w800,
                color: Color(0xFF172B4D),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Account and sign out',
            onPressed: _showAccountMenu,
            icon: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFFE8EDFF),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(
                Icons.person_outline_rounded,
                color: Color(0xFF4053A5),
                size: 23,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFFE9E7),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.cloud_off_outlined,
                        color: Color(0xFFB42318),
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Unable to load dashboard',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF172B4D),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF667085),
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 22),
                    FilledButton.icon(
                      onPressed: _loadDashboard,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try again'),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadDashboard,
              child: IndexedStack(
                index: _selectedTabIndex,
                children: destinations,
              ),
            ),
      bottomNavigationBar: _isLoading || _errorMessage != null
          ? null
          : NavigationBar(
              backgroundColor: Colors.white,
              surfaceTintColor: Colors.transparent,
              elevation: 8,
              selectedIndex: _selectedTabIndex,
              onDestinationSelected: (index) {
                setState(() => _selectedTabIndex = index);
              },
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.grid_view_outlined),
                  selectedIcon: Icon(Icons.grid_view_rounded),
                  label: 'Overview',
                ),
                NavigationDestination(
                  icon: Icon(Icons.people_outline_rounded),
                  selectedIcon: Icon(Icons.people_rounded),
                  label: 'Patients',
                ),
                NavigationDestination(
                  icon: Icon(Icons.monitor_heart_outlined),
                  selectedIcon: Icon(Icons.monitor_heart_rounded),
                  label: 'Monitoring',
                ),
                NavigationDestination(
                  icon: Icon(Icons.widgets_outlined),
                  selectedIcon: Icon(Icons.widgets_rounded),
                  label: 'More',
                ),
              ],
            ),
    );
  }
}
