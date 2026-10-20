import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('AstaWashe home screen displays its main content', (
    tester,
  ) async {
    await tester.pumpWidget(const MaterialApp(home: HomeScreen()));

    expect(find.text('AstaWashe'), findsOneWidget);
    expect(
      find.text('Smart Healthcare Starts With Every Dose'),
      findsOneWidget,
    );
    expect(find.text('Backend connection'), findsOneWidget);
    expect(find.text('Check server connection'), findsOneWidget);
  });
}
