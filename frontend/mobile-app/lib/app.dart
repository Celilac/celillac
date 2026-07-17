import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'api/api_client.dart';
import 'core/auth/session_controller.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/home/home_shell.dart';
import 'features/onboarding/onboarding_profile_screen.dart';
import 'shared/widgets/loading_overlay.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    final apiClient = ApiClient();
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: apiClient),
        ChangeNotifierProvider<SessionController>(
          create: (_) => SessionController(apiClient: apiClient)..restoreSession(),
        ),
      ],
      child: MaterialApp(
        title: 'CeLiLac',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        home: const AuthGate(),
      ),
    );
  }
}

enum _AuthScreen { login, register }

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  _AuthScreen _authScreen = _AuthScreen.login;

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();

    if (session.isLoading) {
      return const Scaffold(body: LoadingOverlay(message: 'Iniciando CeLiLac...'));
    }

    if (!session.isAuthenticated) {
      if (_authScreen == _AuthScreen.register) {
        return RegisterScreen(
          onNavigateToLogin: () => setState(() => _authScreen = _AuthScreen.login),
        );
      }
      return LoginScreen(
        onNavigateToRegister: () => setState(() => _authScreen = _AuthScreen.register),
      );
    }

    if (session.foodProfileError != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Não foi possível verificar seu perfil alimentar.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 16),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Verifique sua conexão e tente novamente.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: session.refreshFoodProfileStatus,
                  child: const Text('Tentar novamente'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (session.hasFoodProfile == null) {
      return const Scaffold(body: LoadingOverlay(message: 'Verificando perfil alimentar...'));
    }

    if (session.hasFoodProfile == false) {
      return OnboardingProfileScreen(onComplete: session.refreshFoodProfileStatus);
    }

    return const HomeShell();
  }
}
