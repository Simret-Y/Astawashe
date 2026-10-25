import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'features/notifications/notification_service.dart';
import 'core/realtime/realtime_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations & transparent status bar
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  final container = ProviderContainer();

  // Initialize notifications service & realtime connection
  try {
    final notificationService = container.read(notificationServiceProvider);
    await notificationService.initialize();
    container.read(realtimeServiceProvider);
  } catch (_) {}

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const AstaWasheApp(),
    ),
  );
}
