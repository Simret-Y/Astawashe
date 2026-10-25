enum AppUserRole { patient, doctor, guest }

enum AppRoute { splash, auth, patientHome, doctorHome }

class AppRouteGuard {
  static bool allows({
    required AppUserRole userRole,
    required AppRoute targetRoute,
  }) {
    if (userRole == AppUserRole.guest) {
      return targetRoute == AppRoute.auth || targetRoute == AppRoute.splash;
    }

    if (targetRoute == AppRoute.patientHome) {
      return userRole == AppUserRole.patient;
    }

    if (targetRoute == AppRoute.doctorHome) {
      return userRole == AppUserRole.doctor;
    }

    return true;
  }
}
