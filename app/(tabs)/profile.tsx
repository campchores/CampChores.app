import { Camera, Check, Clipboard, Edit3, Plus, ShieldCheck, Trash2, UserRound, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ClipboardAPI from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, FormField, PrimaryButton, StatusPill } from '@/src/components/UI';
import { useApp } from '@/src/context/AppContext';
import { useTheme } from '@/src/context/ThemeContext';
import type { Service, ServiceCategory } from '@/src/data/types';

const publishCategories: Exclude<ServiceCategory, 'Todos'>[] = ['Limpeza Geral', 'Passadoria', 'Jardinagem', 'Pequenos Reparos', 'Organização'];

type ServiceForm = {
  category: Exclude<ServiceCategory, 'Todos'>;
  title: string;
  description: string;
  details: string;
};

export default function ProfileScreen() {
  const { becomeProvider, contracts, createService, deleteService, services, signOut, updateService, updateUser, uploadAvatar, user } = useApp();
  const palette = useTheme();
  const [showEdit, setShowEdit] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');
  const [editForm, setEditForm] = useState({ name: user?.name || '', phone: user?.phone || '', location: user?.location || '', bio: user?.bio || '' });
  const [serviceForm, setServiceForm] = useState<ServiceForm>({ category: 'Limpeza Geral', title: '', description: '', details: '' });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const ownServices = services.filter((service) => service.providerId === user?.id);
  const isEditingService = Boolean(editingService);

  if (!user) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.page }]}>
        <View style={styles.guestWrap}>
          <UserRound color={palette.primary} size={34} />
          <Text style={[styles.guestTitle, { color: palette.primaryDeep }]}>Perfil disponível para contas</Text>
          <Text style={[styles.guestText, { color: palette.muted }]}>Crie sua conta ou entre para editar seus dados, publicar serviços e acompanhar contratações.</Text>
          <PrimaryButton label="Entrar ou criar conta" onPress={() => router.push('/cadastro')} />
        </View>
      </View>
    );
  }

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError('Permita o acesso às fotos para alterar sua imagem.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ 
  mediaTypes: ImagePicker.MediaTypeOptions.Images, 
  allowsEditing: true, 
  aspect: [1, 1], 
  quality: 0.7 
});
    if (result.canceled || !result.assets[0]) return;
    try {
      await uploadAvatar(result.assets[0].uri);
      setFormError('');
    } catch (uploadError) {
      setFormError(uploadError instanceof Error ? uploadError.message : 'Não foi possível salvar a foto.');
    }
  };

  const copyId = async () => {
    await ClipboardAPI.setStringAsync(user.publicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const saveProfile = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim() || !editForm.location.trim()) {
      setFormError('Preencha nome, telefone e cidade.');
      return;
    }
    try {
      await updateUser({ name: editForm.name.trim(), phone: editForm.phone.trim(), location: editForm.location.trim(), bio: editForm.bio.trim() });
      setShowEdit(false);
      setFormError('');
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar.');
    }
  };

  const openNewService = () => {
    setEditingService(null);
    setServiceForm({ category: 'Limpeza Geral', title: '', description: '', details: '' });
    setFormError('');
    setShowServiceEditor(true);
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({ category: service.category, title: service.title, description: service.description, details: service.details });
    setFormError('');
    setShowServiceEditor(true);
  };


