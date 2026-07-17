import 'dart:convert';

/// Utilitários para decodificar o payload do JWT.
/// NUNCA valide o JWT aqui — apenas decodifique o payload.
/// A validação ocorre no servidor em cada requisição protegida.
/// (mirrors src/lib/auth.ts do app Expo original)
class JwtPayload {
  const JwtPayload({required this.sub, required this.role, required this.iat, required this.exp});

  final String sub; // userId
  final String role;
  final int iat;
  final int exp;
}

JwtPayload? decodeJwt(String token) {
  try {
    final parts = token.split('.');
    if (parts.length != 3) return null;

    var payload = parts[1];
    payload = payload.replaceAll('-', '+').replaceAll('_', '/');
    switch (payload.length % 4) {
      case 2:
        payload += '==';
        break;
      case 3:
        payload += '=';
        break;
    }

    final json = utf8.decode(base64.decode(payload));
    final map = jsonDecode(json) as Map<String, dynamic>;
    return JwtPayload(
      sub: map['sub'] as String,
      role: map['role'] as String,
      iat: map['iat'] as int,
      exp: map['exp'] as int,
    );
  } catch (_) {
    return null;
  }
}

bool isTokenExpired(String token) {
  final payload = decodeJwt(token);
  if (payload == null) return true;
  return DateTime.now().millisecondsSinceEpoch >= payload.exp * 1000;
}
