import 'package:flutter_test/flutter_test.dart';
import 'package:astawashe_mobile/core/utils/adherence_calculator.dart';
import 'package:astawashe_mobile/core/router/app_router.dart';

void main() {
  group('Adherence calculator', () {
    test('calculates percentage from taken and total doses', () {
      final result = AdherenceCalculator.calculate(
        taken: 8,
        missed: 2,
        total: 10,
      );

      expect(result, 80.0);
    });

    test('returns zero for empty totals', () {
      final result = AdherenceCalculator.calculate(
        taken: 0,
        missed: 0,
        total: 0,
      );

      expect(result, 0.0);
    });
  });

  group('Auth guard', () {
    test('patient role cannot access doctor route', () {
      expect(
        AppRouteGuard.allows(
          userRole: AppUserRole.patient,
          targetRoute: AppRoute.doctorHome,
        ),
        isFalse,
      );
    });

    test('doctor role can access doctor route', () {
      expect(
        AppRouteGuard.allows(
          userRole: AppUserRole.doctor,
          targetRoute: AppRoute.doctorHome,
        ),
        isTrue,
      );
    });
  });
}
