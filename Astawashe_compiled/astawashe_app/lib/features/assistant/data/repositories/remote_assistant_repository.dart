import 'package:dio/dio.dart';
import '../../../../core/config/app_config.dart';
import '../../domain/models/assistant_models.dart';
import '../../domain/repositories/assistant_repository.dart';
import 'mock_assistant_repository.dart';

class RemoteAssistantRepository implements AssistantRepository {
  final Dio dio;
  final MockAssistantRepository _mockFallback = MockAssistantRepository();

  RemoteAssistantRepository({required this.dio});

  @override
  Future<List<String>> getSuggestedQuestions() async {
    return _mockFallback.getSuggestedQuestions();
  }

  @override
  Future<ChatMessage> askAssistant(
    String userPrompt, {
    bool isVoiceInput = false,
  }) async {
    try {
      final aiDio = Dio(
        BaseOptions(
          baseUrl: AppConfig.aiBaseUrl,
          connectTimeout: const Duration(seconds: 8),
          receiveTimeout: const Duration(seconds: 15),
          headers: {'Content-Type': 'application/json'},
        ),
      );

      final response = await aiDio.post(
        '/chat',
        data: {'message': userPrompt, 'language': 'en'},
      );

      final data = response.data;
      String? answer;
      if (data is Map<String, dynamic>) {
        answer =
            data['answer']?.toString() ??
            data['response']?.toString() ??
            data['text']?.toString();
      }

      if (answer != null && answer.isNotEmpty) {
        return ChatMessage(
          id: 'ai-${DateTime.now().millisecondsSinceEpoch}',
          text: answer,
          isUser: false,
          timestamp: DateTime.now(),
          isVoiceInput: isVoiceInput,
        );
      }
    } catch (_) {
      // Server2 unreachable or timed out -> gracefully fallback to mock
    }

    final fallback = await _mockFallback.askAssistant(
      userPrompt,
      isVoiceInput: isVoiceInput,
    );

    return ChatMessage(
      id: fallback.id,
      text: '${fallback.text}\n\n(Local offline advisory mode)',
      isUser: false,
      timestamp: fallback.timestamp,
      isVoiceInput: isVoiceInput,
    );
  }
}
