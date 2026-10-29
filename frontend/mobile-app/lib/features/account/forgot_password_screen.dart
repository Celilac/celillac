import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/brand_logo.dart';
import 'account_error_messages.dart';
import 'reset_password_screen.dart';
import 'widgets/busy_label.dart';
import 'widgets/status_message.dart';

/// "Esqueci minha senha" (rota pública). Anti-enumeração: em caso de sucesso
/// exibe sempre a mensagem genérica do backend, exista ou não a conta.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  static const fallbackMessage =
      'Se o e-mail estiver cadastrado, você receberá o código em instantes.';

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _isLoading = false;
  String? _successMessage;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _emailController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  String get _email => _emailController.text.trim().toLowerCase();

  bool get _canSubmit => !_isLoading && _email.isNotEmpty;

  Future<void> _submit() async {
    final api = context.read<ApiClient>();
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });
    try {
      final response = await api.requestPasswordReset(_email);
      if (!mounted) return;
      setState(() {
        _successMessage =
            response.message.isNotEmpty ? response.message : ForgotPasswordScreen.fallbackMessage;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() => _errorMessage = AccountErrorMessages.passwordResetRequest(err));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openReset() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => ResetPasswordScreen(initialEmail: _email)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recuperar senha')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const BrandLogo(),
              const Text(
                'Informe o e-mail cadastrado. Enviaremos um código de 6 dígitos para você redefinir sua senha com segurança.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMutedLight, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _emailController,
                enabled: !_isLoading,
                keyboardType: TextInputType.emailAddress,
                textCapitalization: TextCapitalization.none,
                autofillHints: const [AutofillHints.email],
                decoration: const InputDecoration(hintText: 'E-mail'),
                style: const TextStyle(color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              if (_errorMessage != null) ...[
                StatusMessage(key: const Key('forgot-error-message'), text: _errorMessage!, isError: true),
                const SizedBox(height: 16),
              ],
              if (_successMessage != null) ...[
                StatusMessage(key: const Key('forgot-success-message'), text: _successMessage!),
                const SizedBox(height: 16),
              ],
              ElevatedButton(
                onPressed: _canSubmit ? _submit : null,
                child: BusyLabel(label: 'Enviar código', busy: _isLoading),
              ),
              if (_successMessage != null) ...[
                const SizedBox(height: 12),
                ElevatedButton(onPressed: _openReset, child: const Text('Já tenho o código')),
              ],
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.of(context).maybePop(),
                child: const Text('Voltar para o login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
