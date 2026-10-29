/// Resposta `{ "message": "..." }` dos endpoints de recuperação de senha e
/// verificação de e-mail (docs/API_CONTRACTS.md §2).
class MessageResponse {
  const MessageResponse({required this.message});

  factory MessageResponse.fromJson(Map<String, dynamic> json) =>
      MessageResponse(message: (json['message'] as String?) ?? '');

  final String message;
}

class ConfirmPasswordResetPayload {
  const ConfirmPasswordResetPayload({
    required this.email,
    required this.code,
    required this.newPassword,
  });

  final String email;
  final String code;
  final String newPassword;

  Map<String, dynamic> toJson() => {'email': email, 'code': code, 'newPassword': newPassword};
}

/// Subconjunto de `GET /iam/me` usado pelo app: e-mail e estado de verificação.
class AccountInfo {
  const AccountInfo({required this.email, required this.isEmailVerified});

  factory AccountInfo.fromJson(Map<String, dynamic> json) => AccountInfo(
        email: (json['email'] as String?) ?? '',
        // Mesma regra do web: só é "não verificado" quando o backend diz false.
        isEmailVerified: json['isEmailVerified'] != false,
      );

  final String email;
  final bool isEmailVerified;
}
