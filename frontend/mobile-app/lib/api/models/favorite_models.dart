class FavoriteItem {
  const FavoriteItem({
    required this.id,
    required this.userId,
    this.productId,
    this.partnerId,
    required this.createdAt,
    this.productName,
    this.partnerName,
  });

  factory FavoriteItem.fromJson(Map<String, dynamic> json) {
    final prod = json['product'] as Map<String, dynamic>?;
    final partner = json['partner'] as Map<String, dynamic>?;

    return FavoriteItem(
      id: json['id'] as String,
      userId: json['userId'] as String,
      productId: json['productId'] as String?,
      partnerId: json['partnerId'] as String?,
      createdAt: json['createdAt'] as String,
      productName: prod != null ? prod['name'] as String? : null,
      partnerName: partner != null ? partner['name'] as String? : null,
    );
  }

  final String id;
  final String userId;
  final String? productId;
  final String? partnerId;
  final String createdAt;
  final String? productName;
  final String? partnerName;
}
