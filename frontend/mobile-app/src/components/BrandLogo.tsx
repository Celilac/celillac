// src/components/BrandLogo.tsx
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface Props {
  size?: number;
}

/** Canonical CeLiLac mark. Source of truth: frontend/web-app/public/brand/logo_with_transparent_background.png */
export function BrandLogo({ size = 64 }: Props) {
  const badgeSize = size + 24;

  return (
    <View style={[styles.badge, { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}>
      <Image
        source={require('../../assets/images/brand/logo.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
