// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Props {
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onNavigateToLogin }: Props) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      await register({ email: email.trim().toLowerCase(), password, role: 'CELIACO' });
      // AuthContext navega automaticamente após login bem-sucedido
    } catch (err: any) {
      const msg = err.message?.includes('já está em uso')
        ? 'Este e-mail já possui uma conta. Faça login.'
        : 'Não foi possível criar a conta. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {isLoading && <LoadingSpinner message="Criando conta..." />}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Sua jornada segura começa aqui</Text>

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 8 caracteres)"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          <View style={styles.roleInfo}>
            <Text style={styles.roleText}>🏷️ Conta criada como <Text style={styles.roleHighlight}>Celíaco</Text></Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
            <Text style={styles.buttonText}>Cadastrar e Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={onNavigateToLogin}>
            <Text style={styles.linkText}>Já tem conta? <Text style={styles.linkHighlight}>Fazer login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 28, textAlign: 'center' },
  input: {
    width: '100%',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleInfo: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1d4ed8',
  },
  roleText: { color: '#94a3b8', fontSize: 13, textAlign: 'center' },
  roleHighlight: { color: '#3b82f6', fontWeight: 'bold' },
  button: {
    width: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 20 },
  linkText: { color: '#64748b', fontSize: 14 },
  linkHighlight: { color: '#3b82f6', fontWeight: 'bold' },
});
