import { Filter, Flag, MapPin, MessageCircle, Phone, Search, ShieldCheck, Star, X } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CampChoresLogo } from '@/src/components/CampChoresLogo';
import { Avatar, PrimaryButton, SectionTitle, StatusPill } from '@/src/components/UI';
import { useApp } from '@/src/context/AppContext';
import { useTheme } from '@/src/context/ThemeContext';
import type { Service, ServiceCategory } from '@/src/data/types';

const categories: ServiceCategory[] = ['Todos', 'Limpeza Geral', 'Passadoria', 'Jardinagem', 'Pequenos Reparos', 'Organização'];

export default function HomeScreen() {
  const { createContract, services, status, submitReport, user } = useApp();
  const palette = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('Todos');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [reportingService, setReportingService] = useState<Service | null>(null);
  const [reportText, setReportText] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [notice, setNotice] = useState('');

  const isGuest = status !== 'authenticated' || !user;

  const filteredServices = useMemo(() => services.filter((service) => {
    const matchesCategory = category === 'Todos' || service.category === category;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${service.title} ${service.providerName} ${service.location} ${service.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  }), [category, search, services]);

  const openContact = (phone: string, channel: 'whatsapp' | 'phone') => {
    const url = channel === 'whatsapp' ? `https://wa.me/55${phone.replace(/\D/g, '')}?text=Olá! Vi seu serviço no CampChores e gostaria de conversar.` : `tel:${phone}`;
    void Linking.openURL(url);
  };

  const registerContract = async (service: Service) => {
    if (isGuest) {
      setSelectedService(null);
      router.push('/');
      return;
    }
    const created = await createContract(service);
    setSelectedService(null);
    setNotice(created ? 'Solicitação registrada. Seu código de confirmação está em Minhas Contratações.' : 'Não foi possível registrar agora. Tente novamente.');
    setTimeout(() => setNotice(''), 4500);
  };

  const submitServiceReport = async () => {
    if (!reportingService || !reportText.trim()) return;
    if (isGuest) {
      setReportingService(null);
      router.push('/');
      return;
    }
    await submitReport(reportingService.id, reportText.trim());
    setReportingService(null);
    setReportText('');
    setNotice('Denúncia registrada. Obrigado por ajudar a manter a comunidade segura.');
    setTimeout(() => setNotice(''), 4500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.page }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: palette.headerBg }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.eyebrow, { color: palette.headerMuted }]}>Olá, {user?.name.split(' ')[0] || 'vizinho'}!</Text>
              <Text style={[styles.headerTitle, { color: palette.headerInk }]}>O que sua casa precisa hoje?</Text>
            </View>
            <CampChoresLogo variant="blue" compact />
          </View>
          <View style={[styles.searchBox, { backgroundColor: palette.fieldBg, borderColor: palette.line }]}>
            <Search color={palette.muted} size={19} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Buscar serviço ou profissional" placeholderTextColor={palette.muted} style={[styles.searchInput, { color: palette.ink }]} />
            <Filter color={palette.primary} size={19} />
          </View>
        </View>

        <View style={styles.body}>
          {notice ? <View style={[styles.notice, { backgroundColor: palette.successSoft }]}><ShieldCheck color={palette.success} size={18} /><Text style={[styles.noticeText, { color: palette.success }]}>{notice}</Text></View> : null}
          {showWelcome ? <View style={[styles.welcomeCard, { backgroundColor: palette.softBg }]}>
            <View style={styles.welcomeCopy}><Text style={[styles.welcomeKicker, { color: palette.primary }]}>COMUNIDADE LOCAL</Text><Text style={[styles.welcomeTitle, { color: palette.primaryDeep }]}>Ajuda de confiança, perto de você.</Text><Text style={[styles.welcomeDescription, { color: palette.primaryDark }]}>Encontre profissionais independentes de Campinas e combine tudo diretamente.</Text></View>
            <View style={[styles.welcomeBadge, { backgroundColor: palette.cardBg }]}><ShieldCheck color={palette.primary} size={25} /><Text style={[styles.welcomeBadgeText, { color: palette.primary }]}>Seguro</Text></View>
            <Pressable onPress={() => setShowWelcome(false)} style={[styles.dismissButton, { backgroundColor: palette.cardBg }]} accessibilityLabel="Fechar ajuda de confiança"><X color={palette.primaryDark} size={17} /></Pressable>
          </View> : null}

          <SectionTitle title="Encontre um serviço" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, { backgroundColor: palette.chipBg, borderColor: palette.line }, category === item && { backgroundColor: palette.chipActiveBg, borderColor: palette.chipActiveBg }]}><Text style={[styles.categoryText, { color: palette.muted }, category === item && { color: palette.white }]}>{item}</Text></Pressable>)}
          </ScrollView>

          <View style={styles.resultsRow}><Text style={[styles.resultsText, { color: palette.muted }]}>{filteredServices.length} serviços encontrados</Text><Text style={[styles.locationText, { color: palette.primaryDark }]}><MapPin color={palette.primary} size={14} /> Campinas, SP</Text></View>
          {filteredServices.map((service) => <ServiceCard key={service.id} palette={palette} service={service} onPress={() => setSelectedService(service)} onProviderPress={() => router.push({ pathname: '/public-profile', params: { providerId: service.providerId } })} />)}
          {filteredServices.length === 0 ? <View style={styles.empty}><Search color={palette.primary} size={30} /><Text style={[styles.emptyTitle, { color: palette.primaryDeep }]}>Não encontramos esse serviço</Text><Text style={[styles.emptyText, { color: palette.muted }]}>Tente outra palavra ou escolha uma categoria.</Text></View> : null}
        </View>
      </ScrollView>

      <Modal visible={Boolean(selectedService)} transparent animationType="slide" onRequestClose={() => setSelectedService(null)}>
        {selectedService && <ServiceDetail palette={palette} isGuest={isGuest} service={selectedService} onClose={() => setSelectedService(null)} onContact={openContact} onRegister={registerContract} onReport={() => { setReportingService(selectedService); setSelectedService(null); }} />}
      </Modal>
      <Modal visible={Boolean(reportingService)} transparent animationType="slide" onRequestClose={() => setReportingService(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: palette.backdrop }]}><View style={[styles.reportModal, { backgroundColor: palette.cardBg }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: palette.primaryDeep }]}>Denunciar serviço</Text><Pressable onPress={() => setReportingService(null)} hitSlop={10}><X color={palette.muted} size={23} /></Pressable></View><Text style={[styles.reportDescription, { color: palette.muted }]}>Descreva o que precisa ser analisado. Não inclua senhas ou documentos.</Text><TextInput value={reportText} onChangeText={setReportText} multiline placeholder="Conte o que aconteceu" placeholderTextColor={palette.muted} style={[styles.reportInput, { borderColor: palette.line, backgroundColor: palette.fieldBg, color: palette.ink }]} /><PrimaryButton label="Enviar denúncia" onPress={submitServiceReport} disabled={!reportText.trim()} icon={<Flag color={palette.white} size={18} />} /></View></View>
      </Modal>
    </View>
  );
}

