import { Eye, EyeOff, MapPin, UserRound } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CampChoresLogo } from '@/src/components/CampChoresLogo';
import { FormField, PrimaryButton } from '@/src/components/UI';
import { useApp } from '@/src/context/AppContext';
import { colors, spacing } from '@/src/theme';

export default function SignUpScreen() {
  const { signUp } = useApp();
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: 'Campinas, SP', password: '', confirmPassword: '' });
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSignUp = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) return setError('Preencha todos os campos obrigatórios.');
    if (form.password.length < 6) return setError('Sua senha deve ter pelo menos 6 caracteres.');
    if (form.password !== form.confirmPassword) return setError('As senhas precisam ser iguais.');
    if (!accepted) return setError('Aceite os termos para continuar.');
    setBusy(true);
    setError('');
    try {
      await signUp({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, location: form.location.trim() || 'Campinas, SP', password: form.password });
      router.replace('/(tabs)');
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : 'Não foi possível criar a conta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
          <CampChoresLogo variant="white" compact />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Criar uma conta</Text>
          <Text style={styles.subtitle}>Preencha os campos corretamente para começar.</Text>
          <View style={styles.form}>
            <View style={styles.iconField}><UserRound color={colors.muted} size={18} style={styles.fieldIcon} /><FormField label="Nome completo" placeholder="Como podemos chamar você?" value={form.name} onChangeText={(value) => update('name', value)} style={styles.iconInput} /></View>
            <FormField label="E-mail" placeholder="voce@email.com" value={form.email} onChangeText={(value) => update('email', value)} keyboardType="email-address" autoCapitalize="none" />
            <FormField label="Número de telefone" placeholder="(19) 99999-9999" value={form.phone} onChangeText={(value) => update('phone', formatPhone(value))} keyboardType="phone-pad" />
            <View style={styles.iconField}><MapPin color={colors.muted} size={18} style={styles.fieldIcon} /><FormField label="Cidade e Estado" placeholder="Campinas, SP" value={form.location} onChangeText={(value) => update('location', value)} style={styles.iconInput} /></View>
            <View style={styles.passwordField}><FormField label="Senha" placeholder="Mínimo de 6 caracteres" value={form.password} onChangeText={(value) => update('password', value)} secureTextEntry={!showPassword} style={styles.passwordInput} /><Pressable onPress={() => setShowPassword((current) => !current)} style={styles.passwordEye}>{showPassword ? <EyeOff color={colors.muted} size={19} /> : <Eye color={colors.muted} size={19} />}</Pressable></View>
            <View style={styles.passwordField}><FormField label="Confirmar senha" placeholder="Repita sua senha" value={form.confirmPassword} onChangeText={(value) => update('confirmPassword', value)} secureTextEntry={!showPassword} style={styles.passwordInput} /></View>
            <Pressable style={styles.termsRow} onPress={() => setAccepted((current) => !current)} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }}>
              <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>{accepted && <Text style={styles.checkmark}>✓</Text>}</View>
              <Text style={styles.termsText}>Eu concordo com os Termos de Serviço, Diretrizes de Segurança e Política de Privacidade.</Text>
            </Pressable>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <PrimaryButton label={busy ? 'Criando conta...' : 'Criar minha conta'} onPress={handleSignUp} disabled={busy} />
            <Text style={styles.idHint}>Sua Chave Primária CampChores será criada automaticamente, sem CPF.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  content: { flexGrow: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: 48, paddingBottom: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.white, fontSize: 32, lineHeight: 34, fontFamily: 'Inter_400Regular' },
  card: { flex: 1, backgroundColor: colors.page, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.lg, paddingTop: 30 },
  title: { color: colors.primaryDeep, fontFamily: 'Inter_700Bold', fontSize: 26 },
  subtitle: { color: colors.muted, fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 6 },
  form: { gap: 16, marginTop: 22 },
  iconField: { position: 'relative' },
  fieldIcon: { position: 'absolute', left: 16, bottom: 17, zIndex: 1 },
  iconInput: { paddingLeft: 44 },
  passwordField: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  passwordEye: { position: 'absolute', right: 16, bottom: 16 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 15 },
  termsText: { flex: 1, color: colors.muted, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  errorText: { color: colors.error, fontFamily: 'Inter_400Regular', fontSize: 13 },
  idHint: { color: colors.muted, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
