import 'package:flutter/material.dart';

import '../../api/api_client.dart';

class FavoriteButton extends StatefulWidget {
  const FavoriteButton({
    super.key,
    this.productId,
    this.partnerId,
    this.initialIsFavorite = false,
    required this.apiClient,
    this.onToggle,
  });

  final String? productId;
  final String? partnerId;
  final bool initialIsFavorite;
  final ApiClient apiClient;
  final ValueChanged<bool>? onToggle;

  @override
  State<FavoriteButton> createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends State<FavoriteButton> {
  late bool _isFavorite;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _isFavorite = widget.initialIsFavorite;
  }

  Future<void> _toggleFavorite() async {
    setState(() => _loading = true);
    try {
      if (_isFavorite) {
        final targetId = widget.productId ?? widget.partnerId ?? '';
        await widget.apiClient.removeFavorite(targetId);
        setState(() => _isFavorite = false);
        widget.onToggle?.call(false);
      } else {
        await widget.apiClient.addFavorite(
          productId: widget.productId,
          partnerId: widget.partnerId,
        );
        setState(() => _isFavorite = true);
        widget.onToggle?.call(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: _loading
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(
              _isFavorite ? Icons.favorite : Icons.favorite_border,
              color: _isFavorite ? Colors.red : Colors.grey,
            ),
      onPressed: _loading ? null : _toggleFavorite,
    );
  }
}
