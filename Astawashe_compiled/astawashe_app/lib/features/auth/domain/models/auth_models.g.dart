part of 'auth_models.dart';

User _$UserFromJson(Map<String, dynamic> json) => User(
  id: json['id'] as String,
  email: json['email'] as String?,
  phone: json['phone'] as String?,
  role: json['role'] as String,
  fullName: json['fullName'] as String?,
  status: json['status'] as String?,
  emailVerified: json['emailVerified'] as bool?,
  profileData: json['profileData'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
  'id': instance.id,
  'email': instance.email,
  'phone': instance.phone,
  'role': instance.role,
  'fullName': instance.fullName,
  'status': instance.status,
  'emailVerified': instance.emailVerified,
  'profileData': instance.profileData,
};

AuthTokens _$AuthTokensFromJson(Map<String, dynamic> json) => AuthTokens(
  accessToken: json['accessToken'] as String,
  refreshToken: json['refreshToken'] as String?,
);

Map<String, dynamic> _$AuthTokensToJson(AuthTokens instance) =>
    <String, dynamic>{
      'accessToken': instance.accessToken,
      'refreshToken': instance.refreshToken,
    };

AuthResponse _$AuthResponseFromJson(Map<String, dynamic> json) => AuthResponse(
  success: json['success'] as bool,
  user: json['user'] == null
      ? null
      : User.fromJson(json['user'] as Map<String, dynamic>),
  tokens: json['tokens'] == null
      ? null
      : AuthTokens.fromJson(json['tokens'] as Map<String, dynamic>),
  requiresEmailVerification: json['requiresEmailVerification'] as bool?,
  message: json['message'] as String?,
);

Map<String, dynamic> _$AuthResponseToJson(AuthResponse instance) =>
    <String, dynamic>{
      'success': instance.success,
      'user': instance.user?.toJson(),
      'tokens': instance.tokens?.toJson(),
      'requiresEmailVerification': instance.requiresEmailVerification,
      'message': instance.message,
    };
