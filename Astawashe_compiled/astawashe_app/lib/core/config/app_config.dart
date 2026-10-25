import 'package:flutter/foundation.dart';

/// Application compile-time configurations and environment constants.
class AppConfig {
  AppConfig._();

  /// Whether to use mock repositories.
  /// Defaults to false for live integration builds; pass `--dart-define=USE_MOCK=true` for offline mode.
  static const bool useMock = bool.fromEnvironment(
    'USE_MOCK',
    defaultValue: false,
  );

  static String get _defaultHost {
    // When running in the browser (Chrome, Edge), desktop, or iOS simulator, the server on the
    // local computer is reached via 'localhost'.
    // On the Android Emulator, '10.0.2.2' routes to the host machine's localhost.
    if (kIsWeb) return 'localhost';
    if (defaultTargetPlatform == TargetPlatform.android) return '10.0.2.2';
    return 'localhost';
  }

  /// Base URL for the remote Node/Express API service.
  /// Override with `--dart-define=API_BASE_URL=http://...`
  static String get apiBaseUrl {
    const env = String.fromEnvironment('API_BASE_URL');
    if (env.isNotEmpty) return env;
    return 'http://$_defaultHost:4000/api';
  }

  /// Base URL for the Server2 AI service.
  /// Override with `--dart-define=AI_BASE_URL=http://...`
  static String get aiBaseUrl {
    const env = String.fromEnvironment('AI_BASE_URL');
    if (env.isNotEmpty) return env;
    return 'http://$_defaultHost:8080';
  }

  /// Base URL for Socket.IO real-time connection.
  /// Override with `--dart-define=SOCKET_BASE_URL=http://...`
  static String get socketBaseUrl {
    const env = String.fromEnvironment('SOCKET_BASE_URL');
    if (env.isNotEmpty) return env;
    return 'http://$_defaultHost:4000';
  }

  /// App info
  static const String appName = 'AstaWashe';
  static const String appVersion = '1.0.0';
  static const String appTagline = 'Your health, on time';
}