function ServiceCard({ service, onPress, onProviderPress, palette }: { service: Service; onPress: () => void; onProviderPress: () => void; palette: ReturnType<typeof useTheme> }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.serviceCard, { backgroundColor: palette.cardBg, borderColor: palette.line }, pressed && styles.cardPressed]}>
    <View style={styles.cardTop}><Pressable onPress={onProviderPress} style={styles.providerButton}><Avatar name={service.providerName} color={service.avatarColor} /><View style={styles.providerInfo}><Text style={[styles.providerName, { color: palette.ink }]}>{service.providerName}</Text><Text style={[styles.serviceLocation, { color: palette.muted }]}><MapPin color={palette.primary} size={12} /> {service.location}</Text></View></Pressable><StatusPill label={service.category} tone={service.category === 'Jardinagem' ? 'green' : 'blue'} /></View>
    <Text style={[styles.serviceTitle, { color: palette.ink }]}>{service.title}</Text>
    <Text style={[styles.serviceDescription, { color: palette.muted }]} numberOfLines={2}>{service.description}</Text>
    <View style={styles.cardBottom}><View style={styles.rating}><Star color="#F5A623" fill="#F5A623" size={16} /><Text style={[styles.ratingText, { color: palette.ink }]}>{service.rating.toFixed(1)}</Text><Text style={[styles.reviewText, { color: palette.muted }]}>({service.reviews} avaliações)</Text></View><Text style={[styles.viewDetails, { color: palette.primary }]}>Ver detalhes ›</Text></View>
  </Pressable>;
}

