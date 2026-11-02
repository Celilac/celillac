import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../profile/profile_screen.dart';
import '../scanner/scanner_screen.dart';
import '../search/search_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

/// Aba da navegação inferior. Para adicionar uma aba nova basta incluir uma
/// entrada em [_tabs]; [builder] recebe se a aba está ativa (ex.: Scanner
/// liga/desliga a câmera).
class _HomeTab {
  const _HomeTab({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.builder,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final Widget Function(bool isActive) builder;
}

final _tabs = <_HomeTab>[
  _HomeTab(
    icon: Icons.qr_code_scanner_outlined,
    activeIcon: Icons.qr_code_scanner,
    label: 'Scanner',
    builder: (isActive) => ScannerScreen(isActive: isActive),
  ),
  _HomeTab(
    icon: Icons.search,
    activeIcon: Icons.search,
    label: 'Buscar',
    builder: (_) => const SearchScreen(),
  ),
  _HomeTab(
    icon: Icons.person_outline,
    activeIcon: Icons.person,
    label: 'Perfil',
    builder: (_) => const ProfileScreen(),
  ),
];

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          for (var i = 0; i < _tabs.length; i++) _tabs[i].builder(_currentIndex == i),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textMuted,
        selectedFontSize: 11,
        unselectedFontSize: 11,
        items: [
          for (final tab in _tabs)
            BottomNavigationBarItem(
              icon: Icon(tab.icon),
              activeIcon: Icon(tab.activeIcon),
              label: tab.label,
            ),
        ],
      ),
    );
  }
}
