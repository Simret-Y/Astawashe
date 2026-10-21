import 'package:flutter/material.dart';

import '../models/auth_session.dart';

class PatientDashboardScreen extends StatelessWidget {
  final AuthSession session;

  const PatientDashboardScreen({super.key, required this.session});

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
            const Text('Smart Healthcare Starts With Every Dose'),
            const SizedBox(height: 24),
            const Card(
              child: ListTile(
                leading: Icon(Icons.medication_outlined),
                title: Text('My medications'),
                subtitle: Text('Your medication information will appear here.'),
              ),
            ),
            const Card(
              child: ListTile(
                leading: Icon(Icons.notifications_outlined),
                title: Text('Reminders'),
                subtitle: Text('Your medication reminders will appear here.'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
