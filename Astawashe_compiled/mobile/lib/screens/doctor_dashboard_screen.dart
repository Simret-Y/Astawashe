import 'package:flutter/material.dart';

import '../models/auth_session.dart';

class DoctorDashboardScreen extends StatelessWidget {
  final AuthSession session;

  const DoctorDashboardScreen({super.key, required this.session});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Doctor Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome, ${session.displayName}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            const Text('AstaWashe healthcare workspace'),
            const SizedBox(height: 24),
            const Card(
              child: ListTile(
                leading: Icon(Icons.people_outline),
                title: Text('Patients'),
                subtitle: Text('Patient management will appear here.'),
              ),
            ),
            const Card(
              child: ListTile(
                leading: Icon(Icons.medication_outlined),
                title: Text('Medication oversight'),
                subtitle: Text('Medication oversight will appear here.'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
