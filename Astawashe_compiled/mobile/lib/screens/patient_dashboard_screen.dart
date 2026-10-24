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
  List<dynamic> _prescriptions = [];
  List<dynamic> _schedules = [];
  Map<String, dynamic>? _todayAdherence;

  String? _errorMessage;
  bool _isLoading = true;
  int _selectedIndex = 0;

  final Set<String> _submittingScheduleIds = {};

  static const Color _brandBlue = Color(0xFF2458A6);
  static const Color _brandBlueDark = Color(0xFF173E72);
  static const Color _background = Color(0xFFF6F8FC);
  static const Color _green = Color(0xFF16846B);

  Color get _muted => Theme.of(context).colorScheme.onSurfaceVariant;

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

  Future<void> _recordDose(Map<String, dynamic> schedule, String status) async {
    final rawId = schedule['id'];

    if (rawId == null || rawId.toString().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This schedule has no valid ID.')),
      );
      return;
    }

    final scheduleId = rawId.toString();

    if (_submittingScheduleIds.contains(scheduleId)) return;

    setState(() => _submittingScheduleIds.add(scheduleId));

    try {
      final response = await _apiService.post(
        'adherence/record-dose',
        accessToken: widget.session.accessToken,
        body: {'scheduleId': scheduleId, 'status': status, 'method': 'APP'},
      );

      if (!mounted) return;

      if (response.statusCode < 200 || response.statusCode >= 300) {
        var message = 'Could not record this dose. Please try again.';

        try {
          final decoded = jsonDecode(response.body);
          if (decoded is Map<String, dynamic> && decoded['message'] is String) {
            message = decoded['message'] as String;
          }
        } catch (_) {
          // Keep the fallback message for non-JSON responses.
        }

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            status == 'TAKEN'
                ? 'Dose marked as taken.'
                : 'Dose marked as not taken.',
          ),
        ),
      );

      await _loadDashboard();
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Could not record dose: '
            '${error.toString().replaceFirst('Exception: ', '')}',
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _submittingScheduleIds.remove(scheduleId));
      }
    }
  }

  Future<void> _loadDashboard() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final profileResult = await _getJson('patients/me');

      if (profileResult is! Map<String, dynamic>) {
        throw const FormatException('Invalid patient profile response.');
      }

      final results = await Future.wait(
        [
          _getJson('medications/my/medications'),
          _getJson('medications/my/schedules'),
          _getJson('medications/my/prescriptions'),
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
      final prescriptionResult = results[2];
      final todayResult = results[3];
      final weeklyResult = results[4];

      final failures = <String>[];

      if (medicationResult['error'] != null) failures.add('medications');
      if (scheduleResult['error'] != null) failures.add('schedules');
      if (prescriptionResult['error'] != null) failures.add('prescriptions');
      if (todayResult['error'] != null) failures.add('today’s adherence');
      if (weeklyResult['error'] != null) failures.add('weekly adherence');

      setState(() {
        _profile = profileResult;
        _medications = _extractList(medicationResult['value']);
        _schedules = _extractList(scheduleResult['value']);
        _prescriptions = _extractList(prescriptionResult['value']);
        _todayAdherence = _extractData(todayResult['value']);
        _errorMessage = failures.isEmpty
            ? null
            : 'Some information could not be loaded: '
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
    if (value == null || value.toString().trim().isEmpty) {
      return fallback;
    }
    return value.toString();
  }

  String _date(dynamic value) {
    if (value == null) return 'Not provided';
    final text = value.toString();
    return text.contains('T') ? text.split('T').first : text;
  }

  String get _patientName {
    final fullName = _profile?['fullName'];
    if (fullName != null && fullName.toString().trim().isNotEmpty) {
      return fullName.toString().trim();
    }

    return widget.session.displayName.trim().isNotEmpty
        ? widget.session.displayName
        : 'there';
  }

  String get _firstName {
    final name = _patientName;
    if (name == 'there') return name;
    return name.split(RegExp(r'\s+')).first;
  }

  Future<void> _openProfile() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => PatientProfileScreen(
          profile: _profile ?? {},
          session: widget.session,
          onLogout: _signOut,
        ),
      ),
    );
  }

  void _signOut() {
    // Return to the app's initial route, normally the login screen.
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  Widget _pageHeading(String title, {String? subtitle, Widget? trailing}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF202D42),
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 5),
                  Text(
                    subtitle,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: _muted),
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

  Widget _sectionTitle(
    String title, {
    String? actionLabel,
    VoidCallback? onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(top: 26, bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
                color: const Color(0xFF202D42),
              ),
            ),
          ),
          if (actionLabel != null && onTap != null)
            TextButton(onPressed: onTap, child: Text(actionLabel)),
        ],
      ),
    );
  }

  Widget _surfaceCard({required Widget child, EdgeInsets? padding}) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE9EDF4)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1C3454).withValues(alpha: 0.035),
            blurRadius: 18,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _summaryCard(
    String label,
    String value,
    IconData icon, {
    Color accent = _brandBlue,
  }) {
    return _surfaceCard(
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.09),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: accent, size: 22),
          ),
          const SizedBox(height: 16),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: const Color(0xFF202D42),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: _muted, height: 1.35),
          ),
        ],
      ),
    );
  }

  Widget _emptyState({
    required IconData icon,
    required String title,
    required String message,
  }) {
    return _surfaceCard(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFFEDF3FF),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 30, color: _brandBlue),
          ),
          const SizedBox(height: 15),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 7),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: _muted, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _detailLine(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: _muted),
        const SizedBox(width: 9),
        Expanded(
          child: Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: '$label: ',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                TextSpan(text: value),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _countBadge(String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFEDF3FF),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        value,
        style: const TextStyle(color: _brandBlue, fontWeight: FontWeight.w800),
      ),
    );
  }

  Widget _profileButton() {
    return Padding(
      padding: const EdgeInsets.only(right: 14),
      child: IconButton(
        tooltip: 'Open profile',
        onPressed: _profile == null ? null : _openProfile,
        style: IconButton.styleFrom(
          backgroundColor: const Color(0xFFEDF3FF),
          foregroundColor: _brandBlue,
          fixedSize: const Size(44, 44),
        ),
        icon: const Icon(Icons.person_outline_rounded),
      ),
    );
  }

  Widget _homePage() {
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
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 30),
        children: [
          _homeWelcomeCard(),
          const SizedBox(height: 22),
          Row(
            children: [
              Expanded(
                child: _summaryCard(
                  'Medications',
                  '${_medications.length}',
                  Icons.medication_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _summaryCard(
                  'Schedules',
                  '${_schedules.length}',
                  Icons.calendar_month_outlined,
                  accent: _green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _summaryCard(
                  "Today's adherence",
                  todayRate == null ? '—' : '$todayRate%',
                  Icons.fact_check_outlined,
                  accent: const Color(0xFF7856B8),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _summaryCard(
                  'Risk level',
                  _display(riskLevel, fallback: 'Unavailable'),
                  Icons.health_and_safety_outlined,
                  accent: const Color(0xFFC47728),
                ),
              ),
            ],
          ),
          _sectionTitle(
            "Today's medication plan",
            actionLabel: 'View all',
            onTap: () => setState(() => _selectedIndex = 2),
          ),
          if (_schedules.isEmpty)
            _emptyState(
              icon: Icons.event_available_outlined,
              title: 'Nothing scheduled yet',
              message:
                  'Your medication schedule will appear here when it is available.',
            )
          else
            ..._schedules
                .whereType<Map<String, dynamic>>()
                .take(3)
                .map(_scheduleCard),
          _sectionTitle(
            'Your medications',
            actionLabel: 'See all',
            onTap: () => setState(() => _selectedIndex = 1),
          ),
          if (_medications.isEmpty)
            _emptyState(
              icon: Icons.medication_outlined,
              title: 'No medications yet',
              message: 'Medications added to your account will appear here.',
            )
          else
            ..._medications
                .whereType<Map<String, dynamic>>()
                .take(2)
                .map(_medicationCard),
          _errorBanner(),
        ],
      ),
    );
  }

  Widget _homeWelcomeCard() {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_brandBlue, _brandBlueDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: _brandBlue.withValues(alpha: 0.20),
            blurRadius: 22,
            offset: const Offset(0, 9),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.health_and_safety_outlined,
                  color: Colors.white,
                  size: 27,
                ),
              ),
              const Spacer(),
              const Icon(
                Icons.favorite_rounded,
                color: Color(0xFFFFC7D2),
                size: 23,
              ),
            ],
          ),
          const SizedBox(height: 23),
          Text(
            'Your health, one dose at a time.',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.85),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 7),
          Text(
            'Hello, $_firstName!',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Keep track of your treatment and stay connected to your care plan.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.9),
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }

  Widget _medicationsPage() {
    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        children: [
          _pageHeading(
            'Medications',
            subtitle: 'Your current medication list',
            trailing: _countBadge('${_medications.length}'),
          ),
          if (_medications.isEmpty)
            _emptyState(
              icon: Icons.medication_outlined,
              title: 'No medications found',
              message:
                  'Your current medications will appear here when they are added to your account.',
            )
          else
            ..._medications.whereType<Map<String, dynamic>>().map(
              _medicationCard,
            ),
          _errorBanner(),
        ],
      ),
    );
  }

  Widget _schedulesPage() {
    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        children: [
          _pageHeading(
            'My schedule',
            subtitle: 'Keep track of each scheduled dose',
            trailing: _countBadge('${_schedules.length}'),
          ),
          _surfaceCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5F1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.checklist_rounded,
                    color: _green,
                    size: 25,
                  ),
                ),
                const SizedBox(width: 13),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'One dose at a time',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Record your dose status when you take your medication.',
                        style: TextStyle(
                          fontSize: 12,
                          height: 1.4,
                          color: Color(0xFF697589),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          if (_schedules.isEmpty)
            _emptyState(
              icon: Icons.calendar_month_outlined,
              title: 'No schedules available',
              message:
                  'Your medication schedules will appear here when available.',
            )
          else
            ..._schedules.whereType<Map<String, dynamic>>().map(_scheduleCard),
          _errorBanner(),
        ],
      ),
    );
  }

  Widget _prescriptionsPage() {
    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        children: [
          _pageHeading(
            'Prescriptions',
            subtitle: 'Treatment information from your doctor',
            trailing: _countBadge('${_prescriptions.length}'),
          ),
          if (_prescriptions.isEmpty)
            _emptyState(
              icon: Icons.description_outlined,
              title: 'No prescriptions yet',
              message:
                  'Your prescriptions will appear here when they are available.',
            )
          else
            ..._prescriptions.whereType<Map<String, dynamic>>().map(
              _prescriptionCard,
            ),
          _errorBanner(),
        ],
      ),
    );
  }

  Widget _errorBanner() {
    if (_errorMessage == null || _profile == null) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(top: 18),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.warning_amber_rounded,
            color: Theme.of(context).colorScheme.onErrorContainer,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _errorMessage!,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onErrorContainer,
              ),
            ),
          ),
          IconButton(
            tooltip: 'Retry loading dashboard data',
            onPressed: _loadDashboard,
            icon: const Icon(Icons.refresh),
            color: Theme.of(context).colorScheme.onErrorContainer,
          ),
        ],
      ),
    );
  }

  Widget _medicationCard(Map<String, dynamic> medication) {
    final schedules = medication['schedules'] is List
        ? medication['schedules'] as List
        : <dynamic>[];

    final details =
        [medication['dosage'], medication['strength'], medication['form']]
            .where(
              (value) => value != null && value.toString().trim().isNotEmpty,
            )
            .join(' · ');

    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: _surfaceCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 49,
                  height: 49,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEDF3FF),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: const Icon(
                    Icons.medication_outlined,
                    color: _brandBlue,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _display(medication['name'], fallback: 'Medication'),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        details.isEmpty ? 'Dosage not provided' : details,
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: _muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if ((medication['instructions'] ?? '')
                .toString()
                .trim()
                .isNotEmpty) ...[
              const SizedBox(height: 15),
              _detailLine(
                Icons.info_outline,
                'Instructions',
                medication['instructions'].toString(),
              ),
            ],
            if ((medication['notes'] ?? '').toString().trim().isNotEmpty) ...[
              const SizedBox(height: 9),
              _detailLine(
                Icons.notes_outlined,
                'Notes',
                medication['notes'].toString(),
              ),
            ],
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Divider(height: 1),
            ),
            Row(
              children: [
                Icon(Icons.schedule_outlined, size: 19, color: _muted),
                const SizedBox(width: 9),
                const Expanded(
                  child: Text(
                    'Medication schedules',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                _countBadge('${schedules.length}'),
              ],
            ),
            if (schedules.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  'No schedule available for this medication.',
                  style: TextStyle(color: _muted, fontSize: 13),
                ),
              )
            else
              ...schedules.map((schedule) {
                if (schedule is! Map<String, dynamic>) {
                  return const SizedBox.shrink();
                }

                return Container(
                  margin: const EdgeInsets.only(top: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _background,
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.access_time_rounded, color: _brandBlue),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _display(
                                schedule['time'],
                                fallback: 'Time not set',
                              ),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${_display(schedule['frequency'], fallback: 'Frequency not set')}'
                              ' · ${_display(schedule['dosage'], fallback: 'Dosage not set')}',
                              style: TextStyle(color: _muted, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _prescriptionCard(Map<String, dynamic> prescription) {
    final medication = prescription['medication'];
    final medicationName = medication is Map<String, dynamic>
        ? medication['name']
        : null;

    final startDate = _date(prescription['startDate']);
    final endDate = prescription['endDate'] == null
        ? 'No end date'
        : _date(prescription['endDate']);

    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: _surfaceCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 47,
                  height: 47,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEDF3FF),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.description_outlined,
                    color: _brandBlue,
                    size: 25,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _display(medicationName, fallback: 'Medication'),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            _detailLine(
              Icons.medication_outlined,
              'Prescribed dose',
              _display(prescription['dose']),
            ),
            const SizedBox(height: 12),
            _detailLine(
              Icons.repeat_rounded,
              'Frequency',
              _display(prescription['frequency']),
            ),
            const SizedBox(height: 12),
            _detailLine(Icons.event_outlined, 'Start date', startDate),
            const SizedBox(height: 12),
            _detailLine(Icons.event_available_outlined, 'End date', endDate),
            if ((prescription['instructions'] ?? '')
                .toString()
                .trim()
                .isNotEmpty) ...[
              const SizedBox(height: 12),
              _detailLine(
                Icons.info_outline,
                'Instructions',
                prescription['instructions'].toString(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _scheduleCard(Map<String, dynamic> schedule) {
    final medication = schedule['medication'];
    final medicationName = medication is Map<String, dynamic>
        ? medication['name']
        : null;

    final scheduleId = schedule['id']?.toString() ?? '';
    final isSubmitting = _submittingScheduleIds.contains(scheduleId);

    final doseLogs = schedule['doseLogs'];
    final today = DateTime.now().toUtc();

    final todayDoseLog = doseLogs is List
        ? doseLogs.whereType<Map<String, dynamic>>().where((log) {
            final rawDate = log['scheduledDate'];
            if (rawDate == null) return false;

            final scheduledDate = DateTime.tryParse(rawDate.toString());
            if (scheduledDate == null) return false;

            final utcDate = scheduledDate.toUtc();

            return utcDate.year == today.year &&
                utcDate.month == today.month &&
                utcDate.day == today.day;
          }).firstOrNull
        : null;

    final doseStatus = todayDoseLog?['status']?.toString();
    final doseAlreadyRecorded =
        doseStatus == 'TAKEN' || doseStatus == 'NOT_TAKEN';
    final isTaken = doseStatus == 'TAKEN';
    final statusColor = isTaken
        ? const Color(0xFF16846B)
        : const Color(0xFFC47728);

    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: _surfaceCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEDF3FF),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: const Icon(
                    Icons.alarm_rounded,
                    color: _brandBlue,
                    size: 25,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _display(medicationName, fallback: 'Medication'),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        '${_display(schedule['time'], fallback: 'Time not set')}'
                        ' · ${_display(schedule['frequency'], fallback: 'Frequency not set')}',
                        style: TextStyle(color: _muted, fontSize: 12),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        _display(
                          schedule['dosage'],
                          fallback: 'Dosage not set',
                        ),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 17),
            if (doseAlreadyRecorded)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(13),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.09),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Row(
                  children: [
                    Icon(
                      isTaken
                          ? Icons.check_circle_rounded
                          : Icons.info_outline_rounded,
                      color: statusColor,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        isTaken
                            ? 'Dose confirmed as taken today.'
                            : 'Dose confirmed as not taken today.',
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              )
            else
              LayoutBuilder(
                builder: (context, constraints) {
                  final takenButton = FilledButton.icon(
                    onPressed: isSubmitting
                        ? null
                        : () => _recordDose(schedule, 'TAKEN'),
                    icon: const Icon(Icons.check_rounded),
                    label: const Text('Mark taken'),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(0, 48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(13),
                      ),
                    ),
                  );

                  final notTakenButton = OutlinedButton.icon(
                    onPressed: isSubmitting
                        ? null
                        : () => _recordDose(schedule, 'NOT_TAKEN'),
                    icon: const Icon(Icons.close_rounded),
                    label: const Text('Not taken'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(13),
                      ),
                    ),
                  );

                  if (constraints.maxWidth < 350) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        takenButton,
                        const SizedBox(height: 10),
                        notTakenButton,
                      ],
                    );
                  }

                  return Row(
                    children: [
                      Expanded(child: takenButton),
                      const SizedBox(width: 10),
                      Expanded(child: notTakenButton),
                    ],
                  );
                },
              ),
            if (isSubmitting) ...[
              const SizedBox(height: 13),
              const LinearProgressIndicator(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _loadingView() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 18),
          Text('Getting your health information ready...'),
        ],
      ),
    );
  }

  Widget _fatalErrorView() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(26),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(19),
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.errorContainer.withValues(alpha: 0.7),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.cloud_off_outlined,
                size: 40,
                color: Theme.of(context).colorScheme.error,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'We couldn’t load your dashboard',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 9),
            Text(
              _errorMessage ?? 'Something went wrong. Please try again.',
              textAlign: TextAlign.center,
              style: TextStyle(color: _muted, height: 1.5),
            ),
            const SizedBox(height: 22),
            FilledButton.icon(
              onPressed: _loadDashboard,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
          ],
        ),
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
    final titles = ['Home', 'Medications', 'Schedule', 'Prescriptions'];

    final pages = [
      _homePage(),
      _medicationsPage(),
      _schedulesPage(),
      _prescriptionsPage(),
    ];

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        backgroundColor: _background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: false,
        titleSpacing: 20,
        title: Row(
          children: [
            Container(
              width: 39,
              height: 39,
              decoration: BoxDecoration(
                color: const Color(0xFFEDF3FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.health_and_safety_rounded,
                color: _brandBlue,
                size: 24,
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AstaWashe',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: _brandBlueDark,
                    fontSize: 19,
                  ),
                ),
                Text(
                  titles[_selectedIndex],
                  style: TextStyle(color: _muted, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _isLoading ? null : _loadDashboard,
            icon: const Icon(Icons.refresh_rounded),
          ),
          _profileButton(),
        ],
      ),
      body: _isLoading
          ? _loadingView()
          : _errorMessage != null && _profile == null
          ? _fatalErrorView()
          : IndexedStack(index: _selectedIndex, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() => _selectedIndex = index);
        },
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        indicatorColor: const Color(0xFFDFEAFE),
        elevation: 0,
        height: 70,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.medication_outlined),
            selectedIcon: Icon(Icons.medication_rounded),
            label: 'Medications',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month_rounded),
            label: 'Schedule',
          ),
          NavigationDestination(
            icon: Icon(Icons.description_outlined),
            selectedIcon: Icon(Icons.description_rounded),
            label: 'Prescriptions',
          ),
        ],
      ),
    );
  }
}

