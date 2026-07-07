// src/screens/ScannerScreen.tsx (atualizado)
// userId hardcoded REMOVIDO — obtido via AuthContext conforme regras do projeto
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../context/AuthContext';
import { searchProducts, checkCompatibility, CompatibilityReport } from '../lib/api';
import { AlertBanner } from '../components/AlertBanner';

export function ScannerScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [report, setReport] = useState<CompatibilityReport | null>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos da sua permissão para usar a câmera.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (!isScanning || !user) return;
    setIsScanning(false);
    setScannedCode(data);
    setIsLoading(true);
    setReport(null);
    setProductName(null);

    try {
      // 1. Busca produto pelo EAN no catálogo
      const catalog = await searchProducts(data);
      const product = catalog.data[0];

      if (!product) {
        setProductName('Produto desconhecido');
        setReport({
          isCompatible: false,
          riskLevel: 'BLOCKED',
          reasoning: 'Este produto não está no catálogo CeLiLac. Não é possível verificar a segurança.',
          conflicts: [],
        });
        return;
      }

      setProductName(product.name);

      // 2. Verifica compatibilidade com o perfil do usuário (NUNCA calcular localmente)
      const compatibility = await checkCompatibility(user.id, product.id);
      setReport(compatibility);
    } catch (err: any) {
      Alert.alert('Atenção', 'Não foi possível verificar o produto. Verifique sua conexão.');
      setReport({
        isCompatible: false,
        riskLevel: 'WARNING',
        reasoning: 'Falha de comunicação com o servidor. Não consuma sem verificação manual.',
        conflicts: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setScannedCode(null);
    setReport(null);
    setProductName(null);
    setIsScanning(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌾 CeLiLac Scanner</Text>

      <View style={styles.cameraContainer}>
        {isScanning ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr'] }}
          />
        ) : (
          <View style={styles.pausedCamera}>
            <Text style={styles.pausedText}>📷 Câmera Pausada</Text>
          </View>
        )}
        {/* Guia visual de mira */}
        {isScanning && (
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Aponte para o código de barras</Text>
          </View>
        )}
      </View>

      <View style={styles.resultContainer}>
        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#3b82f6" size="large" />
            <Text style={styles.loadingText}>Verificando segurança...</Text>
          </View>
        )}

        {scannedCode && !isLoading && (
          <Text style={styles.scannedText}>EAN: {scannedCode}</Text>
        )}

        {productName && !isLoading && (
          <Text style={styles.productName}>{productName}</Text>
        )}

        {report && !isLoading && (
          <AlertBanner
            status={report.riskLevel}
            message={report.isCompatible ? 'Compatível com seu perfil!' : 'Incompatível com seu perfil'}
            reasoning={report.reasoning}
          />
        )}

        {!isScanning && !isLoading && (
          <TouchableOpacity style={styles.button} onPress={reset}>
            <Text style={styles.buttonText}>📷 Escanear novo produto</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 20, marginTop: 10 },
  message: { color: '#f1f5f9', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  cameraContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginBottom: 24,
    position: 'relative',
  },
  pausedCamera: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  pausedText: { color: '#64748b', fontSize: 16 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 220,
    height: 120,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: 'rgba(241, 245, 249, 0.8)',
    fontSize: 12,
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultContainer: { width: '100%', alignItems: 'center' },
  loadingBox: { alignItems: 'center', marginVertical: 16, gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  scannedText: { color: '#475569', marginBottom: 4, fontSize: 12 },
  productName: { color: '#f1f5f9', fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
