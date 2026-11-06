import 'package:flutter/material.dart';

/// Rótulo de botão que mostra um indicador de progresso ao lado do texto
/// enquanto [busy]; o texto permanece para manter o botão identificável.
class BusyLabel extends StatelessWidget {
  const BusyLabel({super.key, required this.label, required this.busy});

  final String label;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (busy) ...[
          const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
          const SizedBox(width: 10),
        ],
        Text(label),
      ],
    );
  }
}
