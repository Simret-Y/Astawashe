import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'screens/login_screen.dart';

const Color astaPrimary = Color(0xFF315A91);
const Color astaPrimaryDark = Color(0xFF24446F);
const Color astaBackground = Color(0xFFF5F7FB);
const Color astaSurface = Color(0xFFFFFFFF);
const Color astaText = Color(0xFF18283F);
const Color astaMuted = Color(0xFF65748B);

void main() {
  runApp(const AstaWasheApp());
}

class AstaWasheApp extends StatelessWidget {
  const AstaWasheApp({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme =
        ColorScheme.fromSeed(
          seedColor: astaPrimary,
          brightness: Brightness.light,
        ).copyWith(
          primary: astaPrimary,
          onPrimary: Colors.white,
          surface: astaSurface,
          error: const Color(0xFFB42318),
        );

    final baseTextTheme = GoogleFonts.poppinsTextTheme();

    return MaterialApp(
      title: 'AstaWashe',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: colorScheme,
        scaffoldBackgroundColor: astaBackground,
        textTheme: baseTextTheme.copyWith(
          headlineMedium: baseTextTheme.headlineMedium?.copyWith(
            color: astaText,
            fontSize: 28,
            fontWeight: FontWeight.w800,
            height: 1.25,
          ),
          headlineSmall: baseTextTheme.headlineSmall?.copyWith(
            color: astaText,
            fontWeight: FontWeight.w800,
          ),
          titleLarge: baseTextTheme.titleLarge?.copyWith(
            color: astaText,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
          bodyLarge: baseTextTheme.bodyLarge?.copyWith(
            color: astaText,
            fontSize: 15,
            height: 1.6,
          ),
          bodyMedium: baseTextTheme.bodyMedium?.copyWith(
            color: astaMuted,
            fontSize: 14,
            height: 1.55,
          ),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: astaBackground,
          foregroundColor: astaText,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          titleTextStyle: GoogleFonts.manrope(
            color: astaText,
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: astaSurface,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 17,
          ),
          labelStyle: const TextStyle(color: astaMuted),
          hintStyle: const TextStyle(color: Color(0xFF9AA6B6)),
          prefixIconColor: astaMuted,
          suffixIconColor: astaMuted,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFDCE3ED)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFDCE3ED)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: astaPrimary, width: 1.8),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFB42318)),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFB42318), width: 1.5),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: astaPrimary,
            foregroundColor: Colors.white,
            disabledBackgroundColor: astaPrimary.withValues(alpha: 0.55),
            minimumSize: const Size(double.infinity, 54),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            textStyle: GoogleFonts.manrope(
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: astaPrimary,
            textStyle: GoogleFonts.manrope(
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
        progressIndicatorTheme: const ProgressIndicatorThemeData(
          color: astaPrimary,
        ),
      ),
      home: const LoginScreen(),
    );
  }
}
