// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BrandLogo } from '../components/BrandLogo';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

interface Props {
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onNavigateToLogin }: Props) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrengthMessage = password && !STRONG_PASSWORD_REGEX.test(password)
    ? 'Use 8+ caracteres com maiúscula, minúscula, número e símbolo.'
    : '';

  const confirmMessage = confirm && password !== confirm
    ? 'As senhas devem ser iguais.'
    : '';

  const isSubmitDisabled = isLoading
    || !email.trim()
    || !password.trim()
    || !confirm.trim()
    || Boolean(passwordStrengthMessage)
    || Boolean(confirmMessage);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      Alert.alert('Atenção', 'Use uma senha forte com 8+ caracteres, letra maiúscula, minúscula, número e símbolo.');
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
          <BrandLogo />
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
          <View style={styles.passwordField}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Use uma senha forte"
              placeholderTextColor="#64748b"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.visibilityButton}
              onPress={() => setShowPassword((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Text style={styles.visibilityIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={passwordStrengthMessage ? styles.errorText : styles.helperText}>
            {passwordStrengthMessage || 'Use 8+ caracteres com maiúscula, minúscula, número e símbolo.'}
          </Text>

          <View style={styles.passwordField}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirmar senha"
              placeholderTextColor="#64748b"
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.visibilityButton}
              onPress={() => setShowConfirm((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={showConfirm ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
            >
              <Text style={styles.visibilityIcon}>{showConfirm ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {confirmMessage ? <Text style={styles.errorText}>{confirmMessage}</Text> : null}

          <View style={styles.roleInfo}>
            <Text style={styles.roleText}>🏷️ Conta criada como <Text style={styles.roleHighlight}>Celíaco</Text></Text>
          </View>

          <TouchableOpacity style={[styles.button, isSubmitDisabled && styles.buttonDisabled]} onPress={handleRegister} disabled={isSubmitDisabled}>
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
  passwordField: {
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  passwordInput: {
    width: '100%',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    borderRadius: 10,
    paddingLeft: 16,
    paddingRight: 52,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  visibilityButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityIcon: {
    fontSize: 18,
  },
  helperText: {
    width: '100%',
    color: '#64748b',
    fontSize: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  errorText: {
    width: '100%',
    color: '#f87171',
    fontSize: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
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
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 20 },
  linkText: { color: '#64748b', fontSize: 14 },
  linkHighlight: { color: '#3b82f6', fontWeight: 'bold' },
});
