import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { Contract, Service, ServiceCategory, User } from '@/src/data/types';

export type ThemeMode = 'light' | 'dark';

export type ServiceReport = {
  id: string;
  serviceId: string;
  category: 'safety' | 'service' | 'conduct' | 'other';
  description: string;
  createdAt: string;
};

type SessionStatus = 'loading' | 'authenticated' | 'guest';

type AppContextValue = {
  status: SessionStatus;
  theme: ThemeMode;
  user: User | null;
  setTheme: (theme: ThemeMode) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (details: { name: string; email: string; phone: string; location: string; password: string }) => Promise<void>;
  enterGuestMode: () => void;
  signOut: () => Promise<void>;
  updateUser: (details: { name: string; phone: string; location: string; bio: string }) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
  becomeProvider: () => Promise<void>;
  services: Service[];
  createService: (service: { category: Exclude<ServiceCategory, 'Todos'>; title: string; description: string; details: string; location: string }) => Promise<void>;
  updateService: (serviceId: string, changes: { category: Exclude<ServiceCategory, 'Todos'>; title: string; description: string; details: string }) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  contracts: Contract[];
  createContract: (service: Service) => Promise<string | null>;
  completeContract: (contractId: string, code: string) => Promise<boolean>;
  rateContract: (contractId: string, rating: number, comment: string) => Promise<void>;
  hideContract: (contractId: string) => Promise<void>;
  submitReport: (serviceId: string, description: string, category?: ServiceReport['category']) => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const THEME_KEY = '@campchores/theme';
const GUEST_KEY = '@campchores/guest';

type ProfileRow = {
  id: string;
  public_id: string;
  display_name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  is_provider: boolean;
  avatar_url: string;
};

type ServiceRow = {
  id: string;
  provider_id: string;
  category: Exclude<ServiceCategory, 'Todos'>;
  title: string;
  description: string;
  details: string;
  location: string;
  rating: number;
  reviews_count: number;
  contact_phone: string;
};

type ContractRow = {
  id: string;
  service_id: string;
  service_title: string;
  provider_name: string;
  category: Contract['category'];
  status: Contract['status'];
  confirmation_code: string;
  created_at: string;
  rating?: number;
  comment?: string;
};

type CatalogRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: Exclude<ServiceCategory, 'Todos'>;
  contact_phone: string;
};

function mapServiceRow(row: ServiceRow, providerName: string, avatarColor: string): Service {
  return {
    id: row.id,
    providerId: row.provider_id,
    providerName,
    category: row.category,
    title: row.title,
    description: row.description,
    details: row.details,
    location: row.location,
    rating: Number(row.rating) || 5,
    reviews: row.reviews_count ?? 0,
    phone: row.contact_phone,
    avatarColor,
  };
}

