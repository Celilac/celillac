// src/app/_layout.tsx
// Layout raiz da aplicação.
// Injeta o AuthProvider e implementa a guarda de rota.
import React from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuth, AuthProvider } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OnboardingProfileScreen } from '../screens/OnboardingProfileScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LoadingSpinner } from '../components/LoadingSpinner';

SplashScreen.preventAutoHideAsync();

type Screen = 'login' | 'register' | 'onboarding' | 'app';

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = React.useState<'login' | 'register'>('login');
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'scanner' | 'search' | 'profile'>('scanner');

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return <LoadingSpinner message="Iniciando CeLiLac..." />;

  // Telas públicas (não autenticado)
  if (!isAuthenticated) {
    if (authScreen === 'register') {
      return <RegisterScreen onNavigateToLogin={() => setAuthScreen('login')} />;
    }
    return <LoginScreen onNavigateToRegister={() => setAuthScreen('register')} />;
  }

  // Onboarding de perfil (pós-cadastro, sem perfil)
  if (needsOnboarding) {
    return <OnboardingProfileScreen onComplete={() => setNeedsOnboarding(false)} />;
  }

  // App autenticado com tabs
  return (
    <View style={styles.appContainer}>
      <View style={styles.content}>
        {activeTab === 'scanner' && <ScannerScreen />}
        {activeTab === 'search' && <SearchScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      <View style={styles.tabBar}>
        {([
          { key: 'scanner', icon: '📷', label: 'Scanner' },
          { key: 'search',  icon: '🔍', label: 'Buscar' },
          { key: 'profile', icon: '👤', label: 'Perfil' },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: 24,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    opacity: 0.5,
  },
  tabActive: { opacity: 1 },
  tabIcon: { fontSize: 22 },
  tabLabel: { color: '#64748b', fontSize: 11, marginTop: 4 },
  tabLabelActive: { color: '#3b82f6', fontWeight: 'bold' },
});
