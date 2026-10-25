import 'package:flutter/material.dart';

import '../../assistant/presentation/assistant_screen.dart';
import '../../auth/data/auth_repository.dart';
import '../data/doctor_repository.dart';

class DoctorHomeScreen extends StatefulWidget {
  const DoctorHomeScreen({
    required this.user,
    required this.repository,
    required this.onSignOut,
    super.key,
  });

  final AuthUser user;
  final DoctorRepository repository;
  final VoidCallback onSignOut;

  @override
  State<DoctorHomeScreen> createState() => _DoctorHomeScreenState();
}

class _DoctorHomeScreenState extends State<DoctorHomeScreen> {
  Map<String, dynamic> _dashboard = {};
  List<Map<String, dynamic>> _pending = [];
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
      final results = await Future.wait([
        widget.repository.loadDashboard(),
        widget.repository.loadPendingPatients(),
      ]);
      if (mounted) {
        setState(() {
          _dashboard = results[0] as Map<String, dynamic>;
          _pending = results[1] as List<Map<String, dynamic>>;
        });
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<String?> _askNickname(String name) async {
    final controller = TextEditingController(text: name.split(' ').first);
    final value = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Approve patient'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Patient nickname (required)',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Approve'),
          ),
        ],
      ),
    );
    controller.dispose();
    return value;
  }

  Future<void> _review(Map<String, dynamic> patient, String action) async {
    final name = (patient['fullName'] ?? patient['name'] ?? 'Patient')
        .toString();
    final nickname = action == 'APPROVE' ? await _askNickname(name) : null;
    if (action == 'APPROVE' && (nickname == null || nickname.isEmpty)) return;
    final id = (patient['id'] ?? patient['patientId'] ?? '').toString();
    if (id.isEmpty) return;
    try {
      await widget.repository.reviewPatient(
        patientId: id,
        action: action,
        nickname: nickname,
      );
      await _load();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  Map<String, dynamic> _map(dynamic value) =>
      value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};
  List<Map<String, dynamic>> _list(dynamic value) => value is List
      ? value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : const [];

  @override
  Widget build(BuildContext context) {
    final doctor = _map(_dashboard['doctor']);
    final stats = _map(_dashboard['stats']);
    final patients = _list(_dashboard['patients']);
    final risks = _list(_dashboard['riskPatients']);
    final name = (doctor['name'] ?? widget.user.fullName ?? 'Doctor')
        .toString();
    return Scaffold(
      appBar: AppBar(
        title: Text('Dr. $name'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
          IconButton(
            onPressed: widget.onSignOut,
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    FilledButton(onPressed: _load, child: const Text('Retry')),
                  ],
                ),
              ),
            )
          : IndexedStack(
              index: _tab,
              children: [
                _overview(context, stats, patients, risks),
                _patientList(context, patients),
                _requests(context),
              ],
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (value) => setState(() => _tab = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.space_dashboard_outlined),
            selectedIcon: Icon(Icons.space_dashboard),
            label: 'Overview',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Patients',
          ),
          NavigationDestination(
            icon: Icon(Icons.pending_actions_outlined),
            selectedIcon: Icon(Icons.pending_actions),
            label: 'Requests',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AssistantScreen()),
        ),
        icon: const Icon(Icons.smart_toy_outlined),
        label: const Text('Assistant'),
      ),
    );
  }

  Widget _overview(
    BuildContext context,
    Map<String, dynamic> stats,
    List<Map<String, dynamic>> patients,
    List<Map<String, dynamic>> risks,
  ) => ListView(
    padding: const EdgeInsets.all(18),
    children: [
      Text('Care overview', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 12),
      Row(
        children: [
          Expanded(
            child: _MetricCard(
              label: 'Total patients',
              value: '${stats['totalPatients'] ?? patients.length}',
              icon: Icons.people_alt_outlined,
            ),
          ),
          Expanded(
            child: _MetricCard(
              label: 'Active',
              value: '${stats['activePatients'] ?? 0}',
              icon: Icons.verified_outlined,
            ),
          ),
        ],
      ),
      Row(
        children: [
          Expanded(
            child: _MetricCard(
              label: 'Pending',
              value: '${stats['pendingPatients'] ?? _pending.length}',
              icon: Icons.pending_actions_outlined,
            ),
          ),
          Expanded(
            child: _MetricCard(
              label: 'High risk',
              value: '${stats['highRiskPatients'] ?? risks.length}',
              icon: Icons.warning_amber_outlined,
            ),
          ),
        ],
      ),
      _MetricCard(
        label: 'Average adherence',
        value: '${_dashboard['averageAdherence'] ?? 0}%',
        icon: Icons.trending_up_rounded,
      ),
      const SizedBox(height: 16),
      Text(
        'Patients to monitor',
        style: Theme.of(context).textTheme.titleMedium,
      ),
      if (risks.isEmpty)
        const _Empty(message: 'No high-risk patients reported.'),
      ...risks
          .take(5)
          .map((patient) => _PatientCard(patient: patient, highRisk: true)),
    ],
  );

  Widget _patientList(
    BuildContext context,
    List<Map<String, dynamic>> patients,
  ) => ListView(
    padding: const EdgeInsets.all(18),
    children: [
      Text('Patients', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 12),
      if (patients.isEmpty) const _Empty(message: 'No patients assigned yet.'),
      ...patients.map((patient) => _PatientCard(patient: patient)),
    ],
  );

  Widget _requests(BuildContext context) => ListView(
    padding: const EdgeInsets.all(18),
    children: [
      Text(
        'Pending patient approvals',
        style: Theme.of(context).textTheme.titleLarge,
      ),
      const SizedBox(height: 12),
      if (_pending.isEmpty)
        const _Empty(message: 'No pending patient requests.'),
      ..._pending.map(
        (patient) => Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    child: Icon(Icons.person_outline),
                  ),
                  title: Text((patient['fullName'] ?? 'Patient').toString()),
                  subtitle: Text(
                    (patient['email'] ??
                            patient['phone'] ??
                            'Registration request')
                        .toString(),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => _review(patient, 'REJECT'),
                      child: const Text('Reject'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () => _review(patient, 'APPROVE'),
                      child: const Text('Approve'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ],
  );
}

class _PatientCard extends StatelessWidget {
  const _PatientCard({required this.patient, this.highRisk = false});
  final Map<String, dynamic> patient;
  final bool highRisk;

  @override
  Widget build(BuildContext context) {
    final name = (patient['nickname'] ?? patient['fullName'] ?? 'Patient')
        .toString();
    final adherence = (patient['adherenceToday'] ?? 0).toString();
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: CircleAvatar(
          child: Text(name.isEmpty ? '?' : name[0].toUpperCase()),
        ),
        title: Text(name),
        subtitle: Text(
          '$adherence% adherence · ${patient['medicationCount'] ?? 0} medications',
        ),
        trailing: Chip(
          label: Text(
            highRisk
                ? 'Monitor'
                : (patient['reminderMode'] ?? 'VOICE').toString(),
          ),
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

class _Empty extends StatelessWidget {
  const _Empty({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(24),
    child: Text(message, textAlign: TextAlign.center),
  );
}
