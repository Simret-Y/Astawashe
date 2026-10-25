import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

import '../../assistant/presentation/assistant_screen.dart';
import '../../auth/data/auth_repository.dart';
import '../../notifications/data/reminder_notification_service.dart';
import '../data/patient_repository.dart';

class PatientHomeScreen extends StatefulWidget {
  const PatientHomeScreen({
    required this.user,
    required this.repository,
    required this.onSignOut,
    super.key,
  });

  final AuthUser user;
  final PatientRepository repository;
  final VoidCallback onSignOut;

  @override
  State<PatientHomeScreen> createState() => _PatientHomeScreenState();
}

class _PatientHomeScreenState extends State<PatientHomeScreen> {
  Map<String, dynamic>? _dashboard;
  bool _loading = true;
  String? _error;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final dashboard = await widget.repository.loadDashboard();
      if (mounted) setState(() => _dashboard = dashboard);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _map(dynamic value) =>
      value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};
  List<Map<String, dynamic>> _list(dynamic value) => value is List
      ? value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : const [];

  List<Map<String, dynamic>> get _schedules {
    final today = _map(_dashboard?['today']);
    return _list(today['schedules']);
  }

  Future<void> _recordDose(Map<String, dynamic> schedule, String status) async {
    try {
      await widget.repository.recordDose(
        scheduleId: (schedule['id'] ?? '').toString(),
        status: status,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Dose recorded: ${status.toLowerCase().replaceAll('_', ' ')}',
            ),
          ),
        );
        _load();
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  Future<void> _triggerReminder() async {
    try {
      final data = await widget.repository.triggerDemoReminder(
        patientId: _map(_dashboard?['patient'])['id']?.toString(),
      );
      final scheduleId = (data['scheduleId'] ?? '').toString();
      final patientId =
          (data['patientId'] ?? _map(_dashboard?['patient'])['id'] ?? '')
              .toString();
      final medication = (data['medicationName'] ?? 'your medication')
          .toString();
      final time = (data['time'] ?? '').toString();
      await ReminderNotificationService.instance.showMedicationReminder(
        title: 'Medication reminder',
        body: '$medication${time.isEmpty ? '' : ' · $time'}',
      );
      final tts = FlutterTts();
      await tts.setLanguage('en-US');
      await tts.speak(
        'Reminder: take $medication ${time.isEmpty ? '' : 'at $time'}. Have you taken it?',
      );
      if (!mounted) return;
      final response = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Medication reminder'),
          content: Text(
            '$medication${time.isEmpty ? '' : ' · $time'}\n\nDid you take this dose?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, '2'),
              child: const Text('Not yet'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, '1'),
              child: const Text('Taken'),
            ),
          ],
        ),
      );
      if (response != null && scheduleId.isNotEmpty && patientId.isNotEmpty) {
        await widget.repository.respondToDemoReminder(
          patientId: patientId,
          scheduleId: scheduleId,
          response: response,
        );
        if (response == '1') await _load();
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final patient = _map(_dashboard?['patient']);
    final doctor = _map(_dashboard?['doctor']);
    final today = _map(_dashboard?['today']);
    final week = _map(_dashboard?['recentWeek']);
    final schedules = _schedules;
    final taken = schedules
        .where(
          (item) =>
              (item['doseStatus'] ?? '').toString().toUpperCase() == 'TAKEN',
        )
        .length;
    final missed = schedules
        .where(
          (item) =>
              (item['doseStatus'] ?? '').toString().toUpperCase() == 'MISSED',
        )
        .length;
    final body = _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
        ? _ErrorState(message: _error!, onRetry: _load)
        : IndexedStack(
            index: _tab,
            children: [
              _overview(context, patient, today, schedules, taken, missed),
              _schedule(context, schedules),
              _careTeam(context, doctor, _list(_dashboard?['guardians'])),
              _progress(context, week),
            ],
          );

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Hello, ${(patient['nickname'] ?? patient['fullName'] ?? widget.user.fullName).toString().split(' ').first}',
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
          IconButton(
            tooltip: 'Sign out',
            onPressed: widget.onSignOut,
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: body,
      floatingActionButton: _error == null && !_loading && _tab == 0
          ? FloatingActionButton.extended(
              onPressed: _triggerReminder,
              icon: const Icon(Icons.notifications_active_outlined),
              label: const Text('Reminder demo'),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.space_dashboard_outlined),
            selectedIcon: Icon(Icons.space_dashboard),
            label: 'Today',
          ),
          NavigationDestination(
            icon: Icon(Icons.medication_outlined),
            selectedIcon: Icon(Icons.medication),
            label: 'Schedule',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Care team',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights),
            label: 'Progress',
          ),
        ],
      ),
    );
  }

  Widget _overview(
    BuildContext context,
    Map<String, dynamic> patient,
    Map<String, dynamic> today,
    List<Map<String, dynamic>> schedules,
    int taken,
    int missed,
  ) {
    final adherence = (today['adherenceRate'] as num?)?.toDouble() ?? 0;
    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).colorScheme.primary,
                const Color(0xFF06B6D4),
              ],
            ),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.favorite_rounded, color: Colors.white),
              const SizedBox(height: 16),
              Text(
                'Today’s adherence',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: Colors.white70),
              ),
              Text(
                '${adherence.toStringAsFixed(0)}%',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                '$taken taken · $missed missed · ${schedules.length - taken - missed} remaining',
                style: const TextStyle(color: Colors.white),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                label: 'Today’s doses',
                value: '${schedules.length}',
                icon: Icons.medication_outlined,
              ),
            ),
            Expanded(
              child: _MetricCard(
                label: 'Reminder mode',
                value: (patient['reminderMode'] ?? 'VOICE').toString(),
                icon: Icons.notifications_active_outlined,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Today’s schedule',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            TextButton(
              onPressed: () => setState(() => _tab = 1),
              child: const Text('View all'),
            ),
          ],
        ),
        if (schedules.isEmpty)
          const _EmptyState(
            message: 'No active medication schedules were returned.',
          ),
        ...schedules
            .take(4)
            .map(
              (schedule) => _ScheduleTile(
                schedule: schedule,
                onTaken: () => _recordDose(schedule, 'TAKEN'),
                onMissed: () => _recordDose(schedule, 'MISSED'),
              ),
            ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AssistantScreen()),
          ),
          icon: const Icon(Icons.smart_toy_outlined),
          label: const Text('Ask AstaWashe AI'),
        ),
      ],
    );
  }

  Widget _schedule(
    BuildContext context,
    List<Map<String, dynamic>> schedules,
  ) => ListView(
    padding: const EdgeInsets.all(18),
    children: [
      Text(
        'Medication schedule',
        style: Theme.of(context).textTheme.titleLarge,
      ),
      const SizedBox(height: 12),
      if (schedules.isEmpty)
        const _EmptyState(
          message: 'Your care team has not added an active schedule yet.',
        ),
      ...schedules.map(
        (schedule) => _ScheduleTile(
          schedule: schedule,
          onTaken: () => _recordDose(schedule, 'TAKEN'),
          onMissed: () => _recordDose(schedule, 'MISSED'),
        ),
      ),
    ],
  );

  Widget _careTeam(
    BuildContext context,
    Map<String, dynamic> doctor,
    List<Map<String, dynamic>> guardians,
  ) => ListView(
    padding: const EdgeInsets.all(18),
    children: [
      Text('Your care team', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 12),
      if (doctor.isEmpty)
        const _EmptyState(message: 'Doctor details are not available.'),
      if (doctor.isNotEmpty)
        Card(
          child: ListTile(
            leading: const CircleAvatar(
              child: Icon(Icons.medical_services_outlined),
            ),
            title: Text((doctor['name'] ?? 'Doctor').toString()),
            subtitle: Text(
              (doctor['specialization'] ?? doctor['email'] ?? 'Assigned doctor')
                  .toString(),
            ),
          ),
        ),
      const SizedBox(height: 12),
      Text('Guardians', style: Theme.of(context).textTheme.titleMedium),
      if (guardians.isEmpty)
        const _EmptyState(message: 'No guardians are linked to your profile.'),
      ...guardians.map(
        (guardian) => Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person_outline)),
            title: Text((guardian['name'] ?? 'Guardian').toString()),
            subtitle: Text(
              '${guardian['relationship'] ?? 'Contact'} · ${guardian['phone'] ?? ''}',
            ),
          ),
        ),
      ),
    ],
  );

  Widget _progress(BuildContext context, Map<String, dynamic> week) {
    final stats = _map(week['stats']);
    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        Text('Weekly progress', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 14),
        _MetricCard(
          label: 'Weekly adherence',
          value: '${week['adherenceRate'] ?? 0}%',
          icon: Icons.trending_up_rounded,
        ),
        const SizedBox(height: 10),
        _MetricCard(
          label: 'Doses tracked',
          value: '${week['totalDoses'] ?? 0}',
          icon: Icons.calendar_month_outlined,
        ),
        const SizedBox(height: 10),
        _MetricCard(
          label: 'Taken',
          value: '${stats['taken'] ?? 0}',
          icon: Icons.check_circle_outline,
        ),
        const SizedBox(height: 10),
        _MetricCard(
          label: 'Missed',
          value: '${stats['missed'] ?? 0}',
          icon: Icons.warning_amber_outlined,
        ),
      ],
    );
  }
}

