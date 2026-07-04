import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AlertBanner } from '../components/AlertBanner';

export function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos da sua permissão para mostrar a câmera.</Text>
        <Button onPress={requestPermission} title="Conceder permissão" />
      </View>
    );
  }

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (!isScanning) return;
    setIsScanning(false);
    setScannedCode(data);

    try {
      // 1. Em um cenário real, buscaríamos o productId pelo EAN no backend.
      // Aqui vamos buscar no catálogo pelo código de barras como fallback ou apenas pegar o primeiro para o MVP.
      const catalogRes = await fetch(`http://10.0.2.2:3000/catalog?query=${data}`);
      
      let productId = 'mock-id';
      let productName = 'Produto Desconhecido';
      
      if (catalogRes.ok) {
        const products = await catalogRes.json();
        if (products.length > 0) {
          productId = products[0].id;
          productName = products[0].name;
        }
      }

      // 2. Checar compatibilidade
      const checkRes = await fetch('http://10.0.2.2:3000/compatibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'aed052fa-b410-440b-a1f4-2a73268bae49', // Hardcoded temporário
          productId: productId,
        })
      });

      if (!checkRes.ok) throw new Error('Falha na API');
      const compatibility = await checkRes.json();

      setReport({
        status: compatibility.riskLevel,
        message: compatibility.reasoning || productName,
      });

    } catch (err) {
      setReport({
        status: 'WARNING',
        message: 'Falha ao verificar. Tente novamente.',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CeLiLac Scanner</Text>
      
      <View style={styles.cameraContainer}>
        {isScanning ? (
          <CameraView 
            style={StyleSheet.absoluteFill} 
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "qr"],
            }}
          />
        ) : (
          <View style={styles.pausedCamera}>
            <Text style={styles.pausedText}>Câmera Pausada</Text>
            <Button title="Ler outro produto" onPress={() => {
              setScannedCode(null);
              setReport(null);
              setIsScanning(true);
            }} />
          </View>
        )}
      </View>

      <View style={styles.resultContainer}>
        {scannedCode && <Text style={styles.scannedText}>EAN Lido: {scannedCode}</Text>}
        {report && <AlertBanner status={report.status} message={report.message} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  cameraContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#16213e',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginBottom: 30,
  },
  pausedCamera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  pausedText: {
    color: '#fff',
    marginBottom: 20,
  },
  resultContainer: {
    width: '100%',
    alignItems: 'center',
    minHeight: 120,
  },
  scannedText: {
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: 'bold'
  }
});
