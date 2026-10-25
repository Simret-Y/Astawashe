import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:astawashe_app/app.dart';
import 'package:astawashe_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:astawashe_app/features/auth/data/repositories/mock_auth_repository.dart';
import 'package:astawashe_app/core/storage/secure_storage_service.dart';

void main() {
  testWidgets('AstaWashe app loads welcome splash screen', (
    WidgetTester tester,
  ) async {
    final storage = SecureStorageService();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(
            MockAuthRepository(storage: storage),
          ),
        ],
        child: const AstaWasheApp(),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.text('AstaWashe'), findsWidgets);
  });
}
