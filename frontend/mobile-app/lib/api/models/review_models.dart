class ReviewItem {
  const ReviewItem({
    required this.id,
    required this.userId,
    this.productId,
    this.partnerId,
    required this.rating,
    this.comment,
    required this.createdAt,
  });

  factory ReviewItem.fromJson(Map<String, dynamic> json) => ReviewItem(
        id: json['id'] as String,
        userId: json['userId'] as String,
        productId: json['productId'] as String?,
        partnerId: json['partnerId'] as String?,
        rating: (json['rating'] as num).toInt(),
        comment: json['comment'] as String?,
        createdAt: json['createdAt'] as String,
      );

  final String id;
  final String userId;
  final String? productId;
  final String? partnerId;
  final int rating;
  final String? comment;
  final String createdAt;
}
