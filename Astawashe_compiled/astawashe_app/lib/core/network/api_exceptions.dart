import 'dart:io';
import 'package:dio/dio.dart';

/// User-friendly application network exception.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic originalError;

  const ApiException({
    required this.message,
    this.statusCode,
    this.originalError,
  });

  @override
  String toString() => message;

  /// Translates raw exceptions or [DioException] into friendly user-facing messages.
  factory ApiException.fromError(dynamic error) {
    if (error is ApiException) {
      return error;
    }

    if (error is DioException) {
      final statusCode = error.response?.statusCode;
      final responseData = error.response?.data;

      // Check if backend returned a structured error message
      String? backendMessage;
      if (responseData is Map<String, dynamic>) {
        backendMessage =
            responseData['message'] as String? ??
            responseData['error'] as String?;
      } else if (responseData is String && responseData.isNotEmpty) {
        backendMessage = responseData;
      }

      if (backendMessage != null && backendMessage.isNotEmpty) {
        return ApiException(
          message: backendMessage,
          statusCode: statusCode,
          originalError: error,
        );
      }

      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
          return ApiException(
            message:
                'Connection timed out. Please check your network and try again.',
            statusCode: statusCode,
            originalError: error,
          );
        case DioExceptionType.receiveTimeout:
        case DioExceptionType.transformTimeout:
          return ApiException(
            message: 'Server took too long to respond. Please try again.',
            statusCode: statusCode,
            originalError: error,
          );
        case DioExceptionType.badResponse:
          return ApiException(
            message: _mapStatusCodeToMessage(statusCode),
            statusCode: statusCode,
            originalError: error,
          );
        case DioExceptionType.connectionError:
          return ApiException(
            message:
                'Unable to connect to server. Please verify your internet connection or server status.',
            statusCode: statusCode,
            originalError: error,
          );
        case DioExceptionType.cancel:
          return ApiException(
            message: 'Request was cancelled.',
            statusCode: statusCode,
            originalError: error,
          );
        case DioExceptionType.badCertificate:
          return ApiException(
            message: 'Security certificate verification failed.',
            statusCode: statusCode,
            originalError: error,
          );
        case DioExceptionType.unknown:
          if (error.error is SocketException) {
            return ApiException(
              message:
                  'Cannot reach the server. Please check your network connection.',
              statusCode: statusCode,
              originalError: error,
            );
          }
          return ApiException(
            message: 'An unexpected network error occurred. Please try again.',
            statusCode: statusCode,
            originalError: error,
          );
      }
    }

    if (error is SocketException) {
      return ApiException(
        message: 'No internet connection detected.',
        originalError: error,
      );
    }

    return ApiException(
      message: 'Something went wrong. Please try again.',
      originalError: error,
    );
  }

  static String _mapStatusCodeToMessage(int? statusCode) {
    switch (statusCode) {
      case 400:
        return 'Invalid request details. Please check your input.';
      case 401:
        return 'Session expired. Please sign in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A record with this information already exists.';
      case 422:
        return 'Validation failed. Please verify your data.';
      case 500:
      case 502:
      case 503:
        return 'Server error encountered. Our team has been alerted.';
      default:
        return 'Request failed with status code $statusCode.';
    }
  }
}
