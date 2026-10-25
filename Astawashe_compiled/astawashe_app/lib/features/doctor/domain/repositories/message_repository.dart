import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/network/dio_client.dart';
import '../models/message_models.dart';
import '../../data/repositories/mock_message_repository.dart';
import '../../data/repositories/remote_message_repository.dart';

abstract class MessageRepository {
  Future<List<Conversation>> getConversations(String userId);
  Future<List<DirectMessage>> getMessages(String conversationId);
  Future<DirectMessage> sendMessage({
    required String senderId,
    required String senderName,
    required String senderRole,
    required String recipientId,
    required String recipientName,
    required String message,
  });
}

final messageRepositoryProvider = Provider<MessageRepository>((ref) {
  if (AppConfig.useMock) {
    return MockMessageRepository();
  } else {
    final dio = ref.watch(dioProvider);
    return RemoteMessageRepository(dio: dio);
  }
});
