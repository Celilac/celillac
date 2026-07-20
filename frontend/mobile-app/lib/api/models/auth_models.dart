import 'enums.dart';

class RegisterPayload {
  const RegisterPayload({
    required this.email,
    required this.password,
    required this.role,
  });

  final String email;
  final String password;
  final UserRole role;

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        'role': role.wireValue,
      };
}

class RegisterResponse {
  const RegisterResponse({required this.id, required this.email, required this.role});

  factory RegisterResponse.fromJson(Map<String, dynamic> json) => RegisterResponse(
        id: json['id'] as String,
        email: json['email'] as String,
        role: UserRole.fromWire(json['role'] as String),
      );

  final String id;
  final String email;
  final UserRole role;
}

class LoginPayload {
  const LoginPayload({required this.email, required this.password});

  final String email;
  final String password;

  Map<String, dynamic> toJson() => {'email': email, 'password': password};
}

class LoginResponse {
  const LoginResponse({required this.token, required this.expiresIn});

  factory LoginResponse.fromJson(Map<String, dynamic> json) => LoginResponse(
        token: json['token'] as String,
        expiresIn: json['expiresIn'] as String,
      );

  final String token;
  final String expiresIn;
}
