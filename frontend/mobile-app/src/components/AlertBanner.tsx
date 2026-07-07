// src/components/AlertBanner.tsx (atualizado)
// Conforme FRONTEND_STRATEGY.md: alertas devem ter ícones e exibir o campo "reasoning"
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RiskLevel } from '../lib/api';

interface AlertBannerProps {
  status: RiskLevel;
  message: string;
  reasoning?: string;
}

const CONFIG: Record<RiskLevel, { bg: string; icon: string; label: string }> = {
  SAFE:    { bg: '#166534', icon: '✅', label: 'SEGURO' },
  WARNING: { bg: '#92400e', icon: '🟡', label: 'ATENÇÃO' },
  DANGER:  { bg: '#9a3412', icon: '⚠️', label: 'PERIGO' },
  BLOCKED: { bg: '#7f1d1d', icon: '⛔', label: 'BLOQUEADO' },
};

export function AlertBanner({ status, message, reasoning }: AlertBannerProps) {
  const { bg, icon, label } = CONFIG[status];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      {reasoning && <Text style={styles.reasoning}>{reasoning}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  message: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  reasoning: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
});
