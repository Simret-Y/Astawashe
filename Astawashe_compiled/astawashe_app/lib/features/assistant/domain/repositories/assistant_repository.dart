import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/network/dio_client.dart';
import '../models/assistant_models.dart';
import '../../data/repositories/mock_assistant_repository.dart';
import '../../data/repositories/remote_assistant_repository.dart';

abstract class AssistantRepository {
  Future<ChatMessage> askAssistant(
    String userPrompt, {
    bool isVoiceInput = false,
  });
  Future<List<String>> getSuggestedQuestions();
}

final assistantRepositoryProvider = Provider<AssistantRepository>((ref) {
  if (AppConfig.useMock) {
    return MockAssistantRepository();
  } else {
    final dio = ref.watch(dioProvider);
    return RemoteAssistantRepository(dio: dio);
  }
});
