part of 'message_models.dart';

DirectMessage _$DirectMessageFromJson(Map<String, dynamic> json) =>
    DirectMessage(
      id: json['id'] as String,
      senderId: json['senderId'] as String,
      senderName: json['senderName'] as String,
      senderRole: json['senderRole'] as String,
      recipientId: json['recipientId'] as String,
      recipientName: json['recipientName'] as String,
      message: json['message'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      isRead: json['isRead'] as bool? ?? true,
    );

Map<String, dynamic> _$DirectMessageToJson(DirectMessage instance) =>
    <String, dynamic>{
      'id': instance.id,
      'senderId': instance.senderId,
      'senderName': instance.senderName,
      'senderRole': instance.senderRole,
      'recipientId': instance.recipientId,
      'recipientName': instance.recipientName,
      'message': instance.message,
      'timestamp': instance.timestamp.toIso8601String(),
      'isRead': instance.isRead,
    };

Conversation _$ConversationFromJson(Map<String, dynamic> json) => Conversation(
  id: json['id'] as String,
  otherUserId: json['otherUserId'] as String,
  otherUserName: json['otherUserName'] as String,
  otherUserRole: json['otherUserRole'] as String,
  lastMessage: json['lastMessage'] as String,
  lastMessageTime: DateTime.parse(json['lastMessageTime'] as String),
  unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
  avatarUrl: json['avatarUrl'] as String?,
);

Map<String, dynamic> _$ConversationToJson(Conversation instance) =>
    <String, dynamic>{
      'id': instance.id,
      'otherUserId': instance.otherUserId,
      'otherUserName': instance.otherUserName,
      'otherUserRole': instance.otherUserRole,
      'lastMessage': instance.lastMessage,
      'lastMessageTime': instance.lastMessageTime.toIso8601String(),
      'unreadCount': instance.unreadCount,
      'avatarUrl': instance.avatarUrl,
    };
