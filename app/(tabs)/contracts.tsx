import { CheckCircle2, ChevronRight, EyeOff, KeyRound, ShieldCheck, Star, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar, PrimaryButton, SectionTitle, StatusPill } from '@/src/components/UI';
import { useApp } from '@/src/context/AppContext';
import { useTheme } from '@/src/context/ThemeContext';
import type { Contract } from '@/src/data/types';

export default function ContractsScreen() {
  const { completeContract, contracts, hideContract, rateContract, user } = useApp();
  const palette = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [selected, setSelected] = useState<Contract | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [ratingContract, setRatingContract] = useState<Contract | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hideTarget, setHideTarget] = useState<Contract | null>(null);

  const visible = contracts.filter((contract) => !contract.hidden);
  const filteredContracts = visible.filter((contract) => contract.status === tab);

  const confirmCompletion = async () => {
    if (!selected) return;
    if (!/^\d{4}$/.test(code) || !(await completeContract(selected.id, code))) {
      setCodeError('Código inválido. Confira os 4 dígitos com o prestador.');
      return;
    }
    setCodeError('');
    setCode('');
    setSelected(null);
    setTab('completed');
  };

  const submitRating = async () => {
    if (!ratingContract || rating === 0) return;
    await rateContract(ratingContract.id, rating, comment.trim());
    setRatingContract(null);
    setRating(0);
    setComment('');
  };

  const confirmHide = async () => {
    if (hideTarget) await hideContract(hideTarget.id);
    setHideTarget(null);
  };

  if (!user) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.page }]}>
        <View style={styles.guestWrap}>
          <ShieldCheck color={palette.primary} size={34} />
          <Text style={[styles.guestTitle, { color: palette.primaryDeep }]}>Entre para ver suas contratações</Text>
          <Text style={[styles.guestText, { color: palette.muted }]}>Crie uma conta ou entre para acompanhar seus serviços com segurança.</Text>
          <PrimaryButton label="Entrar ou criar conta" onPress={() => router.push('/cadastro')} />
        </View>
      </View>
    );
  }

  return <View style={[styles.screen, { backgroundColor: palette.page }]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={[styles.header, { backgroundColor: palette.headerBg }]}><Text style={[styles.eyebrow, { color: palette.headerMuted }]}>ACOMPANHE COM TRANQUILIDADE</Text><Text style={[styles.title, { color: palette.headerInk }]}>Minhas Contratações</Text><Text style={[styles.subtitle, { color: palette.headerMuted }]}>Tudo o que foi combinado fica organizado aqui.</Text></View>
    <View style={styles.body}>
      <View style={[styles.tabs, { backgroundColor: palette.cardBg }]}><Pressable onPress={() => setTab('ongoing')} style={[styles.tab, tab === 'ongoing' && { backgroundColor: palette.primary }]}><Text style={[styles.tabText, { color: tab === 'ongoing' ? palette.white : palette.muted }]}>Em andamento</Text><Text style={[styles.tabCount, { color: tab === 'ongoing' ? palette.white : palette.muted }]}>{contracts.filter((item) => item.status === 'ongoing' && !item.hidden).length}</Text></Pressable><Pressable onPress={() => setTab('completed')} style={[styles.tab, tab === 'completed' && { backgroundColor: palette.primary }]}><Text style={[styles.tabText, { color: tab === 'completed' ? palette.white : palette.muted }]}>Concluídos</Text><Text style={[styles.tabCount, { color: tab === 'completed' ? palette.white : palette.muted }]}>{contracts.filter((item) => item.status === 'completed' && !item.hidden).length}</Text></Pressable></View>
      <View style={[styles.safetyBanner, { backgroundColor: palette.successSoft }]}><ShieldCheck color={palette.success} size={21} /><View style={styles.safetyCopy}><Text style={[styles.safetyTitle, { color: palette.success }]}>Código de confirmação</Text><Text style={[styles.safetyText, { color: palette.success }]}>Compartilhe o código somente quando o prestador estiver no local.</Text></View></View>
      <SectionTitle title={tab === 'ongoing' ? 'Serviços em andamento' : 'Histórico de serviços'} />
      {filteredContracts.map((contract) => <ContractCard key={contract.id} contract={contract} onConfirm={() => { setSelected(contract); setCode(''); setCodeError(''); }} onRate={() => setRatingContract(contract)} onHide={() => setHideTarget(contract)} />)}
      {filteredContracts.length === 0 && <View style={styles.empty}><CheckCircle2 color={palette.primary} size={34} /><Text style={[styles.emptyTitle, { color: palette.primaryDeep }]}>Nada por aqui ainda</Text><Text style={[styles.emptyText, { color: palette.muted }]}>Quando você registrar uma contratação, ela aparecerá nesta área.</Text></View>}
    </View>
  </ScrollView>

  <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}><View style={[styles.backdrop, { backgroundColor: palette.backdrop }]}><View style={[styles.modal, { backgroundColor: palette.cardBg }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: palette.primaryDeep }]}>Confirmar conclusão</Text><Pressable onPress={() => setSelected(null)}><X color={palette.muted} size={22} /></Pressable></View><Text style={[styles.modalText, { color: palette.muted }]}>Peça o código de 4 dígitos ao prestador e digite abaixo para confirmar que o atendimento foi concluído com segurança.</Text><View style={[styles.codeBox, { backgroundColor: palette.softBg }]}><KeyRound color={palette.primary} size={21} /><TextInput value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} placeholder="0000" placeholderTextColor={palette.muted} style={[styles.codeInput, { borderColor: palette.line, backgroundColor: palette.fieldBg, color: palette.ink }]} /></View>{codeError ? <Text style={[styles.codeError, { color: palette.error }]}>{codeError}</Text> : null}<PrimaryButton label="Validar e concluir serviço" onPress={confirmCompletion} icon={<ShieldCheck color={palette.white} size={18} />} /></View></View></Modal>
  <Modal visible={Boolean(ratingContract)} transparent animationType="slide" onRequestClose={() => setRatingContract(null)}><View style={[styles.backdrop, { backgroundColor: palette.backdrop }]}><View style={[styles.modal, { backgroundColor: palette.cardBg }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: palette.primaryDeep }]}>Avaliar colaborador</Text><Pressable onPress={() => setRatingContract(null)}><X color={palette.muted} size={22} /></Pressable></View><Text style={[styles.modalText, { color: palette.muted }]}>Como foi sua experiência com {ratingContract?.providerName}?</Text><View style={styles.starsRow}>{[1, 2, 3, 4, 5].map((item) => <Pressable key={item} onPress={() => setRating(item)} hitSlop={5}><Star color="#F5A623" fill={item <= rating ? '#F5A623' : 'transparent'} size={34} /></Pressable>)}</View><TextInput value={comment} onChangeText={setComment} placeholder="Comentário opcional" placeholderTextColor={palette.muted} multiline style={[styles.commentInput, { borderColor: palette.line, backgroundColor: palette.fieldBg, color: palette.ink }]} /><PrimaryButton label="Enviar avaliação" onPress={submitRating} disabled={rating === 0} /></View></View></Modal>
  <Modal visible={Boolean(hideTarget)} transparent animationType="fade" onRequestClose={() => setHideTarget(null)}><View style={[styles.confirmBackdrop, { backgroundColor: palette.backdrop }]}><View style={[styles.confirmCard, { backgroundColor: palette.cardBg }]}><View style={[styles.confirmIcon, { backgroundColor: palette.softBg }]}><EyeOff color={palette.primary} size={22} /></View><Text style={[styles.confirmTitle, { color: palette.primaryDeep }]}>Esconder do histórico?</Text><Text style={[styles.confirmText, { color: palette.muted }]}>Este item sairá da sua lista, mas continuará guardado com segurança no sistema.</Text><View style={styles.confirmActions}><PrimaryButton label="Cancelar" onPress={() => setHideTarget(null)} variant="ghost" style={styles.flexButton} /><PrimaryButton label="Esconder" onPress={confirmHide} style={styles.flexButton} /></View></View></View></Modal>
  </View>;
}

