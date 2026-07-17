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

class _Tab {
  const _Tab(this.icon, this.label);

  final String icon;
  final String label;
}

const _tabs = [
  _Tab('📷', 'Scanner'),
  _Tab('🔍', 'Buscar'),
  _Tab('👤', 'Perfil'),
];

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          ScannerScreen(isActive: _currentIndex == 0),
          const SearchScreen(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: List.generate(_tabs.length, (index) {
              final tab = _tabs[index];
              final isActive = _currentIndex == index;
              return Expanded(
                child: InkWell(
                  onTap: () => setState(() => _currentIndex = index),
                  child: Opacity(
                    opacity: isActive ? 1 : 0.5,
                    child: Column(
                      children: [
                        Text(tab.icon, style: const TextStyle(fontSize: 22)),
                        const SizedBox(height: 4),
                        Text(
                          tab.label,
                          style: TextStyle(
                            color: isActive ? AppColors.primary : AppColors.textMuted,
                            fontSize: 11,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
