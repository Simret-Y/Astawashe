import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../storage/secure_storage_service.dart';
import '../../features/auth/presentation/providers/auth_state_provider.dart';
export 'api_exceptions.dart';

/// Provider for configured Dio HTTP client.
final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(secureStorageServiceProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // 1. Auth & 401 Interceptor
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.getAccessToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException error, handler) async {
        if (error.response?.statusCode == 401) {
          // Clear session and notify auth provider to redirect to login
          await storage.clearSession();
          try {
            ref.read(authStateProvider.notifier).logout();
          } catch (_) {}
        }
        return handler.next(error);
      },
    ),
  );

  // 2. Retry Interceptor for GET requests
  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (DioException error, handler) async {
        final requestOptions = error.requestOptions;
        final isGet = requestOptions.method.toUpperCase() == 'GET';
        final isTransient =
            error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.receiveTimeout ||
            error.type == DioExceptionType.connectionError;

        final retryCount = (requestOptions.extra['retryCount'] as int?) ?? 0;

        if (isGet && isTransient && retryCount < 2) {
          requestOptions.extra['retryCount'] = retryCount + 1;
          await Future.delayed(Duration(milliseconds: 500 * (retryCount + 1)));

          try {
            final response = await dio.fetch(requestOptions);
            return handler.resolve(response);
          } on DioException catch (retryError) {
            return handler.next(retryError);
          }
        }

        return handler.next(error);
      },
    ),
  );

  return dio;
});
