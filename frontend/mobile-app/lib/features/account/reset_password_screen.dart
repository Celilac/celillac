import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/account_models.dart';
import '../../core/theme/app_colors.dart';
import '../../core/validation/password_policy.dart';
import '../../shared/widgets/brand_logo.dart';
import 'account_error_messages.dart';
import 'widgets/otp_code_field.dart';
import 'widgets/busy_label.dart';
import 'widgets/status_message.dart';

/// "Redefinir senha" (rota pública): e-mail + código OTP + nova senha.
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, this.initialEmail = ''});

  final String initialEmail;

  static const successMessage = 'Senha redefinida com sucesso! Entre com sua nova senha.';

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  late final TextEditingController _emailController;
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isLoading = false;
  bool _showPassword = false;
  bool _showConfirm = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
    for (final c in [_emailController, _codeController, _passwordController, _confirmController]) {
      c.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  String get _passwordError {
    final password = _passwordController.text;
    return password.isNotEmpty && !isStrongPassword(password) ? passwordPolicyHint : '';
  }

  String get _confirmError {
    final confirm = _confirmController.text;
    return confirm.isNotEmpty && confirm != _passwordController.text ? 'As senhas devem ser iguais.' : '';
  }

  bool get _canSubmit =>
      !_isLoading &&
      _emailController.text.trim().isNotEmpty &&
      _codeController.text.length == otpLength &&
      isStrongPassword(_passwordController.text) &&
      _passwordController.text == _confirmController.text;

  Future<void> _submit() async {
    final api = context.read<ApiClient>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      await api.confirmPasswordReset(
        ConfirmPasswordResetPayload(
          email: _emailController.text.trim().toLowerCase(),
          code: _codeController.text,
          newPassword: _passwordController.text,
        ),
      );
      if (!mounted) return;
      navigator.popUntil((route) => route.isFirst);
      messenger.showSnackBar(const SnackBar(content: Text(ResetPasswordScreen.successMessage)));
    } catch (err) {
      if (!mounted) return;
      setState(() => _errorMessage = AccountErrorMessages.passwordResetConfirm(err));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _visibilityToggle(bool visible, VoidCallback onTap) => IconButton(
        icon: Icon(visible ? Icons.visibility_off_outlined : Icons.visibility_outlined),
        tooltip: visible ? 'Ocultar senha' : 'Mostrar senha',
        onPressed: onTap,
      );

  @override
  Widget build(BuildContext context) {
    final passwordError = _passwordError;
    final confirmError = _confirmError;

    return Scaffold(
      appBar: AppBar(title: const Text('Redefinir senha')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const BrandLogo(),
              const Text(
                'Digite o código de 6 dígitos que você recebeu por e-mail e crie sua nova senha.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMutedLight, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 24),
              TextField(
                key: const Key('reset-email'),
                controller: _emailController,
                enabled: !_isLoading,
                keyboardType: TextInputType.emailAddress,
                textCapitalization: TextCapitalization.none,
                decoration: const InputDecoration(hintText: 'E-mail'),
                style: const TextStyle(color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),
              KeyedSubtree(
                key: const Key('reset-code'),
                child: OtpCodeField(controller: _codeController, enabled: !_isLoading),
              ),
              const SizedBox(height: 12),
              TextField(
                key: const Key('reset-password'),
                controller: _passwordController,
                enabled: !_isLoading,
                obscureText: !_showPassword,
                autocorrect: false,
                enableSuggestions: false,
                decoration: InputDecoration(
                  hintText: 'Nova senha',
                  suffixIcon: _visibilityToggle(_showPassword, () => setState(() => _showPassword = !_showPassword)),
                ),
                style: const TextStyle(color: AppColors.textPrimary),
              ),
              const SizedBox(height: 4),
              Text(
                passwordError.isNotEmpty ? passwordError : passwordPolicyHint,
                key: passwordError.isNotEmpty ? const Key('password-strength-error') : null,
                style: TextStyle(
                  color: passwordError.isNotEmpty ? const Color(0xFFF87171) : AppColors.textMuted,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                key: const Key('reset-confirm'),
                controller: _confirmController,
                enabled: !_isLoading,
                obscureText: !_showConfirm,
                autocorrect: false,
                enableSuggestions: false,
                decoration: InputDecoration(
                  hintText: 'Confirmar nova senha',
                  suffixIcon: _visibilityToggle(_showConfirm, () => setState(() => _showConfirm = !_showConfirm)),
                ),
                style: const TextStyle(color: AppColors.textPrimary),
              ),
              if (confirmError.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(confirmError, style: const TextStyle(color: Color(0xFFF87171), fontSize: 12)),
              ],
              const SizedBox(height: 16),
              if (_errorMessage != null) ...[
                StatusMessage(key: const Key('reset-error-message'), text: _errorMessage!, isError: true),
                const SizedBox(height: 16),
              ],
              ElevatedButton(
                onPressed: _canSubmit ? _submit : null,
                child: BusyLabel(label: 'Redefinir senha', busy: _isLoading),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
