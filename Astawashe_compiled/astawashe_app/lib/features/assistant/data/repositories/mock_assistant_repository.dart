import '../../domain/models/assistant_models.dart';
import '../../domain/repositories/assistant_repository.dart';

class MockAssistantRepository implements AssistantRepository {
  @override
  Future<List<String>> getSuggestedQuestions() async {
    return [
      'What is this medicine for?',
      'I missed a dose',
      'Can I take it with food?',
      'Any side effects?',
      'How do I notify my doctor?',
    ];
  }

  @override
  Future<ChatMessage> askAssistant(
    String userPrompt, {
    bool isVoiceInput = false,
  }) async {
    await Future.delayed(const Duration(milliseconds: 600));

    final prompt = userPrompt.toLowerCase();
    String answer;

    if (prompt.contains('what is this medicine for') ||
        prompt.contains('medicine for') ||
        prompt.contains('paracetamol')) {
      answer =
          'Paracetamol 500mg is an analgesic and antipyretic medication prescribed for mild to moderate pain relief and fever management. Take 1 tablet as directed by your physician.';
    } else if (prompt.contains('missed') || prompt.contains('missed a dose')) {
      answer =
          'If you missed a scheduled dose, take it as soon as you remember. However, if it is almost time for your next scheduled dose, skip the missed one. Never take two doses at the same time. If you have missed 3 consecutive doses, your guardian and Dr. Ahmed will be notified.';
    } else if (prompt.contains('food') ||
        prompt.contains('eat') ||
        prompt.contains('meal')) {
      answer =
          'Paracetamol and Vitamin D should generally be taken after meals with a glass of water. Metformin is also best taken with food or immediately after dinner to minimize stomach upset.';
    } else if (prompt.contains('side effect') ||
        prompt.contains('side effects')) {
      answer =
          'Common mild effects include mild stomach upset or drowsiness. If you experience severe symptoms such as a skin rash, shortness of breath, or persistent dizziness, tap "Emergency Contacts" or reach out to Dr. Ahmed immediately.';
    } else if (prompt.contains('doctor') || prompt.contains('contact')) {
      answer =
          'You can message Dr. Ahmed directly through the Care Team tab or the Messages screen. In case of an emergency, call Tikur Anbessa Hospital hotline directly.';
    } else {
      answer =
          'I am your AstaWashe health assistant. I can help answer questions regarding your scheduled doses, medication instructions, and adherence. How can I assist you further today?';
    }

    return ChatMessage(
      id: 'ai-${DateTime.now().millisecondsSinceEpoch}',
      text: answer,
      isUser: false,
      timestamp: DateTime.now(),
      isVoiceInput: isVoiceInput,
    );
  }
}
