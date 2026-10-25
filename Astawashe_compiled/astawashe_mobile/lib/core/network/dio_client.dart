import 'package:dio/dio.dart';
import 'package:astawashe_mobile/core/config/app_config.dart';
import 'package:astawashe_mobile/core/storage/secure_storage.dart';

class AppDioClient {
  AppDioClient({AppSecureStorage? secureStorage})
    : _secureStorage = secureStorage ?? const AppSecureStorage(),
      dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 20),
          contentType: 'application/json',
          responseType: ResponseType.json,
        ),
      ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _secureStorage.readToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await _secureStorage.clearSession();
          }
          return handler.next(error);
        },
      ),
    );
  }

  final AppSecureStorage _secureStorage;
  final Dio dio;
}
