import 'package:json_annotation/json_annotation.dart';

part 'auth_models.g.dart';

enum UserRole {
  @JsonValue('PATIENT')
  patient,
  @JsonValue('DOCTOR')
  doctor,
  @JsonValue('HOSPITAL_ADMIN')
  hospitalAdmin,
  @JsonValue('SYSTEM_ADMIN')
  systemAdmin;

  static UserRole fromString(String? role) {
    switch (role?.toUpperCase()) {
      case 'DOCTOR':
        return UserRole.doctor;
      case 'HOSPITAL_ADMIN':
        return UserRole.hospitalAdmin;
      case 'SYSTEM_ADMIN':
        return UserRole.systemAdmin;
      case 'PATIENT':
      default:
        return UserRole.patient;
    }
  }

  String toApiString() {
    switch (this) {
      case UserRole.patient:
        return 'PATIENT';
      case UserRole.doctor:
        return 'DOCTOR';
      case UserRole.hospitalAdmin:
        return 'HOSPITAL_ADMIN';
      case UserRole.systemAdmin:
        return 'SYSTEM_ADMIN';
    }
  }
}

@JsonSerializable()
class User {
  final String id;
  final String? email;
  final String? phone;
  final String role;
  final String? fullName;
  final String? status;
  final bool? emailVerified;
  final Map<String, dynamic>? profileData;

  const User({
    required this.id,
    this.email,
    this.phone,
    required this.role,
    this.fullName,
    this.status,
    this.emailVerified,
    this.profileData,
  });

  UserRole get userRole => UserRole.fromString(role);

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  User copyWith({
    String? id,
    String? email,
    String? phone,
    String? role,
    String? fullName,
    String? status,
    bool? emailVerified,
    Map<String, dynamic>? profileData,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      fullName: fullName ?? this.fullName,
      status: status ?? this.status,
      emailVerified: emailVerified ?? this.emailVerified,
      profileData: profileData ?? this.profileData,
    );
  }
}

@JsonSerializable()
class AuthTokens {
  final String accessToken;
  final String? refreshToken;

  const AuthTokens({required this.accessToken, this.refreshToken});

  factory AuthTokens.fromJson(Map<String, dynamic> json) =>
      _$AuthTokensFromJson(json);
  Map<String, dynamic> toJson() => _$AuthTokensToJson(this);
}

@JsonSerializable()
class AuthResponse {
  final bool success;
  final User? user;
  final AuthTokens? tokens;
  final bool? requiresEmailVerification;
  final String? message;
  final String? demoOtp;

  const AuthResponse({
    required this.success,
    this.user,
    this.tokens,
    this.requiresEmailVerification,
    this.message,
    this.demoOtp,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final bool isSuccess =
        (json['success'] as bool?) ??
        (json['tokens'] != null ||
            json['user'] != null ||
            json['requiresEmailVerification'] == true ||
            json['pending'] != null);

    final normalized = Map<String, dynamic>.from(json);
    normalized['success'] = isSuccess;
    final parsed = _$AuthResponseFromJson(normalized);
    return AuthResponse(
      success: parsed.success,
      user: parsed.user,
      tokens: parsed.tokens,
      requiresEmailVerification:
          parsed.requiresEmailVerification ?? (json['pending'] != null),
      message: parsed.message,
      demoOtp: json['demoOtp'] as String?,
    );
  }

  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}
