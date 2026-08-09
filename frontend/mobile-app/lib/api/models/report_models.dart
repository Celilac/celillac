class ReportItem {
  const ReportItem({
    required this.id,
    required this.reporterId,
    this.productId,
    this.partnerId,
    required this.reason,
    this.details,
    required this.isFoodSafetyRisk,
    required this.status,
    required this.createdAt,
  });

  factory ReportItem.fromJson(Map<String, dynamic> json) => ReportItem(
        id: json['id'] as String,
        reporterId: json['reporterId'] as String,
        productId: json['productId'] as String?,
        partnerId: json['partnerId'] as String?,
        reason: json['reason'] as String,
        details: json['details'] as String?,
        isFoodSafetyRisk: (json['isFoodSafetyRisk'] as bool?) ?? false,
        status: json['status'] as String,
        createdAt: json['createdAt'] as String,
      );

  final String id;
  final String reporterId;
  final String? productId;
  final String? partnerId;
  final String reason;
  final String? details;
  final bool isFoodSafetyRisk;
  final String status;
  final String createdAt;
}