const AVATAR_COLORS = ['#1685F8', '#208AEF', '#00BCD4', '#0A3D7A', '#2E7D32', '#4CAF50'];
function avatarColorFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  const loadServices = async () => {
    const { data: catalog, error } = await supabase
      .from('service_catalog')
      .select('id, owner_id, title, description, category, contact_phone');
    if (error || !catalog) return;

    const ownerIds = Array.from(new Set((catalog as CatalogRow[]).map((row) => row.owner_id)));
    const names = new Map<string, string>();
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', ownerIds);
      for (const profile of profiles ?? []) {
        names.set(profile.id as string, profile.display_name as string);
      }
    }

    // Serviços estruturais ativos (quem tem vitrine completa com detalhes)
    const { data: rows } = await supabase
      .from('services')
      .select('id, provider_id, category, title, description, details, location, rating, reviews_count, contact_phone')
      .eq('is_active', true);
    const structured = (rows as ServiceRow[] | null) ?? [];

    const structuredProviderIds = new Set(structured.map((row) => row.provider_id));
    // Catálogo-only: vitrine simples para prestadores sem serviço estrutural publicado
    const catalogOnly = (catalog as CatalogRow[])
      .filter((row) => !structuredProviderIds.has(row.owner_id))
      .map((row) =>
        mapServiceRow(
          {
            id: row.id,
            provider_id: row.owner_id,
            category: row.category,
            title: row.title,
            description: row.description || row.title,
            details: row.description || 'Detalhes combinados diretamente com o prestador.',
            location: 'Campinas, SP',
            rating: 5,
            reviews_count: 0,
            contact_phone: row.contact_phone,
          },
          names.get(row.owner_id) || 'Colaborador CampChores',
          avatarColorFor(row.owner_id),
        ),
      );

    setServices([
      ...structured.map((row) =>
        mapServiceRow(row, names.get(row.provider_id) || 'Colaborador CampChores', avatarColorFor(row.provider_id)),
      ),
      ...catalogOnly,
    ]);
  };

  const loadContracts = async (userId: string) => {
    const { data, error } = await supabase
      .from('contracts')
      .select('id, service_id, service_title, provider_name, category, status, confirmation_code, created_at, hidden_at')
      .eq('client_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return;
    const rows = (data as (ContractRow & { hidden_at: string | null })[]);
    setContracts(
      rows
        .filter((row) => !row.hidden_at)
        .map((row) => ({
          id: row.id,
          serviceId: row.service_id,
          serviceTitle: row.service_title,
          providerName: row.provider_name,
          category: row.category,
          date: new Date(row.created_at).toLocaleDateString('pt-BR'),
          status: row.status,
          confirmationCode: row.confirmation_code,
          hidden: false,
        })),
    );
  };

  const loadProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, public_id, display_name, email, phone, location, bio, is_provider, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as ProfileRow;
    return {
      id: row.id,
      publicId: row.public_id,
      name: row.display_name,
      email: row.email,
      phone: row.phone,
      location: row.location,
      bio: row.bio,
      isProvider: row.is_provider,
      avatarUrl: row.avatar_url,
    };
  };

  const loadSignedAvatar = async (path: string): Promise<string> => {
    const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
    return data?.signedUrl || '';
  };

  useEffect(() => {
    void (async () => {
      const [storedTheme, storedGuest] = await Promise.all([
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(GUEST_KEY),
      ]);
      if (storedTheme === 'dark' || storedTheme === 'light') setThemeState(storedTheme);

      await loadServices();

      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        if (profile) {
          if (profile.avatarUrl && !profile.avatarUrl.startsWith('http')) {
            profile.avatarUrl = await loadSignedAvatar(profile.avatarUrl);
          }
          setUser(profile);
          await loadContracts(profile.id);
          setStatus('authenticated');
          return;
        }
      }
      setStatus(storedGuest === 'true' || !session?.user ? 'guest' : 'guest');
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setContracts([]);
          setStatus('guest');
          return;
        }
        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          const profile = await loadProfile(session.user.id);
          if (profile) {
            if (profile.avatarUrl && !profile.avatarUrl.startsWith('http')) {
              profile.avatarUrl = await loadSignedAvatar(profile.avatarUrl);
            }
            setUser(profile);
            await loadContracts(profile.id);
            setStatus('authenticated');
          }
        }
      })();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const setTheme = (next: ThemeMode) => {
    setThemeState(next);
    void AsyncStorage.setItem(THEME_KEY, next);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('E-mail ou senha incorretos. Tente novamente.');
    await AsyncStorage.setItem(GUEST_KEY, 'false');
  };

  const signUp = async (details: { name: string; email: string; phone: string; location: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email: details.email,
      password: details.password,
      options: { data: { name: details.name, phone: details.phone, location: details.location } },
    });
    if (error) {
      console.error('Erro no cadastro Supabase:', error.message);
    
      if (
        error.message.includes('already registered') ||
        error.message.includes('already exists')
      ) {
        throw new Error('Este e-mail já possui uma conta. Tente entrar.');
      }
      if (error.code === 'weak_password') {
        throw new Error(
          'Essa senha foi identificada como comprometida em vazamentos de dados. Escolha outra senha, de preferência única.'
        );
      }
      
      if (error.message.toLowerCase().includes('password')) {
        throw new Error('Não foi possível utilizar essa senha. Escolha outra.');
      }
          
      throw new Error('Não foi possível criar a conta. Verifique os dados e tente novamente.');
    }
    if (data.session) {
      await AsyncStorage.setItem(GUEST_KEY, 'false');
      return;
    }
    throw new Error('Conta criada! Confirme o e-mail na sua caixa de entrada e depois faça login.');
  };

  const enterGuestMode = () => {
    setUser(null);
    setContracts([]);
    setStatus('guest');
    void AsyncStorage.setItem(GUEST_KEY, 'true');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setContracts([]);
    setStatus('guest');
    void AsyncStorage.setItem(GUEST_KEY, 'false');
  };

  const updateUser = async (details: { name: string; phone: string; location: string; bio: string }) => {
    if (!user) throw new Error('Entre na sua conta para editar o perfil.');
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: details.name,
        phone: details.phone,
        location: details.location,
        bio: details.bio,
      })
      .eq('id', user.id);
    if (error) throw new Error('Não foi possível salvar o perfil.');
    setUser({ ...user, ...details });
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) throw new Error('Entre na sua conta para alterar a foto.');
    const response = await fetch(uri);
    const blob = await response.blob();
    const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const path = `${user.id}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
    if (uploadError) throw new Error('Não foi possível enviar a foto. Tente novamente.');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: path })
      .eq('id', user.id);
    if (updateError) throw new Error('Não foi possível salvar a foto no perfil.');

    const signedUrl = await loadSignedAvatar(path);
    setUser({ ...user, avatarUrl: signedUrl });
  };

  const becomeProvider = async () => {
    if (!user) throw new Error('Entre na sua conta para ativar o perfil colaborador.');
    const { error } = await supabase.rpc('become_provider');
    if (error) throw new Error('Não foi possível ativar o perfil colaborador.');
    setUser({ ...user, isProvider: true });
  };

  const createService = async (service: { category: Exclude<ServiceCategory, 'Todos'>; title: string; description: string; details: string; location: string }) => {
    if (!user) throw new Error('Entre na sua conta para publicar serviços.');
    const phone = user.phone.replace(/\D/g, '');
    if (phone.length < 10) throw new Error('Atualize seu telefone no perfil antes de publicar (necessário para contato).');
    const { error } = await supabase.from('services').insert({
      category: service.category,
      title: service.title,
      description: service.description,
      details: service.details,
      location: service.location,
      contact_phone: phone,
    });
    if (error) {
      if (error.message.includes('is_provider')) {
        throw new Error('Ative o perfil colaborador antes de publicar serviços.');
      }
      throw new Error('Não foi possível publicar o serviço. Tente novamente em instantes.');
    }
    await supabase.from('service_catalog').insert({
      title: service.title,
      description: service.description,
      category: service.category,
      contact_phone: phone,
    });
    await loadServices();
  };

  const updateService = async (serviceId: string, changes: { category: Exclude<ServiceCategory, 'Todos'>; title: string; description: string; details: string }) => {
    if (!user) throw new Error('Entre na sua conta para editar serviços.');
    const { error } = await supabase.from('services').update(changes).eq('id', serviceId).eq('provider_id', user.id);
    if (error) throw new Error('Não foi possível atualizar o serviço.');
    await loadServices();
  };

  const deleteService = async (serviceId: string) => {
    if (!user) throw new Error('Entre na sua conta para excluir serviços.');
    const { error } = await supabase.from('services').delete().eq('id', serviceId).eq('provider_id', user.id);
    if (error) {
      // Contratos existentes preservam o histórico e impedem apagar o serviço;
      // nesse caso arquivamos (oculta da vitrine) em vez de falhar.
      const { error: archiveError } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId)
        .eq('provider_id', user.id);
      if (archiveError) throw new Error('Não foi possível excluir o serviço. Tente novamente em instantes.');
    }
    await loadServices();
  };

  const createContract = async (service: Service) => {
    if (!user) return null;
    const { data, error } = await supabase.rpc('create_contract', { p_service_id: service.id });
    if (error || !data) return null;
    await loadContracts(user.id);
    return data as string;
  };

  const completeContract = async (contractId: string, code: string) => {
    if (!user) return false;
    const { data, error } = await supabase.rpc('confirm_contract_completion', { p_contract_id: contractId, p_confirmation_code: code });
    if (error || !data) return false;
    await loadContracts(user.id);
    return true;
  };

  const rateContract = async (contractId: string, rating: number, comment: string) => {
    if (!user) throw new Error('Entre na sua conta para avaliar.');
    const { error } = await supabase.rpc('rate_contract', { p_contract_id: contractId, p_rating: rating, p_comment: comment });
    if (error) throw new Error('Não foi possível registrar a avaliação.');
    await loadContracts(user.id);
  };

  const hideContract = async (contractId: string) => {
    if (!user) throw new Error('Entre na sua conta para gerenciar o histórico.');
    const { error } = await supabase
      .from('contracts')
      .update({ hidden_at: new Date().toISOString() })
      .eq('id', contractId)
      .eq('client_id', user.id);
    if (error) throw new Error('Não foi possível esconder este item do histórico.');
    setContracts((current) => current.filter((contract) => contract.id !== contractId));
  };

  const submitReport = async (serviceId: string, description: string, category: ServiceReport['category'] = 'service') => {
    if (!user) throw new Error('Entre na sua conta para enviar uma denúncia.');
    const isRealService = serviceId.includes('-') && serviceId.length > 20;
    const { error } = await supabase.from('reports').insert({
      category,
      description,
      service_id: isRealService ? serviceId : null,
    });
    if (error) throw new Error('Não foi possível registrar a denúncia. Tente novamente.');
  };

  const value = useMemo<AppContextValue>(
    () => ({
      status,
      theme,
      user,
      setTheme,
      signIn,
      signUp,
      enterGuestMode,
      signOut,
      updateUser,
      uploadAvatar,
      becomeProvider,
      services,
      createService,
      updateService,
      deleteService,
      contracts,
      createContract,
      completeContract,
      rateContract,
      hideContract,
      submitReport,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, theme, user, services, contracts],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp precisa estar dentro de AppProvider.');
  return context;
}
