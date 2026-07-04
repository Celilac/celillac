import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AlertBannerProps {
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'BLOCKED';
  message: string;
}

export function AlertBanner({ status, message }: AlertBannerProps) {
  const getBackgroundColor = () => {
    switch (status) {
      case 'SAFE': return '#22c55e'; // Green
      case 'WARNING': return '#f59e0b'; // Amber
      case 'DANGER': return '#ef4444'; // Red
      case 'BLOCKED': return '#7f1d1d'; // Dark Red
      default: return '#3b82f6';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