const saveService = async () => {
    const title = serviceForm.title.trim();
    const description = serviceForm.description.trim();
    const details = serviceForm.details.trim();
  
    if (!title || !description || !details) {
      setFormError('Preencha título, descrição e especificações.');
      return;
    }
  
    if (title.length < 3 || title.length > 120) {
      setFormError('O título deve ter entre 3 e 120 caracteres.');
      return;
    }
  
    if (description.length < 10 || description.length > 500) {
      setFormError('A descrição deve ter entre 10 e 500 caracteres.');
      return;
    }
  
    if (details.length < 3 || details.length > 1000) {
      setFormError('As especificações devem ter entre 3 e 1000 caracteres.');
      return;
    }
  
    try {
      if (editingService) {
        await updateService(editingService.id, {
          ...serviceForm,
          title,
          description,
          details,
        });
      } else {
        await createService({
          ...serviceForm,
          title,
          description,
          details,
          location: user.location || 'Campinas, SP',
        });
      }
  
      setShowServiceEditor(false);
      setFormError('');
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o serviço.'
      );
    }
  };


  const requestDelete = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteService(serviceToDelete.id);
      setServiceToDelete(null);
      setShowDeleteConfirm(false);
      setDeleteError('');
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : 'Não foi possível excluir o serviço.');
    }
  };

  return <View style={[styles.screen, { backgroundColor: palette.page }]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={[styles.header, { backgroundColor: palette.headerBg }]}><View style={styles.profileTop}><Pressable onPress={pickAvatar} accessibilityLabel="Alterar foto de perfil" style={styles.avatarWrap}><Avatar name={user.name} color={palette.primary} size={88} uri={user.avatarUrl || undefined} /><View style={[styles.avatarEditBadge, { backgroundColor: palette.cardBg }]}><Camera color={palette.primary} size={16} /></View></Pressable><View style={styles.statsRow}><Stat palette={palette} value={String(ownServices.length)} label="serviços" /><Stat palette={palette} value={String(contracts.length)} label="contratações" /><Stat palette={palette} value={user.isProvider ? 'Ativo' : 'Cliente'} label="perfil" /></View></View><Text style={[styles.name, { color: palette.headerInk }]}>{user.name}</Text><Text style={[styles.email, { color: palette.headerMuted }]}>{user.email}</Text><Text style={[styles.bio, { color: palette.headerInk }]}>{user.bio || 'Ainda não há uma bio. Conte um pouco sobre você.'}</Text><View style={styles.headerActions}><PrimaryButton label="Editar perfil" onPress={() => { setEditForm({ name: user.name, phone: user.phone, location: user.location, bio: user.bio }); setFormError(''); setShowEdit(true); }} variant="ghost" icon={<Edit3 color={palette.primaryDark} size={17} />} style={styles.editProfileButton} /><Pressable onPress={copyId} style={[styles.idBadge, { backgroundColor: palette.softBg }]}><ShieldCheck color={palette.headerInk} size={15} /><Text style={[styles.idText, { color: palette.headerInk }]}>{user.publicId}</Text><Clipboard color={palette.headerInk} size={14} /></Pressable></View>{copied ? <Text style={[styles.copiedText, { color: palette.headerInk }]}>Chave copiada</Text> : null}</View>
    <View style={styles.body}>
      {!user.isProvider ? <View style={[styles.collabCard, { backgroundColor: palette.softBg }]}><View style={[styles.collabIcon, { backgroundColor: palette.cardBg }]}><ShieldCheck color={palette.primary} size={24} /></View><View style={styles.collabCopy}><Text style={[styles.collabTitle, { color: palette.primaryDeep }]}>Quer divulgar seu trabalho?</Text><Text style={[styles.collabText, { color: palette.primaryDark }]}>Ative o perfil colaborador para publicar serviços.</Text></View><Pressable onPress={() => setShowGuidelines(true)} style={[styles.roundButton, { backgroundColor: palette.cardBg }]}><Plus color={palette.primary} size={20} /></Pressable></View> : <View style={styles.servicesSection}><View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, { color: palette.primaryDeep }]}>Meus serviços</Text><Text style={[styles.sectionSubtitle, { color: palette.muted }]}>Sua vitrine para a comunidade.</Text></View><Pressable onPress={openNewService} style={[styles.addButton, { backgroundColor: palette.primary }]} accessibilityLabel="Adicionar serviço"><Plus color={palette.white} size={19} /></Pressable></View>{ownServices.length === 0 ? <View style={styles.emptyService}><Text style={[styles.emptyServiceText, { color: palette.muted }]}>Você ainda não publicou um serviço.</Text><PrimaryButton label="Publicar primeiro serviço" onPress={openNewService} /></View> : <View style={styles.serviceGrid}>{ownServices.map((service) => <View key={service.id} style={[styles.publishedCard, { backgroundColor: palette.cardBg, borderColor: palette.line }]}><StatusPill label={service.category} tone="blue" /><Text style={[styles.publishedTitle, { color: palette.primaryDeep }]} numberOfLines={2}>{service.title}</Text><Text style={[styles.publishedDescription, { color: palette.muted }]} numberOfLines={3}>{service.description}</Text><View style={[styles.serviceActions, { borderTopColor: palette.line }]}><Pressable onPress={() => openEditService(service)} style={styles.smallAction}><Edit3 color={palette.primary} size={16} /><Text style={[styles.smallActionText, { color: palette.primary }]}>Editar</Text></Pressable><Pressable onPress={() => requestDelete(service)} style={styles.smallAction}><Trash2 color={palette.error} size={16} /><Text style={[styles.deleteText, { color: palette.error }]}>Excluir</Text></Pressable></View></View>)}</View>}</View>}
      <View style={[styles.safetyCard, { backgroundColor: palette.successSoft }]}><ShieldCheck color={palette.success} size={20} /><View style={styles.safetyCopy}><Text style={[styles.safetyTitle, { color: palette.success }]}>Perfil com respeito e clareza</Text><Text style={[styles.safetyText, { color: palette.success }]}>Mantenha sua bio e seus serviços sempre atualizados para uma comunidade mais segura.</Text></View></View>
      <PrimaryButton label="Sair da conta" onPress={() => { void signOut().then(() => router.replace('/')); }} variant="ghost" />
    </View>
  </ScrollView>

  <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}><View style={[styles.backdrop, { backgroundColor: palette.backdrop }]}><View style={[styles.modal, { backgroundColor: palette.cardBg }]}><ModalTop palette={palette} title="Editar perfil" onClose={() => setShowEdit(false)} /><View style={styles.form}><FormField label="Nome completo" value={editForm.name} onChangeText={(value) => setEditForm((current) => ({ ...current, name: value }))} /><FormField label="Bio" value={editForm.bio} onChangeText={(value) => setEditForm((current) => ({ ...current, bio: value }))} placeholder="Conte um pouco sobre você" multiline style={styles.multiline} /><FormField label="Telefone" value={editForm.phone} onChangeText={(value) => setEditForm((current) => ({ ...current, phone: value }))} keyboardType="phone-pad" /><FormField label="Cidade e Estado" value={editForm.location} onChangeText={(value) => setEditForm((current) => ({ ...current, location: value }))} />{formError ? <Text style={[styles.errorText, { color: palette.error }]}>{formError}</Text> : null}<PrimaryButton label="Salvar perfil" onPress={saveProfile} /></View></View></View></Modal>
  <Modal visible={showGuidelines} transparent animationType="slide" onRequestClose={() => setShowGuidelines(false)}><View style={[styles.backdrop, { backgroundColor: palette.backdrop }]}><View style={[styles.modal, { backgroundColor: palette.cardBg }]}><ModalTop palette={palette} title="Diretrizes de segurança" onClose={() => setShowGuidelines(false)} /><Text style={[styles.guidelineIntro, { color: palette.muted }]}>Antes de publicar, confirme que você concorda com uma experiência baseada em confiança.</Text><Guideline palette={palette} text="Seja claro sobre o que está incluso e combine valores antes de iniciar." /><Guideline palette={palette} text="Respeite a privacidade e os limites de cada residência." /><Guideline palette={palette} text="Use o código de confirmação para validar o atendimento." /><Guideline palette={palette} text="Mantenha uma comunicação respeitosa e avise sobre qualquer imprevisto." /><PrimaryButton label="Concordar e continuar" onPress={() => { void becomeProvider().then(() => { setShowGuidelines(false); openNewService(); }); }} icon={<Check color={palette.white} size={18} />} /></View></View></Modal>
  <Modal visible={showServiceEditor} transparent animationType="slide" onRequestClose={() => setShowServiceEditor(false)}><View style={[styles.backdrop, { backgroundColor: palette.backdrop }]}><ScrollView contentContainerStyle={styles.modalScroll}><View style={[styles.modal, { backgroundColor: palette.cardBg }]}><ModalTop palette={palette} title={isEditingService ? 'Editar serviço' : 'Publicar serviço'} onClose={() => setShowServiceEditor(false)} /><Text style={[styles.formLabel, { color: palette.primaryDeep }]}>Tipo de serviço</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{publishCategories.map((category) => <Pressable key={category} onPress={() => setServiceForm((current) => ({ ...current, category }))} style={[styles.categoryChip, { borderColor: palette.line, backgroundColor: palette.chipBg }, serviceForm.category === category && { backgroundColor: palette.primary, borderColor: palette.primary }]}><Text style={[styles.categoryText, { color: palette.muted }, serviceForm.category === category && { color: palette.white }]}>{category}</Text></Pressable>)}</ScrollView><View style={styles.form}><FormField label="Título do serviço" placeholder="Ex.: Limpeza cuidadosa para sua casa" value={serviceForm.title} onChangeText={(value) => setServiceForm((current) => ({ ...current, title: value }))} /><FormField label="Descrição" placeholder="Apresente seu trabalho em poucas palavras" value={serviceForm.description} onChangeText={(value) => setServiceForm((current) => ({ ...current, description: value }))} multiline style={styles.multiline} /><FormField label="Especificações" placeholder="Disponibilidade, materiais inclusos..." value={serviceForm.details} onChangeText={(value) => setServiceForm((current) => ({ ...current, details: value }))} multiline style={styles.multiline} />{formError ? <Text style={[styles.errorText, { color: palette.error }]}>{formError}</Text> : null}<PrimaryButton label={isEditingService ? 'Salvar alterações' : 'Publicar serviço'} onPress={saveService} /></View></View></ScrollView></View></Modal>
  <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}><View style={[styles.confirmBackdrop, { backgroundColor: palette.backdrop }]}><View style={[styles.confirmCard, { backgroundColor: palette.cardBg }]}><View style={[styles.confirmIcon, { backgroundColor: palette.errorSoft }]}><Trash2 color={palette.error} size={22} /></View><Text style={[styles.confirmTitle, { color: palette.primaryDeep }]}>Excluir este serviço?</Text><Text style={[styles.confirmText, { color: palette.muted }]}>O serviço sai da sua vitrine e deixa de aparecer para novos clientes. Contratos e histórico já registrados permanecem preservados.</Text>{deleteError ? <Text style={[styles.confirmError, { color: palette.error }]}>{deleteError}</Text> : null}<View style={styles.confirmActions}><PrimaryButton label="Cancelar" onPress={() => setShowDeleteConfirm(false)} variant="ghost" style={styles.flexButton} /><PrimaryButton label="Excluir" onPress={() => { void confirmDelete(); }} variant="secondary" style={styles.flexButton} /></View></View></View></Modal>
  </View>;
}