class PatientProfileScreen extends StatelessWidget {
  final Map<String, dynamic> profile;
  final AuthSession session;
  final VoidCallback onLogout;

  const PatientProfileScreen({
    super.key,
    required this.profile,
    required this.session,
    required this.onLogout,
  });

  static const Color _brandBlue = Color(0xFF2458A6);
  static const Color _background = Color(0xFFF6F8FC);

  String _display(dynamic value) {
    if (value == null || value.toString().trim().isEmpty) {
      return 'Not provided';
    }
    return value.toString();
  }

  String _date(dynamic value) {
    if (value == null) return 'Not provided';
    final text = value.toString();
    return text.contains('T') ? text.split('T').first : text;
  }

  Widget _profileField(
    BuildContext context,
    String label,
    dynamic value,
    IconData icon,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 11),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE9EDF4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFEDF3FF),
              borderRadius: BorderRadius.circular(13),
            ),
            child: Icon(icon, color: _brandBlue),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF758196),
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  _display(value),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context) async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text(
          'Are you sure you want to log out of your AstaWashe account?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Log out'),
          ),
        ],
      ),
    );

    if (shouldLogout == true && context.mounted) {
      onLogout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _display(profile['fullName'] ?? session.displayName);

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        backgroundColor: _background,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'My profile',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(23),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [_brandBlue, Color(0xFF173E72)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              children: [
                Container(
                  width: 82,
                  height: 82,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.16),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.45),
                      width: 2,
                    ),
                  ),
                  child: const Icon(
                    Icons.person_rounded,
                    size: 43,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  name,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  'Patient account',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.85)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 27),
          Text(
            'Personal information',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 14),
          _profileField(
            context,
            'Full name',
            profile['fullName'],
            Icons.person_outline_rounded,
          ),
          _profileField(
            context,
            'Phone number',
            profile['phone'],
            Icons.phone_outlined,
          ),
          _profileField(
            context,
            'Date of birth',
            _date(profile['dob']),
            Icons.cake_outlined,
          ),
          _profileField(
            context,
            'Gender',
            profile['gender'],
            Icons.wc_outlined,
          ),
          _profileField(
            context,
            'Address',
            profile['address'],
            Icons.location_on_outlined,
          ),
          const SizedBox(height: 16),
          Text(
            'Health information',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 14),
          _profileField(
            context,
            'Medical history',
            profile['medicalHistory'],
            Icons.history_edu_outlined,
          ),
          _profileField(
            context,
            'Case description',
            profile['caseDescription'],
            Icons.description_outlined,
          ),
          _profileField(
            context,
            'Reminder mode',
            profile['reminderMode'],
            Icons.notifications_active_outlined,
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: () => _confirmLogout(context),
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Log out'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFB42318),
              side: const BorderSide(color: Color(0xFFE8B4B0)),
              minimumSize: const Size.fromHeight(54),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Center(
            child: Text(
              'AstaWashe · Smart Healthcare Starts With Every Dose',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF8993A4), fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }
}
