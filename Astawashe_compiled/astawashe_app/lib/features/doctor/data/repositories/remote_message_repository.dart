import 'package:dio/dio.dart';
import '../../domain/models/message_models.dart';
import '../../domain/repositories/message_repository.dart';

class RemoteMessageRepository implements MessageRepository {
  final Dio dio;

  RemoteMessageRepository({required this.dio});

  Conversation _mapConversation(Map<String, dynamic> json) {
    return Conversation(
      id: json['id']?.toString() ?? '',
      otherUserId:
          json['otherUserId']?.toString() ??
          json['participantId']?.toString() ??
          '',
      otherUserName:
          json['otherUserName']?.toString() ??
          json['participantName']?.toString() ??
          'User',
      otherUserRole:
          json['otherUserRole']?.toString() ??
          json['participantRole']?.toString() ??
          'USER',
      lastMessage: json['lastMessage']?.toString() ?? '',
      lastMessageTime: json['lastMessageTime'] != null
          ? DateTime.tryParse(json['lastMessageTime'].toString()) ??
                DateTime.now()
          : DateTime.now(),
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      avatarUrl: json['avatarUrl']?.toString(),
    );
  }

  DirectMessage _mapDirectMessage(Map<String, dynamic> json) {
    return DirectMessage(
      id: json['id']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      senderName: json['senderName']?.toString() ?? 'Sender',
      senderRole: json['senderRole']?.toString() ?? 'USER',
      recipientId: json['recipientId']?.toString() ?? '',
      recipientName: json['recipientName']?.toString() ?? 'Recipient',
      message: json['message']?.toString() ?? json['content']?.toString() ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : (json['createdAt'] != null
                ? DateTime.tryParse(json['createdAt'].toString()) ??
                      DateTime.now()
                : DateTime.now()),
      isRead: (json['isRead'] as bool?) ?? true,
    );
  }

  @override
  Future<List<Conversation>> getConversations(String userId) async {
    final response = await dio.get(
      '/messages/conversations',
      queryParameters: {'userId': userId},
    );
    final list = response.data['data'] as List<dynamic>? ?? [];
    return list
        .map((e) => _mapConversation(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<DirectMessage>> getMessages(String conversationId) async {
    final response = await dio.get('/messages/$conversationId');
    final list = response.data['data'] as List<dynamic>? ?? [];
    return list
        .map((e) => _mapDirectMessage(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<DirectMessage> sendMessage({
    required String senderId,
    required String senderName,
    required String senderRole,
    required String recipientId,
    required String recipientName,
    required String message,
  }) async {
    final response = await dio.post(
      '/messages',
      data: {
        'senderId': senderId,
        'senderName': senderName,
        'senderRole': senderRole,
        'recipientId': recipientId,
        'recipientName': recipientName,
        'message': message,
      },
    );
    final data =
        response.data['data'] as Map<String, dynamic>? ?? response.data;
    return _mapDirectMessage(data as Map<String, dynamic>);
  }
}