class _ScheduleTile extends StatelessWidget {
  const _ScheduleTile({
    required this.schedule,
    required this.onTaken,
    required this.onMissed,
  });
  final Map<String, dynamic> schedule;
  final VoidCallback onTaken;
  final VoidCallback onMissed;

  @override
  Widget build(BuildContext context) {
    final medication = schedule['medication'];
    final medicine = medication is Map
        ? Map<String, dynamic>.from(medication)
        : <String, dynamic>{};
    final name =
        (medicine['name'] ?? schedule['medicationName'] ?? 'Medication')
            .toString();
    final status = (schedule['doseStatus'] ?? 'PENDING')
        .toString()
        .toUpperCase();
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(
                child: Icon(Icons.medication_outlined),
              ),
              title: Text(name),
              subtitle: Text(
                '${schedule['dosage'] ?? ''} · ${schedule['time'] ?? ''}',
              ),
              trailing: Chip(label: Text(status.replaceAll('_', ' '))),
            ),
            if (status != 'TAKEN' && status != 'MISSED')
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(onPressed: onMissed, child: const Text('Missed')),
                  const SizedBox(width: 8),
                  FilledButton.tonal(
                    onPressed: onTaken,
                    child: const Text('Taken'),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
  });
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(value, style: Theme.of(context).textTheme.titleLarge),
      subtitle: Text(label),
    ),
  );
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 22),
    child: Center(child: Text(message, textAlign: TextAlign.center)),
  );
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off_outlined, size: 48),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          FilledButton(onPressed: onRetry, child: const Text('Try again')),
        ],
      ),
    ),
  );
}
