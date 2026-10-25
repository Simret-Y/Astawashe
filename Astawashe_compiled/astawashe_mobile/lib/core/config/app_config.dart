import 'package:flutter/foundation.dart';

class AppConfig {
  static String get _defaultHost {
    if (kIsWeb) return 'localhost';
    if (defaultTargetPlatform == TargetPlatform.android) return '10.0.2.2';
    return 'localhost';
  }

  static String get apiBaseUrl {
    const env = String.fromEnvironment('API_BASE_URL');
    if (env.isNotEmpty) return env;
    return 'http://$_defaultHost:4000/api';
  }

  static String get aiBaseUrl {
    const env = String.fromEnvironment('AI_BASE_URL');
    if (env.isNotEmpty) return env;
    return 'http://$_defaultHost:8080';
  }

  static const String appName = 'AstaWashe';
  static const String aiAssistantName = 'AstaWashe AI';
}
