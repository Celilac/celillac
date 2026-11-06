/// Parceiro como exibido ao consumidor (GET /partners e GET /partners/:id).
///
/// O backend devolve também campos que NÃO são públicos por natureza
/// (`documentNumber`, `cnpj`, `documentType`, `companyName`, `responsibleName`,
/// `userId`, `approvalStatus`...). Este modelo **não os lê** de propósito, para
/// que nunca cheguem a uma tela.
class PublicPartner {
  const PublicPartner({
    required this.id,
    required this.name,
    required this.type,
    required this.operationalStatus,
    this.legalNature,
    this.description,
    this.address,
    this.phone,
    this.city,
    this.state,
    this.deliveryRegion,
    this.logoUrl,
  });

  factory PublicPartner.fromJson(Map<String, dynamic> json) => PublicPartner(
        id: json['id'] as String,
        name: json['name'] as String,
        type: (json['type'] as String?) ?? '',
        operationalStatus: (json['operationalStatus'] as String?) ?? '',
        legalNature: json['legalNature'] as String?,
        description: json['description'] as String?,
        address: json['address'] as String?,
        phone: json['phone'] as String?,
        city: json['city'] as String?,
        state: json['state'] as String?,
        deliveryRegion: json['deliveryRegion'] as String?,
        logoUrl: json['logoUrl'] as String?,
      );

  final String id;
  final String name;

  /// RESTAURANT | MARKET | INDEPENDENT_PRODUCER (ou outro valor futuro).
  final String type;

  /// ACTIVE | TEMPORARILY_CLOSED (parceiros INACTIVE não aparecem para o público).
  final String operationalStatus;

  /// PJ | PF.
  final String? legalNature;
  final String? description;
  final String? address;
  final String? phone;
  final String? city;
  final String? state;
  final String? deliveryRegion;

  /// URL http(s) ou data URI base64.
  final String? logoUrl;

  bool get isTemporarilyClosed => operationalStatus == 'TEMPORARILY_CLOSED';
}
