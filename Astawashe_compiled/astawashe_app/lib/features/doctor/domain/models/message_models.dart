import 'package:json_annotation/json_annotation.dart';

part 'message_models.g.dart';

@JsonSerializable()
class DirectMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String senderRole;
  final String recipientId;
  final String recipientName;
  final String message;
  final DateTime timestamp;
  final bool isRead;

  const DirectMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.senderRole,
    required this.recipientId,
    required this.recipientName,
    required this.message,
    required this.timestamp,
    this.isRead = true,
  });

  factory DirectMessage.fromJson(Map<String, dynamic> json) =>
      _$DirectMessageFromJson(json);
  Map<String, dynamic> toJson() => _$DirectMessageToJson(this);
}

@JsonSerializable()
class Conversation {
  final String id;
  final String otherUserId;
  final String otherUserName;
  final String otherUserRole;
  final String lastMessage;
  final DateTime lastMessageTime;
  final int unreadCount;
  final String? avatarUrl;

  const Conversation({
    required this.id,
    required this.otherUserId,
    required this.otherUserName,
    required this.otherUserRole,
    required this.lastMessage,
    required this.lastMessageTime,
    this.unreadCount = 0,
    this.avatarUrl,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) =>
      _$ConversationFromJson(json);
  Map<String, dynamic> toJson() => _$ConversationToJson(this);
}
