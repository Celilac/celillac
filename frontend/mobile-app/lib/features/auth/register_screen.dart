import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/models/auth_models.dart';
import '../../api/models/enums.dart';
import '../../core/auth/session_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/widgets/loading_overlay.dart';

final _strongPasswordRegex =
    RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$');

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, required this.onNavigateToLogin});

  final VoidCallback onNavigateToLogin;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isLoading = false;
  bool _showPassword = false;
  bool _showConfirm = false;

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(() => setState(() {}));
    _confirmController.addListener(() => setState(() {}));
    _emailController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  String get _passwordStrengthMessage {
    final password = _passwordController.text;
    if (password.isNotEmpty && !_strongPasswordRegex.hasMatch(password)) {
      return 'Use 8+ caracteres com maiúscula, minúscula, número e símbolo.';
    }
    return '';
  }

  String get _confirmMessage {
    final confirm = _confirmController.text;
    if (confirm.isNotEmpty && _passwordController.text != confirm) {
      return 'As senhas devem ser iguais.';
    }
    return '';
  }

  bool get _isSubmitDisabled {
    return _isLoading ||
        _emailController.text.trim().isEmpty ||
        _passwordController.text.trim().isEmpty ||
        _confirmController.text.trim().isEmpty ||
        _passwordStrengthMessage.isNotEmpty ||
        _confirmMessage.isNotEmpty;
  }

  Future<void> _handleRegister() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final confirm = _confirmController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      _showMessage('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (password != confirm) {
      _showMessage('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (!_strongPasswordRegex.hasMatch(password)) {
      _showMessage(
        'Atenção',
        'Use uma senha forte com 8+ caracteres, letra maiúscula, minúscula, número e símbolo.',
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await context.read<SessionController>().register(
            RegisterPayload(email: email.toLowerCase(), password: password, role: UserRole.celiaco),
          );
      // SessionController navega automaticamente após login bem-sucedido.
    } catch (err) {
      final msg = err.toString().contains('já está em uso')
          ? 'Este e-mail já possui uma conta. Faça login.'
          : 'Não foi possível criar a conta. Tente novamente.';
      if (mounted) _showMessage('Erro', msg);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showMessage(String title, String message) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final passwordStrengthMessage = _passwordStrengthMessage;
    final confirmMessage = _confirmMessage;

    return Scaffold(
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const BrandLogo(),
                    const Text(
                      'Criar Conta',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Sua jornada segura começa aqui',
                      style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 28),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(hintText: 'E-mail'),
                      style: const TextStyle(color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _passwordController,
                      obscureText: !_showPassword,
                      decoration: InputDecoration(
                        hintText: 'Use uma senha forte',
                        suffixIcon: IconButton(
                          icon: Text(_showPassword ? '🙈' : '👁'),
                          onPressed: () => setState(() => _showPassword = !_showPassword),
                        ),
                      ),
                      style: const TextStyle(color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          passwordStrengthMessage.isNotEmpty
                              ? passwordStrengthMessage
                              : 'Use 8+ caracteres com maiúscula, minúscula, número e símbolo.',
                          style: TextStyle(
                            color: passwordStrengthMessage.isNotEmpty
                                ? const Color(0xFFF87171)
                                : AppColors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _confirmController,
                      obscureText: !_showConfirm,
                      decoration: InputDecoration(
                        hintText: 'Confirmar senha',
                        suffixIcon: IconButton(
                          icon: Text(_showConfirm ? '🙈' : '👁'),
                          onPressed: () => setState(() => _showConfirm = !_showConfirm),
                        ),
                      ),
                      style: const TextStyle(color: AppColors.textPrimary),
                    ),
                    if (confirmMessage.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          confirmMessage,
                          style: const TextStyle(color: Color(0xFFF87171), fontSize: 12),
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF1D4ED8)),
                      ),
                      child: RichText(
                        textAlign: TextAlign.center,
                        text: const TextSpan(
                          style: TextStyle(color: AppColors.textMutedLight, fontSize: 13),
                          children: [
                            TextSpan(text: '🏷️ Conta criada como '),
                            TextSpan(
                              text: 'Celíaco',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSubmitDisabled ? null : _handleRegister,
                        child: const Text('Cadastrar e Entrar'),
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextButton(
                      onPressed: widget.onNavigateToLogin,
                      child: RichText(
                        text: const TextSpan(
                          style: TextStyle(color: AppColors.textMuted, fontSize: 14),
                          children: [
                            TextSpan(text: 'Já tem conta? '),
                            TextSpan(
                              text: 'Fazer login',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
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
          ),
          if (_isLoading) const LoadingOverlay(message: 'Criando conta...'),
        ],
      ),
    );
  }
}
