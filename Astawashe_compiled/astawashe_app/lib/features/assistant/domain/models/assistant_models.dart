import 'package:json_annotation/json_annotation.dart';

part 'assistant_models.g.dart';

@JsonSerializable()
class ChatMessage {
  final String id;
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final bool isVoiceInput;
  final String? audioUrl;

  const ChatMessage({
    required this.id,
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.isVoiceInput = false,
    this.audioUrl,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageFromJson(json);
  Map<String, dynamic> toJson() => _$ChatMessageToJson(this);
}
