import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../orders/orders_screen.dart';
import '../partners/partners_screen.dart';
import '../profile/profile_screen.dart';
import '../scanner/scanner_screen.dart';
import '../search/search_screen.dart';
import 'home_screen.dart';
import 'home_tab.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

/// Aba da navegação inferior. Para adicionar uma aba nova basta incluir o valor
/// em [HomeTab] e uma entrada em [_tabs]; [builder] recebe se a aba está ativa
/// (ex.: Scanner liga/desliga a câmera) e como pedir a troca de aba.
class _HomeTab {
  const _HomeTab({
    required this.id,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.builder,
    this.lazy = false,
  });

  final HomeTab id;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final Widget Function(bool isActive, ValueChanged<HomeTab> selectTab) builder;

  /// Só constrói a tela na primeira visita (depois ela é mantida).
  final bool lazy;
}

final _tabs = <_HomeTab>[
  _HomeTab(
    id: HomeTab.home,
    icon: Icons.home_outlined,
    activeIcon: Icons.home,
    label: 'Início',
    builder: (isActive, selectTab) => HomeScreen(isActive: isActive, onSelectTab: selectTab),
  ),
  _HomeTab(
    id: HomeTab.scanner,
    icon: Icons.qr_code_scanner_outlined,
    activeIcon: Icons.qr_code_scanner,
    label: 'Scanner',
    builder: (isActive, _) => ScannerScreen(isActive: isActive),
    // Nascendo já ativo, só o MobileScanner inicia a câmera; criado inativo, o
    // primeiro acesso dispararia um segundo start() concorrente.
    lazy: true,
  ),
  _HomeTab(
    id: HomeTab.search,
    icon: Icons.search,
    activeIcon: Icons.search,
    label: 'Buscar',
    builder: (_, _) => const SearchScreen(),
  ),
  _HomeTab(
    id: HomeTab.partners,
    icon: Icons.storefront_outlined,
    activeIcon: Icons.storefront,
    label: 'Parceiros',
    builder: (_, _) => const PartnersScreen(),
  ),
  _HomeTab(
    id: HomeTab.orders,
    icon: Icons.receipt_long_outlined,
    activeIcon: Icons.receipt_long,
    label: 'Pedidos',
    builder: (isActive, _) => OrdersScreen(isActive: isActive),
  ),
  _HomeTab(
    id: HomeTab.profile,
    icon: Icons.person_outline,
    activeIcon: Icons.person,
    label: 'Perfil',
    builder: (isActive, _) => ProfileScreen(isActive: isActive),
  ),
];

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;
  final _visited = <int>{0};

  void _select(int index) => setState(() {
        _currentIndex = index;
        _visited.add(index);
      });

  void _selectTab(HomeTab tab) => _select(_tabs.indexWhere((t) => t.id == tab));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          for (var i = 0; i < _tabs.length; i++)
            if (_tabs[i].lazy && !_visited.contains(i))
              const SizedBox.shrink()
            else
              _tabs[i].builder(_currentIndex == i, _selectTab),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _select,
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