function Stat({ value, label, palette }: { value: string; label: string; palette: ReturnType<typeof useTheme> }) { return <View style={styles.stat}><Text style={[styles.statValue, { color: palette.headerInk }]}>{value}</Text><Text style={[styles.statLabel, { color: palette.headerMuted }]}>{label}</Text></View>; }
function ModalTop({ title, onClose, palette }: { title: string; onClose: () => void; palette: ReturnType<typeof useTheme> }) { return <View style={styles.modalTop}><Text style={[styles.modalTitle, { color: palette.primaryDeep }]}>{title}</Text><Pressable onPress={onClose} hitSlop={10}><X color={palette.muted} size={22} /></Pressable></View>; }
function Guideline({ text, palette }: { text: string; palette: ReturnType<typeof useTheme> }) { return <View style={styles.guideline}><Check color={palette.success} size={18} /><Text style={[styles.guidelineText, { color: palette.ink }]}>{text}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingBottom: 30 },
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  guestTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, textAlign: 'center' },
  guestText: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  header: { paddingHorizontal: 24, paddingTop: 54, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatarWrap: { position: 'relative' },
  avatarEditBadge: { position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 20 }, statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' }, stat: { alignItems: 'center', gap: 3 }, statValue: { fontFamily: 'Inter_700Bold', fontSize: 19 }, statLabel: { fontFamily: 'Inter_400Regular', fontSize: 10 }, name: { fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 17 }, email: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 }, bio: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 12 }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 17 }, editProfileButton: { flex: 1, backgroundColor: 'transparent', borderColor: 'transparent' }, idBadge: { minHeight: 44, paddingHorizontal: 11, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }, idText: { fontFamily: 'Inter_700Bold', fontSize: 11 }, copiedText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 7 },
  body: { padding: 24, gap: 16 }, collabCard: { borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 11 }, collabIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, collabCopy: { flex: 1, gap: 4 }, collabTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 }, collabText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }, roundButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  servicesSection: { gap: 14 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 }, sectionSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 }, addButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, emptyService: { gap: 12 }, emptyServiceText: { fontFamily: 'Inter_400Regular', fontSize: 13 }, serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }, publishedCard: { width: '48%', minHeight: 182, borderRadius: 18, padding: 13, gap: 9, borderWidth: 1 }, publishedTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 19 }, publishedDescription: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }, serviceActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 9 }, smallAction: { flexDirection: 'row', alignItems: 'center', gap: 4 }, smallActionText: { fontFamily: 'Inter_700Bold', fontSize: 10 }, deleteText: { fontFamily: 'Inter_700Bold', fontSize: 10 }, safetyCard: { borderRadius: 18, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, safetyCopy: { flex: 1, gap: 4 }, safetyTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 }, safetyText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  backdrop: { flex: 1, justifyContent: 'flex-end' }, modalScroll: { flexGrow: 1, justifyContent: 'flex-end' }, modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 16, maxHeight: '94%' }, modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 }, form: { gap: 15 }, formLabel: { fontFamily: 'Inter_700Bold', fontSize: 13 }, multiline: { minHeight: 84, textAlignVertical: 'top', paddingTop: 14 }, errorText: { fontFamily: 'Inter_400Regular', fontSize: 12 }, guidelineIntro: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }, guideline: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, guidelineText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }, categoryRow: { gap: 8 }, categoryChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, borderWidth: 1 }, categoryText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 }, confirmBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }, confirmCard: { width: '100%', borderRadius: 28, padding: 22, alignItems: 'center', gap: 12 }, confirmIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, confirmTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, textAlign: 'center' }, confirmText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center' }, confirmError: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textAlign: 'center' }, confirmActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 5 }, flexButton: { flex: 1 },
});
