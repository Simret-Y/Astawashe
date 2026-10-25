import 'package:dio/dio.dart';

import '../../../core/config/app_config.dart';

class AssistantReply {
  const AssistantReply({
    required this.text,
    required this.sessionId,
    this.sources = const [],
  });
  final String text;
  final String sessionId;
  final List<dynamic> sources;
}

class AssistantRepository {
  AssistantRepository({Dio? dio})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: AppConfig.aiBaseUrl,
              connectTimeout: const Duration(seconds: 15),
              receiveTimeout: const Duration(seconds: 45),
              contentType: 'application/json',
            ),
          );

  final Dio _dio;
  String? _sessionId;

  Future<AssistantReply> ask(String message, {String language = 'en'}) async {
    final response = await _dio.post(
      '/api/chat',
      data: {
        'message': message,
        'language': language,
        if (_sessionId != null) 'session_id': _sessionId,
      },
    );
    final body = response.data is Map
        ? Map<String, dynamic>.from(response.data)
        : <String, dynamic>{};
    if (body['success'] != true) {
      throw StateError(
        (body['error'] ?? 'The assistant could not answer right now.')
            .toString(),
      );
    }
    _sessionId = body['session_id']?.toString() ?? _sessionId;
    return AssistantReply(
      text: (body['answer'] ?? body['response'] ?? '').toString(),
      sessionId: _sessionId ?? '',
      sources: body['sources'] is List ? body['sources'] as List : const [],
    );
  }
}
