// src/components/RestrictionChip.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AllergenType, SeverityLevel } from '../lib/api';

interface Props {
  allergen: AllergenType;
  severity: SeverityLevel;
}

const ALLERGEN_LABELS: Record<AllergenType, string> = {
  GLUTEN: 'Glúten',
  LACTOSE: 'Lactose',
  NUTS: 'Castanhas',
  SOY: 'Soja',
  EGGS: 'Ovos',
  SHELLFISH: 'Frutos do Mar',
  FISH: 'Peixe',
  SESAME: 'Gergelim',
  OTHER: 'Outro',
};

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  LIFESTYLE: '#6366f1',
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  FATAL: '#ef4444',
};

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  LIFESTYLE: 'Estilo de vida',
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  FATAL: 'FATAL',
};

export function RestrictionChip({ allergen, severity }: Props) {
  const color = SEVERITY_COLORS[severity];
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={styles.allergenText}>{ALLERGEN_LABELS[allergen]}</Text>
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{SEVERITY_LABELS[severity]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#1e293b',
    gap: 8,
  },
  allergenText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
