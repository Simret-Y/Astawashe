import 'package:flutter/material.dart';

import 'screens/login_screen.dart';

void main() {
  runApp(const AstaWasheApp());
}

class AstaWasheApp extends StatelessWidget {
  const AstaWasheApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AstaWashe',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4169A1)),
        scaffoldBackgroundColor: const Color(0xFFF7F9FC),
      ),
      home: const LoginScreen(),
    );
  }
}
