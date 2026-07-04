import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { AlertBanner } from '../components/AlertBanner';

export function ScannerScreen() {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  // Funcionalidade simulada para o MVP
  const handleSimulateScan = (type: 'SAFE' | 'BLOCKED') => {
    setScannedCode(type === 'SAFE' ? '7891234567890 (Maçã)' : '7890987654321 (Pão)');
    
    if (type === 'SAFE') {
      setReport({
        status: 'SAFE',
        message: 'COMPATÍVEL! Pode consumir sem medo.'
      });
    } else {
      setReport({
        status: 'BLOCKED',
        message: 'ALERTA FATAL! Contém Glúten.'
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CeLiLac Scanner</Text>
      
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.cameraText}>[ Área da Câmera - expo-camera ]</Text>
        <Text style={styles.instruction}>Aponte para o código de barras</Text>
      </View>

      <View style={styles.controls}>
        <Button title="Simular Produto Seguro" onPress={() => handleSimulateScan('SAFE')} />
        <View style={{ height: 10 }} />
        <Button title="Simular Produto Bloqueado" color="#ef4444" onPress={() => handleSimulateScan('BLOCKED')} />
      </View>

      {scannedCode && (
        <View style={styles.resultContainer}>
          <Text style={styles.scannedText}>Lido: {scannedCode}</Text>
          {report && <AlertBanner status={report.status} message={report.message} />}
        </View>
      )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  cameraPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#16213e',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    marginBottom: 30,
  },
  cameraText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instruction: {
    color: '#94a3b8',
  },
  controls: {
    width: '100%',
    marginBottom: 30,
  },
  resultContainer: {
    width: '100%',
    alignItems: 'center',
  },
  scannedText: {
    color: '#fff',
    marginBottom: 10,
  }
});
