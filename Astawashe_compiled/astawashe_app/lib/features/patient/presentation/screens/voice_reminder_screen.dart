import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/patient_providers.dart';

class VoiceReminderScreen extends ConsumerStatefulWidget {
  const VoiceReminderScreen({super.key});

  @override
  ConsumerState<VoiceReminderScreen> createState() =>
      _VoiceReminderScreenState();
}

class _VoiceReminderScreenState extends ConsumerState<VoiceReminderScreen> {
  final FlutterTts _tts = FlutterTts();
  final SpeechToText _speech = SpeechToText();

  bool _isListening = false;
  String _spokenWords = '';
  bool _speechAvailable = false;

  @override
  void initState() {
    super.initState();
    _initAudioAndSpeech();
  }

  Future<void> _initAudioAndSpeech() async {
    try {
      await _tts.setLanguage('en-US');
      await _tts.setPitch(1.0);
      await _tts.setSpeechRate(0.48);

      // Speak reminder prompt
      await Future.delayed(const Duration(milliseconds: 400));
      await _speakPrompt();

      // Initialize speech recognition
      final available = await _speech.initialize(
        onError: (_) => setState(() => _isListening = false),
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            setState(() => _isListening = false);
          }
        },
      );
      if (mounted) {
        setState(() => _speechAvailable = available);
      }
    } catch (_) {
      // Audio fallback
    }
  }

  Future<void> _speakPrompt() async {
    await _tts.speak(
      'Your medication time is here. Please take Paracetamol 500 milligram, one tablet with a glass of water. Say Taken to confirm.',
    );
  }

  Future<void> _toggleListening() async {
    if (!_speechAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Speech input initializing or not available on this platform. Tap buttons to respond.',
          ),
        ),
      );
      return;
    }

    if (_isListening) {
      await _speech.stop();
      setState(() => _isListening = false);
    } else {
      setState(() {
        _isListening = true;
        _spokenWords = '';
      });

      await _speech.listen(
        onResult: (result) {
          setState(() {
            _spokenWords = result.recognizedWords;
          });

          final lower = _spokenWords.toLowerCase();
          if (lower.contains('taken') ||
              lower.contains('take') ||
              lower.contains('yes') ||
              lower.contains('done')) {
            _speech.stop();
            _onTaken();
          } else if (lower.contains('snooze') || lower.contains('later')) {
            _speech.stop();
            _onSnooze();
          }
        },
      );
    }
  }

  void _onTaken() {
    ref.read(todayDosesProvider.notifier).markTaken('dose-today-1');
    _tts.speak('Medication confirmed. Great job!');
    context.pushReplacement('/patient/take-medication');
  }

  void _onSnooze() {
    ref.read(todayDosesProvider.notifier).snoozeDose('dose-today-1');
    _tts.speak('Reminder snoozed for 10 minutes.');
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/patient/home');
    }
  }

  void _onMissed() {
    _tts.speak('Dose marked as missed. Remember to stay on track.');
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/patient/home');
    }
  }

  @override
  void dispose() {
    _tts.stop();
    _speech.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Medication Reminder'),
        actions: [
          IconButton(
            icon: const Icon(Icons.volume_up_rounded, color: AppColors.primary),
            onPressed: _speakPrompt,
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            children: [
              const SizedBox(height: 10),
              // Pill icon & title
              Container(
                width: 76,
                height: 76,
                decoration: const BoxDecoration(
                  color: AppColors.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.medication_rounded,
                  color: AppColors.primary,
                  size: 40,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Time for your medicine!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Paracetamol 500mg • 1 tablet',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Take with water after food',
                style: TextStyle(fontSize: 13, color: AppColors.textMuted),
              ),

              const Spacer(),

              // Speech recognition mic prompt
              GestureDetector(
                onTap: _toggleListening,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: _isListening
                        ? AppColors.primary
                        : AppColors.primaryContainer,
                    shape: BoxShape.circle,
                    boxShadow: _isListening
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withAlpha(100),
                              blurRadius: 24,
                              spreadRadius: 4,
                            ),
                          ]
                        : null,
                  ),
                  child: Icon(
                    _isListening ? Icons.mic : Icons.mic_none_rounded,
                    size: 40,
                    color: _isListening ? Colors.white : AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _isListening
                    ? 'Listening... Say "Taken" or "Snooze"'
                    : 'Tap mic or say "Taken" to confirm',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: _isListening ? AppColors.primary : AppColors.textMuted,
                ),
              ),
              if (_spokenWords.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  '"$_spokenWords"',
                  style: const TextStyle(
                    fontSize: 14,
                    fontStyle: FontStyle.italic,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],

              const Spacer(),

              // Large action buttons
              ElevatedButton.icon(
                onPressed: _onTaken,
                icon: const Icon(Icons.check_circle_rounded, size: 24),
                label: const Text(
                  'Taken Now',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.statusSuccess,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(56),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              OutlinedButton.icon(
                onPressed: _onSnooze,
                icon: const Icon(Icons.snooze_rounded, size: 22),
                label: const Text(
                  'Snooze (10 min)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary, width: 1.5),
                  minimumSize: const Size.fromHeight(54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
              const SizedBox(height: 10),

              TextButton(
                onPressed: _onMissed,
                child: const Text(
                  'Mark as Missed',
                  style: TextStyle(
                    color: AppColors.statusDanger,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }
}
