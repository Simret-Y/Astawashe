part of 'assistant_models.dart';

ChatMessage _$ChatMessageFromJson(Map<String, dynamic> json) => ChatMessage(
  id: json['id'] as String,
  text: json['text'] as String,
  isUser: json['isUser'] as bool,
  timestamp: DateTime.parse(json['timestamp'] as String),
  isVoiceInput: json['isVoiceInput'] as bool? ?? false,
  audioUrl: json['audioUrl'] as String?,
);

Map<String, dynamic> _$ChatMessageToJson(ChatMessage instance) =>
    <String, dynamic>{
      'id': instance.id,
      'text': instance.text,
      'isUser': instance.isUser,
      'timestamp': instance.timestamp.toIso8601String(),
      'isVoiceInput': instance.isVoiceInput,
      'audioUrl': instance.audioUrl,
    };
