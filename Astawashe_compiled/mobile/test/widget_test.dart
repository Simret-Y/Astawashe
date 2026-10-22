import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/screens/login_screen.dart';

void main() {
  testWidgets('AstaWashe opens the login screen on startup', (tester) async {
    await tester.pumpWidget(const AstaWasheApp());

    expect(find.byType(LoginScreen), findsOneWidget);
  });
}
