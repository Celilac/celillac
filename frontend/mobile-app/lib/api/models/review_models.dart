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

/// Resposta de GET /reviews/product/:productId (docs/API_CONTRACTS.md §6).
class ProductReviews {
  const ProductReviews({
    required this.totalReviews,
    required this.averageRating,
    required this.reviews,
  });

  factory ProductReviews.fromJson(Map<String, dynamic> json) {
    final productId = json['productId'] as String?;
    return ProductReviews(
      totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0,
      reviews: (json['reviews'] as List<dynamic>? ?? [])
          .map((e) => ReviewItem.fromJson({'productId': productId, ...(e as Map<String, dynamic>)}))
          .toList(),
    );
  }

  final int totalReviews;
  final double averageRating;
  final List<ReviewItem> reviews;
}
