import { Eye, EyeOff, LockKeyhole, Mail, Phone, User, UserPlus } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CampChoresLogo } from '@/src/components/CampChoresLogo';
import { PrimaryButton } from '@/src/components/UI';
import { useApp } from '@/src/context/AppContext';
import { useTheme } from '@/src/context/ThemeContext';

export default function RegisterScreen() {
  const { signUp } = useApp();
  const palette = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
      setError('Preencha todos os campos para criar sua conta.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Informe um telefone válido com DDD, por exemplo (19) 99999-9999.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      await signUp({ name: name.trim(), email: email.trim(), phone: phone.trim(), location: 'Campinas, SP', password });
      router.replace('/(tabs)');
    } catch (regError) {
      setError(regError instanceof Error ? regError.message : 'Não foi possível criar a conta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: palette.primary }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <CampChoresLogo variant="white" />
          <Text style={styles.heroSubtitle}>Crie sua conta para contratar ou publicar serviços na comunidade.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.page }]}>
          <Text style={[styles.title, { color: palette.primaryDeep }]}>Criar nova conta</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>É rápido, seguro e gratuito.</Text>

          <View style={styles.form}>
            {/* Campo Nome */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: palette.ink }]}>Nome completo</Text>
              <View style={[styles.inputContainer, { backgroundColor: palette.fieldBg, borderColor: palette.line }]}>
                <User color={palette.muted} size={19} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor={palette.muted}
                  style={[styles.input, { color: palette.ink }]}
                />
              </View>
            </View>

            {/* Campo E-mail */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: palette.ink }]}>E-mail</Text>
              <View style={[styles.inputContainer, { backgroundColor: palette.fieldBg, borderColor: palette.line }]}>
                <Mail color={palette.muted} size={19} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="voce@email.com"
                  placeholderTextColor={palette.muted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: palette.ink }]}
                />
              </View>
            </View>

            {/* Campo Telefone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: palette.ink }]}>Telefone</Text>
              <View style={[styles.inputContainer, { backgroundColor: palette.fieldBg, borderColor: palette.line }]}>
                <Phone color={palette.muted} size={19} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(19) 99999-9999"
                  placeholderTextColor={palette.muted}
                  keyboardType="phone-pad"
                  style={[styles.input, { color: palette.ink }]}
                />
              </View>
            </View>

            {/* Campo Senha */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: palette.ink }]}>Senha</Text>
              <View style={[styles.inputContainer, { backgroundColor: palette.fieldBg, borderColor: palette.line }]}>
                <LockKeyhole color={palette.muted} size={19} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={palette.muted}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { color: palette.ink }]}
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={10} style={styles.eyeButton}>
                  {showPassword ? <EyeOff color={palette.muted} size={20} /> : <Eye color={palette.muted} size={20} />}
                </Pressable>
              </View>
            </View>

            {error ? <Text style={[styles.errorText, { color: palette.error }]}>{error}</Text> : null}

            <PrimaryButton label={busy ? 'Criando conta...' : 'Cadastrar'} onPress={handleRegister} disabled={busy} icon={<UserPlus color="#FFFFFF" size={18} />} />
          </View>

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: palette.muted }]}>Já possui uma conta?</Text>
            <Link href="/" asChild>
              <Pressable><Text style={[styles.loginLink, { color: palette.primary }]}>Entrar</Text></Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  hero: { minHeight: 220, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 40, gap: 12 },
  heroSubtitle: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center', opacity: 0.9, maxWidth: 300 },
  card: { flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 30, gap: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  form: { gap: 14, marginTop: 4 },
  inputGroup: { gap: 6 },
  inputLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  inputContainer: { height: 52, borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  input: { flex: 1, height: '100%', fontFamily: 'Inter_400Regular', fontSize: 13 },
  eyeButton: { padding: 4 },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 12 },
  loginText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  loginLink: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});