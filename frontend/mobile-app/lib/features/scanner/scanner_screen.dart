import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/compatibility_models.dart';
import '../../core/auth/session_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/alert_banner.dart';
import 'scan_lookup.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key, this.isActive = true});

  /// Se a aba do scanner não está visível (ex.: usuário está em outra aba
  /// do IndexedStack), a câmera deve ser pausada para não drenar bateria.
  final bool isActive;

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    formats: const [BarcodeFormat.ean13, BarcodeFormat.ean8, BarcodeFormat.qrCode],
  );

  bool _isScanning = true;
  bool _isLoading = false;
  String? _scannedCode;
  String? _productName;
  CompatibilityReport? _report;

  /// Aviso sem nível de risco (produto fora do catálogo ou falha). Nunca é veredito.
  String? _neutralMessage;

  @override
  void didUpdateWidget(covariant ScannerScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isActive != widget.isActive) {
      if (widget.isActive && _isScanning) {
        _controller.start();
      } else {
        _controller.stop();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleBarcode(BarcodeCapture capture) async {
    if (!_isScanning) return;
    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null) return;

    final userId = context.read<SessionController>().user?.id;
    final apiClient = context.read<ApiClient>();
    if (userId == null) return;

    setState(() {
      _isScanning = false;
      _scannedCode = code;
      _isLoading = true;
      _report = null;
      _neutralMessage = null;
      _productName = null;
    });
    await _controller.stop();

    final result = await ScanLookup(apiClient).lookup(code, userId);
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      switch (result) {
        case ScanFound(:final product, :final report):
          _productName = product.name;
          _report = report;
        case ScanNotFound():
          _productName = 'Produto não encontrado';
          _neutralMessage = 'Este código não está no catálogo CeLiLac, então não há '
              'verificação de segurança. Confira o rótulo antes de consumir.';
        case ScanVerdictUnavailable(:final product, :final message):
          _productName = product.name;
          _neutralMessage = '$message Não consuma sem verificar o rótulo.';
        case ScanFailed(:final message):
          _neutralMessage = '$message Não consuma sem verificar o rótulo.';
      }
    });
  }

  void _reset() {
    setState(() {
      _scannedCode = null;
      _report = null;
      _neutralMessage = null;
      _productName = null;
      _isScanning = true;
    });
    _controller.start();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const Text(
                '🌾 CeLiLac Scanner',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                height: 320,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.primary, width: 2),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (_isScanning && widget.isActive)
                      MobileScanner(controller: _controller, onDetect: _handleBarcode)
                    else
                      Container(
                        color: AppColors.surface,
                        alignment: Alignment.center,
                        child: const Text(
                          '📷 Câmera Pausada',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 16),
                        ),
                      ),
                    if (_isScanning)
                      Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 220,
                              height: 120,
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: AppColors.primary.withValues(alpha: 0.8),
                                  width: 2,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.5),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'Aponte para o código de barras',
                                style: TextStyle(color: Colors.white70, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      if (_isLoading) ...[
                        const CircularProgressIndicator(color: AppColors.primary),
                        const SizedBox(height: 12),
                        const Text(
                          'Verificando segurança...',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 14),
                        ),
                      ],
                      if (_scannedCode != null && !_isLoading)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text(
                            'EAN: $_scannedCode',
                            style: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                          ),
                        ),
                      if (_productName != null && !_isLoading)
                        Text(
                          _productName!,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                      if (_report != null && !_isLoading)
                        AlertBanner(
                          status: _report!.riskLevel,
                          message: _report!.isCompatible
                              ? 'Compatível com seu perfil!'
                              : 'Incompatível com seu perfil',
                          reasoning: _report!.reasoning,
                        ),
                      if (_neutralMessage != null && !_isLoading)
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(top: 8),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _neutralMessage!,
                            key: const Key('scanner-neutral-message'),
                            style: const TextStyle(color: AppColors.textMutedLight, fontSize: 14),
                          ),
                        ),
                      if (!_isScanning && !_isLoading)
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: ElevatedButton(
                            onPressed: _reset,
                            child: const Text('📷 Escanear novo produto'),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
