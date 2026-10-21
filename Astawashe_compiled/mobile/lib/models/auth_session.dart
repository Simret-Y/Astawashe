class AuthSession {
  final String accessToken;
  final String refreshToken;
  final Map<String, dynamic> user;

  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  String get role => user['role'] as String? ?? '';

  String get displayName {
    final name = user['name'];
    if (name is String && name.trim().isNotEmpty) {
      return name.trim();
    }

    return user['email'] as String? ??
        user['phone'] as String? ??
        'AstaWashe user';
  }

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final userData = json['user'];
    final tokensData = json['tokens'];

    if (userData is! Map<String, dynamic> ||
        tokensData is! Map<String, dynamic>) {
      throw const FormatException('Invalid login response.');
    }

    final accessToken = tokensData['accessToken'];
    final refreshToken = tokensData['refreshToken'];
    final role = userData['role'];

    if (accessToken is! String ||
        accessToken.isEmpty ||
        refreshToken is! String ||
        refreshToken.isEmpty ||
        role is! String ||
        role.isEmpty) {
      throw const FormatException('Missing authentication data.');
    }

    return AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: userData,
    );
  }
}
