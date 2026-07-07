// src/screens/SearchScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { searchProducts, checkCompatibility, Product, CompatibilityReport } from '../lib/api';
import { AlertBanner } from '../components/AlertBanner';

export function SearchScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [report, setReport] = useState<{ product: Product; compatibility: CompatibilityReport } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setReport(null);
    try {
      const result = await searchProducts(query.trim());
      setProducts(result.data);
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar produtos.');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleCheck = async (product: Product) => {
    if (!user) return;
    setIsChecking(true);
    setReport(null);
    try {
      const compatibility = await checkCompatibility(user.id, product.id);
      setReport({ product, compatibility });
      setProducts([]);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao verificar compatibilidade.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar Produto</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Nome ou marca do produto..."
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isSearching}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {isSearching && <ActivityIndicator color="#3b82f6" style={{ marginTop: 20 }} />}
      {isChecking && <ActivityIndicator color="#f59e0b" style={{ marginTop: 20 }} />}

      {report && (
        <View style={styles.reportContainer}>
          <Text style={styles.productName}>{report.product.name}</Text>
          <Text style={styles.productBrand}>{report.product.brand}</Text>
          <AlertBanner
            status={report.compatibility.riskLevel}
            message={report.compatibility.isCompatible ? 'Compatível com seu perfil' : 'Incompatível com seu perfil'}
            reasoning={report.compatibility.reasoning}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => setReport(null)}>
            <Text style={styles.backButtonText}>← Nova busca</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => handleCheck(item)}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productBrand}>{item.brand}</Text>
              <Text style={styles.productStatus}>
                {item.hasGluten ? '⚠️ Contém Glúten' : '✅ Sem Glúten declarado'}
              </Text>
            </View>
            <Text style={styles.checkArrow}>Verificar →</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isSearching && query ? (
            <Text style={styles.emptyText}>Nenhum produto encontrado para "{query}"</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 20 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchButton: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: { fontSize: 20 },
  productCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productInfo: { flex: 1 },
  productName: { color: '#f1f5f9', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  productBrand: { color: '#64748b', fontSize: 13, marginBottom: 4 },
  productStatus: { color: '#94a3b8', fontSize: 12 },
  checkArrow: { color: '#3b82f6', fontSize: 13, fontWeight: 'bold', marginLeft: 12 },
  emptyText: { color: '#475569', fontSize: 14, textAlign: 'center', marginTop: 40 },
  reportContainer: { marginBottom: 16 },
  backButton: { marginTop: 12 },
  backButtonText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 14 },
});
