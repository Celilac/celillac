import 'package:flutter/material.dart';

import '../../api/api_client.dart';

class ReportDialog extends StatefulWidget {
  const ReportDialog({
    super.key,
    this.productId,
    this.partnerId,
    this.targetName = 'Item',
    required this.apiClient,
  });

  final String? productId;
  final String? partnerId;
  final String targetName;
  final ApiClient apiClient;

  static Future<bool?> show(
    BuildContext context, {
    String? productId,
    String? partnerId,
    String targetName = 'Item',
    required ApiClient apiClient,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => ReportDialog(
        productId: productId,
        partnerId: partnerId,
        targetName: targetName,
        apiClient: apiClient,
      ),
    );
  }

  @override
  State<ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<ReportDialog> {
  String _reason = 'MISSING_ALLERGEN';
  final _detailsController = TextEditingController();
  bool _isFoodSafetyRisk = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await widget.apiClient.createReport(
        productId: widget.productId,
        partnerId: widget.partnerId,
        reason: _reason,
        details: _detailsController.text.trim().isEmpty ? null : _detailsController.text.trim(),
        isFoodSafetyRisk: _isFoodSafetyRisk,
      );
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.red),
          const SizedBox(width: 8),
          Expanded(child: Text('Denunciar ${widget.targetName}')),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(8),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
              ),

            const Text('Motivo da Denúncia:', style: TextStyle(fontWeight: FontWeight.bold)),
            DropdownButton<String>(
              value: _reason,
              isExpanded: true,
              items: const [
                DropdownMenuItem(
                  value: 'MISSING_ALLERGEN',
                  child: Text('Omissão de Alérgenos / Glúten'),
                ),
                DropdownMenuItem(
                  value: 'WRONG_CROSS_CONTAMINATION',
                  child: Text('Contaminação Cruzada Incorreta'),
                ),
                DropdownMenuItem(
                  value: 'INCORRECT_INGREDIENTS',
                  child: Text('Ingredientes Incorretos'),
                ),
                DropdownMenuItem(
                  value: 'OTHER',
                  child: Text('Outro Motivo'),
                ),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _reason = value;
                    if (value == 'MISSING_ALLERGEN' || value == 'WRONG_CROSS_CONTAMINATION') {
                      _isFoodSafetyRisk = true;
                    }
                  });
                }
              },
            ),

            const SizedBox(height: 12),
            TextField(
              controller: _detailsController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Detalhes da Denúncia',
                border: OutlineInputBorder(),
                hintText: 'Descreva o ocorrido...',
              ),
            ),

            const SizedBox(height: 12),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Esta denúncia envolve risco direto de segurança alimentar.',
                style: TextStyle(fontSize: 12, color: Colors.deepOrange),
              ),
              value: _isFoodSafetyRisk,
              onChanged: (val) => setState(() => _isFoodSafetyRisk = val ?? false),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          onPressed: _loading ? null : _submit,
          child: _loading
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Denunciar', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