function ContractCard({ contract, onConfirm, onRate, onHide }: { contract: Contract; onConfirm: () => void; onRate: () => void; onHide: () => void }) {
  const palette = useTheme();
  const hasRating = Boolean(contract.rating);
  return <View style={[styles.contractCard, { backgroundColor: palette.cardBg, borderColor: palette.line }]}><View style={styles.contractTop}><Avatar name={contract.providerName} color={contract.status === 'completed' ? palette.success : palette.primary} /><View style={styles.contractInfo}><Text style={[styles.contractProvider, { color: palette.primaryDeep }]}>{contract.providerName}</Text><Text style={[styles.contractCategory, { color: palette.muted }]}>{contract.category}</Text></View><StatusPill label={contract.status === 'completed' ? 'Concluído' : 'Em andamento'} tone={contract.status === 'completed' ? 'green' : 'yellow'} /></View><Text style={[styles.contractTitle, { color: palette.ink }]}>{contract.serviceTitle}</Text><View style={styles.dateRow}><Text style={[styles.dateText, { color: palette.muted }]}>{contract.date}</Text><ChevronRight color={palette.muted} size={17} /></View>{contract.status === 'ongoing' ? <View style={[styles.confirmation, { backgroundColor: palette.softBg }]}><View style={[styles.confirmationIcon, { backgroundColor: palette.cardBg }]}><KeyRound color={palette.primary} size={20} /></View><View style={{ flex: 1 }}><Text style={[styles.confirmationTitle, { color: palette.primaryDeep }]}>Código #{contract.confirmationCode}</Text><Text style={[styles.confirmationText, { color: palette.primaryDark }]}>Use para validar o início e a conclusão.</Text></View></View> : <View style={styles.completedRow}><CheckCircle2 color={palette.success} size={19} /><Text style={[styles.completedText, { color: palette.success }]}>{hasRating ? `Você deu ${contract.rating} estrelas` : 'Serviço concluído com segurança'}</Text></View>}{contract.status === 'ongoing' ? <PrimaryButton label="Confirmar conclusão com código" onPress={onConfirm} variant="secondary" /> : !hasRating ? <PrimaryButton label="Avaliar colaborador" onPress={onRate} variant="ghost" icon={<Star color={palette.primary} size={17} />} /> : <Text style={[styles.commentText, { color: palette.muted }]}>“{contract.comment || 'Obrigado pela avaliação.'}”</Text>}<Pressable onPress={onHide} style={styles.hideButton}><EyeOff color={palette.muted} size={15} /><Text style={[styles.hideText, { color: palette.muted }]}>Esconder do histórico</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 28 },
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  guestTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, textAlign: 'center' },
  guestText: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  header: { paddingHorizontal: 24, paddingTop: 54, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 25, marginTop: 7 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 5 },
  body: { padding: 24, gap: 16 },
  tabs: { flexDirection: 'row', padding: 5, borderRadius: 12, gap: 5 },
  tab: { flex: 1, minHeight: 46, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  tabText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  tabCount: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  safetyBanner: { borderRadius: 12, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' },
  safetyCopy: { flex: 1, gap: 3 },
  safetyTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  safetyText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  contractCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 13 },
  contractTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  contractInfo: { flex: 1, gap: 4 },
  contractProvider: { fontFamily: 'Inter_700Bold' },
  contractCategory: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  contractTitle: { fontFamily: 'Inter_700Bold', lineHeight: 23 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  confirmation: { borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  confirmationIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  confirmationTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  confirmationText: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  completedRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  completedText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  commentText: { fontFamily: 'Inter_400Regular', fontSize: 12, fontStyle: 'italic' },
  hideButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: 4 },
  hideText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 46, gap: 9 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  modalText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  codeBox: { height: 64, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12 },
  codeInput: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: 8 },
  codeError: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  commentInput: { minHeight: 90, borderWidth: 1, borderRadius: 12, padding: 14, textAlignVertical: 'top', fontFamily: 'Inter_400Regular', fontSize: 13 },
  confirmBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  confirmCard: { width: '100%', borderRadius: 28, padding: 22, alignItems: 'center', gap: 12 },
  confirmIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, textAlign: 'center' },
  confirmText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 5 },
  flexButton: { flex: 1 },
});
