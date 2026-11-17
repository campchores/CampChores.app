import { Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react-native';import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CampChoresLogo } from '@/src/components/CampChoresLogo';
import { FormField, PrimaryButton } from '@/src/components/UI';
import { useApp } from '@/src/context/AppContext';
import { colors, spacing } from '@/src/theme';

export default function LoginScreen() {
  const { signIn, enterGuestMode, status, user } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (user || status === 'authenticated') router.replace('/(tabs)');
  }, [status, user]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Informe seu e-mail e senha para entrar.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = () => {
    enterGuestMode();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <CampChoresLogo variant="white" />
          <View style={styles.heroCaption}>
            <Sparkles color={colors.white} size={16} />
            <Text style={styles.heroCaptionText}>Serviços domésticos de forma simples e segura</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Bem-vindo de volta</Text>
          <Text style={styles.subtitle}>Encontre ajuda para sua casa ou divulgue seu trabalho.</Text>

          <View style={styles.form}>
            <View style={styles.inputWithIcon}>
              <Mail color={colors.muted} size={19} />
              <FormField label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com" autoCapitalize="none" keyboardType="email-address" style={styles.hiddenInput} />
            </View>
            <View style={styles.inputWithIcon}>
              <LockKeyhole color={colors.muted} size={19} />
              <FormField label="Senha" value={password} onChangeText={setPassword} placeholder="Digite sua senha" secureTextEntry={!showPassword} style={styles.hiddenInput} />
              <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={10} style={styles.eyeButton} accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <EyeOff color={colors.muted} size={20} /> : <Eye color={colors.muted} size={20} />}
              </Pressable>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable style={styles.forgotButton} onPress={() => setError('Para redefinir sua senha, entre em contato com o suporte CampChores.')}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </Pressable>
            <PrimaryButton label={busy ? 'Entrando...' : 'Entrar'} onPress={handleLogin} disabled={busy} />
          </View>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>ou</Text>
            <View style={styles.orLine} />
          </View>

          <PrimaryButton label="Entrar sem conta" onPress={handleGuest} variant="ghost" icon={<UserRound color={colors.primary} size={18} />} />
          <Text style={styles.demoHint}>Você poderá navegar, mas não contratar nem publicar serviços.</Text>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Ainda não possui uma conta?</Text>
            <Link href="/cadastro" asChild>
              <Pressable><Text style={styles.signupLink}>Cadastre-se</Text></Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  hero: { minHeight: 280, alignItems: 'center', justifyContent: 'center', paddingTop: 44, gap: 18, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#3EA0FF', opacity: 0.35, top: -115, right: -95 },
  heroCaption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24 },
  heroCaptionText: { color: colors.white, fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center' },
  card: { flex: 1, backgroundColor: colors.page, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.lg, paddingTop: 30, gap: 14 },
  title: { color: colors.primaryDeep, fontFamily: 'Inter_700Bold', fontSize: 26 },
  subtitle: { color: colors.muted, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  form: { gap: 16, marginTop: 8 },
  inputWithIcon: { position: 'relative', gap: 0 },
  hiddenInput: { paddingLeft: 45, paddingRight: 44 },
  eyeButton: { position: 'absolute', right: 16, bottom: 16 },
  errorText: { color: colors.error, fontFamily: 'Inter_400Regular', fontSize: 13 },
  forgotButton: { alignSelf: 'flex-end' },
  forgotText: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.line },
  orText: { color: colors.muted, fontFamily: 'Inter_400Regular', fontSize: 12 },
  demoHint: { color: colors.muted, fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  signupText: { color: colors.muted, fontFamily: 'Inter_400Regular', fontSize: 13 },
  signupLink: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13 },
});
