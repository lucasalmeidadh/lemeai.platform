import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthService } from './src/services/AuthService';
import ChatScreen from './src/screens/ChatScreen';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AuthService.getUser();
      if (userData) {
        setUser(userData);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoggingIn(true);
    try {
      const userData = await AuthService.login(email, password);
      setUser(userData);
    } catch (error: any) {
      Alert.alert('Acesso negado', 'Verifique suas credenciais.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setEmail('');
    setPassword('');
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: '#0a3d4d' }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (user) {
    return <ChatScreen onLogout={handleLogout} />;
  }

  return (
    <LinearGradient
      colors={['#0a3d4d', '#001f29']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.contentWrapper}>
            <View style={styles.formContainer}>
              <View style={styles.header}>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>LEME AI</Text>
                </View>
                <Text style={styles.brandTitle}>Bem-vindo de volta!</Text>
                <Text style={styles.brandSubtitle}>Acesse seu painel administrativo</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="nome@empresa.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loggingIn && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={loggingIn}
                  activeOpacity={0.8}
                >
                  {loggingIn ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={[styles.loginButtonText, { marginLeft: 8 }]}>Verificando...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>ACESSAR SISTEMA</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by GbCode</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: width > 400 ? 40 : 28,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandBadge: {
    backgroundColor: 'rgba(0, 95, 115, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 20,
  },
  brandBadgeText: {
    color: '#005f73',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  loginButton: {
    backgroundColor: '#005f73',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#005f73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  }
});
