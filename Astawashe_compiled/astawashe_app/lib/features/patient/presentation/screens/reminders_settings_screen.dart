import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class RemindersSettingsScreen extends StatefulWidget {
  const RemindersSettingsScreen({super.key});

  @override
  State<RemindersSettingsScreen> createState() =>
      _RemindersSettingsScreenState();
}

class _RemindersSettingsScreenState extends State<RemindersSettingsScreen> {
  bool _voiceCallEnabled = true;
  bool _pushEnabled = true;
  bool _smsEnabled = false;
  String _selectedLeadTime = 'At scheduled time';
  String _selectedLanguage = 'English';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Reminder Settings')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            const Text(
              'Delivery Channels',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text(
                      'Voice / TTS Calls',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: const Text(
                      'Spoken audio alert in chosen language',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: _voiceCallEnabled,
                    activeThumbColor: AppColors.primary,
                    onChanged: (v) => setState(() => _voiceCallEnabled = v),
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text(
                      'Push Notifications',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: const Text(
                      'Mobile banners with action buttons',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: _pushEnabled,
                    activeThumbColor: AppColors.primary,
                    onChanged: (v) => setState(() => _pushEnabled = v),
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text(
                      'SMS Reminders',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: const Text(
                      'Offline SMS delivery via Ethio Telecom',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: _smsEnabled,
                    activeThumbColor: AppColors.primary,
                    onChanged: (v) => setState(() => _smsEnabled = v),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Notification Timing',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedLeadTime,
                  isExpanded: true,
                  items:
                      [
                            'At scheduled time',
                            '5 minutes before',
                            '10 minutes before',
                            '15 minutes before',
                          ]
                          .map(
                            (s) => DropdownMenuItem(value: s, child: Text(s)),
                          )
                          .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedLeadTime = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Spoken Voice Language',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedLanguage,
                  isExpanded: true,
                  items: ['English', 'አማርኛ (Amharic)']
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedLanguage = val);
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
