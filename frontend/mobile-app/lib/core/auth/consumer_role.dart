import '../../api/models/enums.dart';

/// O app mobile atende somente o consumidor (CELIACO). Qualquer outro papel,
/// inclusive desconhecido, é rejeitado (fail closed).
bool isConsumerRole(String role) => role == UserRole.celiaco.wireValue;
