import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../data/assistant_repository.dart';

class AssistantScreen extends StatefulWidget {
  const AssistantScreen({super.key});

  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  final _repository = AssistantRepository();
  final _speech = stt.SpeechToText();
  final _tts = FlutterTts();
  final _input = TextEditingController();
  final List<_Message> _messages = [
    const _Message(
      fromAssistant: true,
      text:
          'Hello. Ask me about medication schedules and general health guidance. For emergencies, contact your care team or local emergency services.',
    ),
  ];
  bool _loading = false;
  bool _listening = false;
  String? _error;

  @override
  void dispose() {
    _input.dispose();
    _speech.cancel();
    _tts.stop();
    super.dispose();
  }

  Future<void> _send([String? value]) async {
    final text = (value ?? _input.text).trim();
    if (text.isEmpty || _loading) return;
    setState(() {
      _messages.add(_Message(fromAssistant: false, text: text));
      _input.clear();
      _loading = true;
      _error = null;
    });
    try {
      final reply = await _repository.ask(text);
      if (!mounted) return;
      setState(
        () => _messages.add(_Message(fromAssistant: true, text: reply.text)),
      );
      await _tts.speak(reply.text);
    } catch (error) {
      if (mounted) setState(() => _error = 'AI service unavailable: $error');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleListening() async {
    if (_listening) {
      await _speech.stop();
      if (mounted) setState(() => _listening = false);
      return;
    }
    final available = await _speech.initialize(
      onStatus: (status) {
        if (status == 'done' && mounted) setState(() => _listening = false);
      },
      onError: (error) {
        if (mounted) {
          setState(() {
            _listening = false;
            _error = error.errorMsg;
          });
        }
      },
    );
    if (!available) {
      if (mounted) {
        setState(
          () => _error =
              'Speech recognition is unavailable or microphone permission was denied.',
        );
      }
      return;
    }
    setState(() => _listening = true);
    await _speech.listen(
      onResult: (result) {
        if (!mounted) return;
        setState(() => _input.text = result.recognizedWords);
        if (result.finalResult) {
          setState(() => _listening = false);
          _send(result.recognizedWords);
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AstaWashe AI')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return Align(
                  alignment: message.fromAssistant
                      ? Alignment.centerLeft
                      : Alignment.centerRight,
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 320),
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: message.fromAssistant
                          ? Colors.white
                          : Theme.of(context).colorScheme.primary,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      message.text,
                      style: TextStyle(
                        color: message.fromAssistant ? null : Colors.white,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_loading) const LinearProgressIndicator(),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  IconButton(
                    onPressed: _toggleListening,
                    tooltip: _listening ? 'Stop voice input' : 'Speak',
                    icon: Icon(_listening ? Icons.mic : Icons.mic_none),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _input,
                      minLines: 1,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Ask a health question',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _loading ? null : _send,
                    icon: const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Message {
  const _Message({required this.fromAssistant, required this.text});
  final bool fromAssistant;
  final String text;
}
