import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/brand_logo.dart';
import 'account_error_messages.dart';
import 'widgets/otp_code_field.dart';
import 'widgets/busy_label.dart';
import 'widgets/status_message.dart';

/// Verificação de e-mail (rota autenticada). Fluxo opcional, aberto pelo
/// Perfil. Fecha com `true` quando o e-mail passa a estar verificado.
class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final _codeController = TextEditingController();
  bool _isVerifying = false;
  bool _isResending = false;
  String? _errorMessage;
  String? _infoMessage;

  bool get _isBusy => _isVerifying || _isResending;

  @override
  void initState() {
    super.initState();
    _codeController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final api = context.read<ApiClient>();
    final navigator = Navigator.of(context);
    setState(() {
      _isVerifying = true;
      _errorMessage = null;
      _infoMessage = null;
    });
    try {
      await api.verifyEmail(_codeController.text);
      if (!mounted) return;
      navigator.pop(true);
    } catch (err) {
      if (!mounted) return;
      setState(() => _errorMessage = AccountErrorMessages.emailVerify(err));
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resend() async {
    final api = context.read<ApiClient>();
    final navigator = Navigator.of(context);
    setState(() {
      _isResending = true;
      _errorMessage = null;
      _infoMessage = null;
    });
    try {
      await api.resendEmailVerification();
      if (!mounted) return;
      setState(() => _infoMessage = 'Pronto, enviamos um novo código para o seu e-mail.');
    } catch (err) {
      if (!mounted) return;
      if (AccountErrorMessages.isAlreadyVerified(err)) {
        navigator.pop(true);
        return;
      }
      setState(() => _errorMessage = AccountErrorMessages.emailResend(err));
    } finally {
      if (mounted) setState(() => _isResending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canVerify = !_isBusy && _codeController.text.length == otpLength;

    return Scaffold(
      appBar: AppBar(title: const Text('Verificar e-mail')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const BrandLogo(),
              const Text(
                'Informe o código de 6 dígitos enviado ao seu e-mail. Não recebeu? Toque em "Reenviar código".',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMutedLight, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 24),
              KeyedSubtree(
                key: const Key('otp-code'),
                child: OtpCodeField(controller: _codeController, enabled: !_isBusy),
              ),
              const SizedBox(height: 16),
              if (_errorMessage != null) ...[
                StatusMessage(key: const Key('verify-error-message'), text: _errorMessage!, isError: true),
                const SizedBox(height: 16),
              ],
              if (_infoMessage != null) ...[
                StatusMessage(key: const Key('verify-info-message'), text: _infoMessage!),
                const SizedBox(height: 16),
              ],
              ElevatedButton(
                onPressed: canVerify ? _verify : null,
                child: BusyLabel(label: 'Verificar e-mail', busy: _isVerifying),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: _isBusy ? null : _resend,
                child: BusyLabel(label: 'Reenviar código', busy: _isResending),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
