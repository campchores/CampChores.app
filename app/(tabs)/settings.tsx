import { ChevronRight, FileText, Flag, Moon, ShieldCheck, Sun, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CampChoresLogo } from '@/src/components/CampChoresLogo';
import { PrimaryButton, SectionTitle } from '@/src/components/UI';
import { useApp } from '@/src/context/AppContext';
import { useTheme } from '@/src/context/ThemeContext';
import { radius, spacing } from '@/src/theme';

export default function SettingsScreen() {
  const { submitReport, theme, setTheme } = useApp();
  const palette = useTheme();
  const [modal, setModal] = useState<'security' | 'terms' | 'report' | null>(null);
  const [report, setReport] = useState('');
  const [sent, setSent] = useState(false);

  const sendReport = async () => {
    if (!report.trim()) return;
    try {
      await submitReport('app', report.trim(), 'other');
      setSent(true);
      setReport('');
    } catch {
      setSent(false);
    }
  };

  return <View style={[styles.screen, { backgroundColor: palette.page }]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={[styles.header, { backgroundColor: palette.headerBg }]}><View><Text style={[styles.eyebrow, { color: palette.headerMuted }]}>DO SEU JEITO</Text><Text style={[styles.title, { color: palette.headerInk }]}>Configurações</Text><Text style={[styles.subtitle, { color: palette.headerMuted }]}>Informações importantes para usar o CampChores com tranquilidade.</Text></View><CampChoresLogo variant="blue" compact /></View>
    <View style={styles.body}>
      <SectionTitle title="Aparência" />
      <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.line }]}>
        <Pressable style={styles.linkRow} onPress={() => setTheme('light')}>
          <View style={[styles.linkIcon, { backgroundColor: palette.softBg }]}><Sun color={palette.primary} size={19} /></View>
          <View style={styles.linkCopy}><Text style={[styles.linkTitle, { color: palette.ink }]}>Tema Claro</Text><Text style={[styles.linkDescription, { color: palette.muted }]}>Padrão com fundos claros.</Text></View>
          {theme === 'light' ? <View style={[styles.radio, { borderColor: palette.primary }]}><View style={[styles.radioFill, { backgroundColor: palette.primary }]} /></View> : <View style={[styles.radio, { borderColor: palette.line }]} />}
        </Pressable>
        <View style={[styles.divider, { backgroundColor: palette.line }]} />
        <Pressable style={styles.linkRow} onPress={() => setTheme('dark')}>
          <View style={[styles.linkIcon, { backgroundColor: palette.softBg }]}><Moon color={palette.primary} size={19} /></View>
          <View style={styles.linkCopy}><Text style={[styles.linkTitle, { color: palette.ink }]}>Tema Escuro</Text><Text style={[styles.linkDescription, { color: palette.muted }]}>Textos claros sobre fundos profundos.</Text></View>
          {theme === 'dark' ? <View style={[styles.radio, { borderColor: palette.primary }]}><View style={[styles.radioFill, { backgroundColor: palette.primary }]} /></View> : <View style={[styles.radio, { borderColor: palette.line }]} />}
        </Pressable>
      </View>

      <SectionTitle title="Segurança e institucional" />
      <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.line }]}>
        <Pressable style={styles.linkRow} onPress={() => setModal('security')}><View style={[styles.linkIcon, { backgroundColor: palette.successSoft }]}><ShieldCheck color={palette.success} size={19} /></View><View style={styles.linkCopy}><Text style={[styles.linkTitle, { color: palette.ink }]}>Diretrizes de Segurança</Text><Text style={[styles.linkDescription, { color: palette.muted }]}>Boas práticas para todos.</Text></View><ChevronRight color={palette.muted} size={19} /></Pressable>
        <View style={[styles.divider, { backgroundColor: palette.line }]} />
        <Pressable style={styles.linkRow} onPress={() => setModal('terms')}><View style={[styles.linkIcon, { backgroundColor: palette.softBg }]}><FileText color={palette.primary} size={19} /></View><View style={styles.linkCopy}><Text style={[styles.linkTitle, { color: palette.ink }]}>Termos de Uso e Privacidade</Text><Text style={[styles.linkDescription, { color: palette.muted }]}>Leia como cuidamos da comunidade.</Text></View><ChevronRight color={palette.muted} size={19} /></Pressable>
        <View style={[styles.divider, { backgroundColor: palette.line }]} />
        <Pressable style={styles.linkRow} onPress={() => { setSent(false); setModal('report'); }}><View style={[styles.linkIcon, { backgroundColor: palette.errorSoft }]}><Flag color={palette.error} size={19} /></View><View style={styles.linkCopy}><Text style={[styles.linkTitle, { color: palette.ink }]}>Reportar problema / denúncia</Text><Text style={[styles.linkDescription, { color: palette.muted }]}>Ajude a manter a plataforma segura.</Text></View><ChevronRight color={palette.muted} size={19} /></Pressable>
      </View>
      <View style={[styles.aboutCard, { backgroundColor: palette.softBg }]}><CampChoresLogo variant="blue" compact /><Text style={[styles.aboutTitle, { color: palette.primaryDeep }]}>Sobre o CampChores</Text><Text style={[styles.aboutText, { color: palette.primaryDark }]}>Uma iniciativa desenvolvida no IFSP - Câmpus Campinas para aproximar pessoas, valorizar o trabalho independente e apoiar uma vida cotidiana mais digna.</Text><View style={styles.odsRow}><Text style={[styles.ods, { color: palette.primary, backgroundColor: palette.cardBg }]}>ODS 8</Text><Text style={[styles.ods, { color: palette.primary, backgroundColor: palette.cardBg }]}>ODS 9</Text><Text style={[styles.ods, { color: palette.primary, backgroundColor: palette.cardBg }]}>ODS 10</Text></View></View>
    </View>
  </ScrollView>
  <Modal visible={Boolean(modal)} transparent animationType="slide" onRequestClose={() => setModal(null)}><View style={[styles.backdrop, { backgroundColor: palette.backdrop }]}><View style={[styles.modal, { backgroundColor: palette.cardBg }]}><View style={styles.modalTop}><Text style={[styles.modalTitle, { color: palette.primaryDeep }]}>{modal === 'security' ? 'Diretrizes de Segurança' : modal === 'terms' ? 'Termos e Privacidade' : 'Reportar problema'}</Text><Pressable onPress={() => setModal(null)}><X color={palette.muted} size={22} /></Pressable></View>{modal === 'security' ? <View style={styles.modalCopy}><Text style={[styles.modalParagraph, { color: palette.ink }]}>O CampChores incentiva respeito mútuo, clareza no combinado e cuidado com a privacidade.</Text><Text style={[styles.modalParagraph, { color: palette.ink }]}>• Combine escopo, valores e horários antes do serviço.</Text><Text style={[styles.modalParagraph, { color: palette.ink }]}>• Use o código de confirmação para validar o atendimento.</Text><Text style={[styles.modalParagraph, { color: palette.ink }]}>• Nunca compartilhe dados sensíveis ou documentos pessoais.</Text><Text style={[styles.modalParagraph, { color: palette.ink }]}>• Em uma situação de risco, encerre o contato e procure ajuda.</Text></View> : modal === 'terms' ? <View style={styles.modalCopy}><Text style={[styles.modalParagraph, { color: palette.ink }]}>O CampChores é uma vitrine para divulgação e gestão de acordos entre pessoas. A negociação acontece fora do aplicativo, diretamente entre as partes.</Text><Text style={[styles.modalParagraph, { color: palette.ink }]}>Utilize a plataforma com responsabilidade, respeito e informações verdadeiras. O app não solicita CPF.</Text></View> : sent ? <View style={styles.sentState}><ShieldCheck color={palette.success} size={36} /><Text style={[styles.sentTitle, { color: palette.success }]}>Recebemos seu relato</Text><Text style={[styles.sentText, { color: palette.muted }]}>Obrigado por ajudar a cuidar da comunidade CampChores.</Text><PrimaryButton label="Fechar" onPress={() => setModal(null)} /></View> : <View style={styles.reportForm}><Text style={[styles.reportHint, { color: palette.muted }]}>Descreva o que aconteceu. Não inclua senhas ou documentos.</Text><TextInput value={report} onChangeText={setReport} multiline placeholder="Escreva seu relato aqui" placeholderTextColor={palette.muted} style={[styles.reportInput, { borderColor: palette.line, backgroundColor: palette.fieldBg, color: palette.ink }]} /><PrimaryButton label="Enviar relato" onPress={sendReport} disabled={!report.trim()} /></View>}</View></View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingBottom: 30 }, header: { paddingHorizontal: spacing.lg, paddingTop: 54, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 }, title: { fontFamily: 'Inter_700Bold', fontSize: 25, marginTop: 7 }, subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 5, maxWidth: 250, lineHeight: 19 }, body: { padding: spacing.lg, gap: 16 }, card: { borderRadius: radius.medium, borderWidth: 1, padding: 16, gap: 14 }, linkRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, linkIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, linkCopy: { flex: 1, gap: 3 }, linkTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 }, linkDescription: { fontFamily: 'Inter_400Regular', fontSize: 11 }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, radioFill: { width: 12, height: 12, borderRadius: 6 }, divider: { height: 1 }, aboutCard: { borderRadius: radius.medium, padding: 18, gap: 11 }, aboutTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 }, aboutText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 19 }, odsRow: { flexDirection: 'row', gap: 7 }, ods: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, fontFamily: 'Inter_700Bold', fontSize: 10, overflow: 'hidden' }, backdrop: { flex: 1, justifyContent: 'flex-end' }, modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 16 }, modalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 }, modalCopy: { gap: 13 }, modalParagraph: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }, reportForm: { gap: 14 }, reportHint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }, reportInput: { minHeight: 110, borderWidth: 1, borderRadius: radius.small, padding: 14, textAlignVertical: 'top', fontFamily: 'Inter_400Regular', fontSize: 13 }, sentState: { alignItems: 'center', gap: 10 }, sentTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 }, sentText: { fontFamily: 'Inter_400Regular', textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
