import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, typography, shadows } from '../styles/theme';
import { useAuth } from '../hooks/useAuth';
import { register } from '../api/client';
import { useToast } from '../hooks/useToast';

export function LoginScreen({ onSwitch, onLoginSuccess }) {
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast('Заполните все поля', 'error');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      toast('✨ Добро пожаловать в AURA!', 'success');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      toast(err.message || 'Ошибка входа', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.brandTitle}>AURA</Text>
          <Text style={styles.brandSubtitle}>AI STYLIST</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Вход в аккаунт</Text>
          
          <Text style={styles.label}>Имя пользователя</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Введите ваш логин"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Введите пароль"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Войти ✨</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Нет аккаунта? </Text>
          <TouchableOpacity onPress={onSwitch}>
            <Text style={styles.footerLink}>Создать профиль</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function RegisterScreen({ onSwitch }) {
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      toast('Заполните обязательные поля (логин, email, пароль)', 'error');
      return;
    }
    if (form.password !== form.password2) {
      toast('Пароли не совпадают', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        password2: form.password2.trim(),
        first_name: form.first_name.trim(),
      });
      await login(form.username.trim(), form.password.trim());
      toast(response.message || '✨ Аккаунт успешно создан!', 'success');
    } catch (err) {
      toast(err.message || 'Ошибка регистрации', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.brandTitle}>AURA</Text>
          <Text style={styles.brandSubtitle}>AI STYLIST</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Регистрация</Text>

          <Text style={styles.label}>Имя пользователя (логин)*</Text>
          <TextInput
            style={styles.input}
            value={form.username}
            onChangeText={val => handleChange('username', val)}
            placeholder="User123"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={styles.input}
            value={form.first_name}
            onChangeText={val => handleChange('first_name', val)}
            placeholder="Ваше имя"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Email*</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={val => handleChange('email', val)}
            placeholder="email@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Пароль*</Text>
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={val => handleChange('password', val)}
            placeholder="Придумайте пароль"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Повторите пароль*</Text>
          <TextInput
            style={styles.input}
            value={form.password2}
            onChangeText={val => handleChange('password2', val)}
            placeholder="Повторите пароль"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Создать аккаунт ✨</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Уже есть профиль? </Text>
          <TouchableOpacity onPress={onSwitch}>
            <Text style={styles.footerLink}>Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 48,
    fontFamily: typography.titleBold,
    color: colors.roseDeep,
    letterSpacing: 10,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 6,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.roseDeep,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.muted,
    fontSize: 14,
  },
  footerLink: {
    color: colors.roseDeep,
    fontWeight: '700',
    fontSize: 14,
  },
});
