// src/screens/OnboardingProfileScreen.tsx
// Tela de configuração do perfil alimentar no pós-cadastro.
// Fluxo: POST /food-profile — conforme API_CONTRACTS.md seção 3.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { createFoodProfile, AllergenType, SeverityLevel } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RestrictionChip } from '../components/RestrictionChip';

const ALLERGENS: { key: AllergenType; label: string; emoji: string }[] = [
  { key: 'GLUTEN',    label: 'Glúten',        emoji: '🌾' },
  { key: 'LACTOSE',   label: 'Lactose',        emoji: '🥛' },
  { key: 'NUTS',      label: 'Castanhas',      emoji: '🥜' },
  { key: 'SOY',       label: 'Soja',           emoji: '🫘' },
  { key: 'EGGS',      label: 'Ovos',           emoji: '🥚' },
  { key: 'SHELLFISH', label: 'Frutos do Mar',  emoji: '🦐' },
  { key: 'FISH',      label: 'Peixe',          emoji: '🐟' },
  { key: 'SESAME',    label: 'Gergelim',       emoji: '🌰' },
];

const SEVERITIES: { key: SeverityLevel; label: string; desc: string; color: string }[] = [
  { key: 'LOW',    label: 'Baixa',  desc: 'Sensibilidade leve',      color: '#22c55e' },
  { key: 'MEDIUM', label: 'Média',  desc: 'Intolerância moderada',   color: '#f59e0b' },
  { key: 'HIGH',   label: 'Alta',   desc: 'Alergia severa',          color: '#f97316' },
  { key: 'FATAL',  label: 'FATAL',  desc: 'Doença celíaca / grave',  color: '#ef4444' },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingProfileScreen({ onComplete }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Record<AllergenType, SeverityLevel | null>>(
    {} as Record<AllergenType, SeverityLevel | null>
  );
  const [isLoading, setIsLoading] = useState(false);

  const toggleAllergen = (key: AllergenType) => {
    setSelected(prev => {
      if (prev[key] !== undefined && prev[key] !== null) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: 'MEDIUM' };
    });
  };

  const setSeverity = (allergen: AllergenType, severity: SeverityLevel) => {
    setSelected(prev => ({ ...prev, [allergen]: severity }));
  };

  const selectedList = Object.entries(selected)
    .filter(([, sev]) => sev !== null)
    .map(([allergen, severity]) => ({ allergen: allergen as AllergenType, severity: severity as SeverityLevel }));

  const handleSave = async () => {
    if (selectedList.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos uma restrição alimentar.');
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      const profile = await createFoodProfile({ userId: user.id, restrictions: selectedList });
      // Conforme API_CONTRACTS.md: exibir aviso se requiresHistoryRevalidation = true
      if (profile.requiresHistoryRevalidation) {
        Alert.alert(
          '⚠️ Atenção',
          'Seu perfil contém restrições FATAIS. Verificações anteriores de produtos devem ser refeitas.',
          [{ text: 'Entendido', onPress: onComplete }]
        );
      } else {
        onComplete();
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar o perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && <LoadingSpinner message="Salvando perfil..." />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Seu Perfil Alimentar</Text>
        <Text style={styles.subtitle}>Selecione seus alérgenos e a gravidade de cada restrição</Text>

        {ALLERGENS.map(({ key, label, emoji }) => {
          const isSelected = selected[key] !== undefined;
          const currentSeverity = selected[key] as SeverityLevel | undefined;
          return (
            <View key={key} style={styles.allergenCard}>
              <TouchableOpacity
                style={[styles.allergenHeader, isSelected && styles.allergenHeaderActive]}
                onPress={() => toggleAllergen(key)}
              >
                <Text style={styles.allergenEmoji}>{emoji}</Text>
                <Text style={styles.allergenLabel}>{label}</Text>
                <Text style={styles.allergenCheck}>{isSelected ? '✓' : '+'}</Text>
              </TouchableOpacity>

              {isSelected && (
                <View style={styles.severityRow}>
                  {SEVERITIES.map(s => (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.severityButton,
                        { borderColor: s.color },
                        currentSeverity === s.key && { backgroundColor: s.color },
                      ]}
                      onPress={() => setSeverity(key, s.key)}
                    >
                      <Text style={[
                        styles.severityText,
                        currentSeverity === s.key && styles.severityTextActive,
                      ]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {selectedList.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Resumo das restrições:</Text>
            <View style={styles.chipRow}>
              {selectedList.map(r => (
                <RestrictionChip key={r.allergen} allergen={r.allergen} severity={r.severity} />
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={isLoading}>
          <Text style={styles.buttonText}>Salvar e Começar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 24, textAlign: 'center', lineHeight: 20 },
  allergenCard: { backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  allergenHeaderActive: { backgroundColor: '#1d3a5e' },
  allergenEmoji: { fontSize: 24 },
  allergenLabel: { flex: 1, color: '#e2e8f0', fontSize: 16, fontWeight: '600' },
  allergenCheck: { color: '#3b82f6', fontSize: 20, fontWeight: 'bold' },
  severityRow: { flexDirection: 'row', padding: 12, gap: 8, flexWrap: 'wrap' },
  severityButton: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  severityText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  severityTextActive: { color: '#fff' },
  summary: { marginTop: 16, marginBottom: 8 },
  summaryTitle: { color: '#94a3b8', fontSize: 13, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
