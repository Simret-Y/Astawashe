import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/patient_providers.dart';

class EmergencyContactsScreen extends ConsumerStatefulWidget {
  const EmergencyContactsScreen({super.key});

  @override
  ConsumerState<EmergencyContactsScreen> createState() =>
      _EmergencyContactsScreenState();
}

class _EmergencyContactsScreenState
    extends ConsumerState<EmergencyContactsScreen> {
  final FlutterTts _tts = FlutterTts();

  Future<void> _readAloud({
    required String emergencyContact,
    required String emergencyPhone,
    required String hospitalName,
  }) async {
    final text =
        'Emergency contacts for Ethiopia. National Medical Emergency number is 907. Police Emergency is 911. $hospitalName Emergency is 011 551 1211. Personal family contact is $emergencyContact at $emergencyPhone.';
    await _tts.speak(text);
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dashAsync = ref.watch(patientDashboardProvider);
    final patient = dashAsync.value?.patient;
    final contactName = (patient?.emergencyContact?.isNotEmpty ?? false)
        ? patient!.emergencyContact!
        : 'Designated Family Contact';
    final contactPhone = (patient?.emergencyContactPhone?.isNotEmpty ?? false)
        ? patient!.emergencyContactPhone!
        : '+251 911 887766';
    final hospitalRaw = dashAsync.value?.hospitalName;
    final hospitalName = (hospitalRaw != null && hospitalRaw.isNotEmpty)
        ? hospitalRaw
        : 'Tikur Anbessa Hospital';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Emergency Contacts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.volume_up_rounded, color: AppColors.primary),
            tooltip: 'Read aloud',
            onPressed: () => _readAloud(
              emergencyContact: contactName,
              emergencyPhone: contactPhone,
              hospitalName: hospitalName,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // Read Aloud accessible button banner
            ElevatedButton.icon(
              onPressed: () => _readAloud(
                emergencyContact: contactName,
                emergencyPhone: contactPhone,
                hospitalName: hospitalName,
              ),
              icon: const Icon(Icons.volume_up_rounded),
              label: const Text('Read Aloud Emergency Numbers'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.statusDanger,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
              ),
            ),
            const SizedBox(height: 20),

            _buildContactCard(
              title: 'Ethiopian National Emergency',
              phone: '907',
              subtitle: 'Free ambulance and emergency dispatch across Ethiopia',
              isUrgent: true,
            ),
            const SizedBox(height: 12),

            _buildContactCard(
              title: '$hospitalName ER',
              phone: '+251 11 551 1211',
              subtitle: 'Primary hospital emergency department hotline',
            ),
            const SizedBox(height: 12),

            _buildContactCard(
              title: 'Ethiopian Red Cross Society',
              phone: '907 / 011 551 9364',
              subtitle: 'Ambulance service & first responder assistance',
            ),
            const SizedBox(height: 12),

            _buildContactCard(
              title: 'Personal Contact: $contactName',
              phone: contactPhone,
              subtitle: 'Designated Personal / Emergency Contact',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactCard({
    required String title,
    required String phone,
    required String subtitle,
    bool isUrgent = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isUrgent
              ? AppColors.statusDanger.withAlpha(90)
              : AppColors.border,
          width: isUrgent ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isUrgent
                  ? AppColors.statusDangerBg
                  : AppColors.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.phone_in_talk_rounded,
              color: isUrgent ? AppColors.statusDanger : AppColors.primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  phone,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isUrgent
                        ? AppColors.statusDanger
                        : AppColors.primary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
