class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api',
  );

  static Uri endpoint(String path) {
    final normalizedBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;

    final normalizedPath = path.startsWith('/') ? path.substring(1) : path;

    return Uri.parse('$normalizedBaseUrl/$normalizedPath');
  }
}
