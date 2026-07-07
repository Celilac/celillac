// src/screens/ProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFoodProfile, FoodProfile } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RestrictionChip } from '../components/RestrictionChip';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<FoodProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getFoodProfile(user.id);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) return <LoadingSpinner message="Carregando perfil..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.role}>{user?.role ?? 'CELIACO'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Restrições Alimentares</Text>
        {profile && profile.restrictions.length > 0 ? (
          <View style={styles.chipRow}>
            {profile.restrictions.map(r => (
              <RestrictionChip key={r.id ?? r.allergen} allergen={r.allergen} severity={r.severity} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhuma restrição cadastrada.</Text>
        )}
      </View>

      {profile?.requiresHistoryRevalidation && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            ⚠️ Seu perfil contém restrições FATAIS. Revalide verificações anteriores de produtos.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  avatar: { fontSize: 64 },
  role: { color: '#3b82f6', fontWeight: 'bold', fontSize: 14, letterSpacing: 1.5, marginTop: 8 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyText: { color: '#475569', fontSize: 14 },
  warningCard: {
    backgroundColor: '#7c2d12',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningText: { color: '#fef3c7', fontSize: 14, lineHeight: 20 },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 15 },
});