function ServiceDetail({ service, onClose, onContact, onRegister, onReport, palette, isGuest }: { service: Service; onClose: () => void; onContact: (phone: string, channel: 'whatsapp' | 'phone') => void; onRegister: (service: Service) => void; onReport: () => void; palette: ReturnType<typeof useTheme>; isGuest: boolean }) {
  return <View style={[styles.modalBackdrop, { backgroundColor: palette.backdrop }]}><View style={[styles.modalCard, { backgroundColor: palette.cardBg }]}><View style={[styles.modalHandle, { backgroundColor: palette.line }]} /><View style={styles.modalHeader}><Text style={[styles.modalLabel, { color: palette.primary }]}>DETALHES DO SERVIÇO</Text><Pressable onPress={onClose} hitSlop={10}><X color={palette.muted} size={23} /></Pressable></View><View style={styles.modalProvider}><Avatar name={service.providerName} color={service.avatarColor} size={58} /><View><Text style={[styles.modalProviderName, { color: palette.primaryDeep }]}>{service.providerName}</Text><Text style={[styles.modalLocation, { color: palette.muted }]}><MapPin color={palette.primary} size={13} /> {service.location}</Text></View></View><StatusPill label={service.category} tone={service.category === 'Jardinagem' ? 'green' : 'blue'} /><Text style={[styles.modalTitle, { color: palette.ink }]}>{service.title}</Text><Text style={[styles.modalDescription, { color: palette.muted }]}>{service.description}</Text><View style={[styles.detailBox, { backgroundColor: palette.softBg }]}><Text style={[styles.detailLabel, { color: palette.primary }]}>COMO FUNCIONA</Text><Text style={[styles.detailText, { color: palette.primaryDark }]}>{service.details}</Text></View><View style={styles.contactLine}><Text style={[styles.contactLabel, { color: palette.muted }]}>Telefone de contato</Text><Text style={[styles.phoneText, { color: palette.primaryDeep }]}>({service.phone.slice(0, 2)}) {service.phone.slice(2, 7)}-{service.phone.slice(7)}</Text></View><View style={styles.modalActions}><Pressable onPress={() => onContact(service.phone, 'whatsapp')} style={[styles.whatsButton, { backgroundColor: palette.success }]}><MessageCircle color={palette.white} size={19} /><Text style={[styles.actionText, { color: palette.white }]}>WhatsApp</Text></Pressable><Pressable onPress={() => onContact(service.phone, 'phone')} style={[styles.callButton, { backgroundColor: palette.successSoft }]}><Phone color={palette.success} size={19} /><Text style={[styles.callText, { color: palette.success }]}>Ligar</Text></Pressable></View><PrimaryButton label={isGuest ? 'Entrar para contratar' : 'Registrar contratação'} onPress={() => onRegister(service)} icon={<ShieldCheck color={palette.white} size={18} />} /><PrimaryButton label="Denunciar serviço" onPress={onReport} variant="ghost" icon={<Flag color={palette.primaryDark} size={18} />} /></View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  header: { paddingHorizontal: 24, paddingTop: 52, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, marginTop: 5, maxWidth: 250, lineHeight: 28 },
  searchBox: { height: 52, marginTop: 22, borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
  searchInput: { flex: 1, minHeight: 42, fontFamily: 'Inter_400Regular', fontSize: 13, paddingHorizontal: 10 },
  body: { padding: 24, gap: 16 },
  notice: { borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  noticeText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
  welcomeCard: { borderRadius: 18, padding: 18, paddingRight: 42, flexDirection: 'row', alignItems: 'center', gap: 12, position: 'relative' },
  welcomeCopy: { flex: 1, gap: 6 },
  welcomeKicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
  welcomeTitle: { fontFamily: 'Inter_700Bold', lineHeight: 25 },
  welcomeDescription: { fontFamily: 'Inter_400Regular', lineHeight: 19 },
  welcomeBadge: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dismissButton: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  welcomeBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  categoryRow: { gap: 8, paddingRight: 16 },
  categoryChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  categoryText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultsText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  locationText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, flexDirection: 'row', alignItems: 'center' },
  serviceCard: { borderRadius: 18, padding: 16, gap: 12, borderWidth: 1 },
  cardPressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  providerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  providerInfo: { flex: 1, gap: 5 },
  providerName: { fontFamily: 'Inter_700Bold' },
  serviceLocation: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  serviceTitle: { fontFamily: 'Inter_700Bold', lineHeight: 23 },
  serviceDescription: { fontFamily: 'Inter_400Regular', lineHeight: 20 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  reviewText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  viewDetails: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 42 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 14, maxHeight: '92%' },
  reportModal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 16 },
  reportDescription: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  reportInput: { minHeight: 110, borderWidth: 1, borderRadius: 12, padding: 14, textAlignVertical: 'top', fontFamily: 'Inter_400Regular', fontSize: 13 },
  modalHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 3 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.6 },
  modalProvider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalProviderName: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  modalLocation: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, lineHeight: 27 },
  modalDescription: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  detailBox: { borderRadius: 12, padding: 14, gap: 7 },
  detailLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.7 },
  detailText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  contactLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  phoneText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10 },
  whatsButton: { flex: 1, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  callButton: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  callText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});
