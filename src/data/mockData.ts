export type ServiceCategory =
  | 'Todos'
  | 'Limpeza Geral'
  | 'Passadoria'
  | 'Jardinagem'
  | 'Pequenos Reparos'
  | 'Organização';

export type ContractStatus = 'ongoing' | 'completed';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  isProvider: boolean;
};

export type Service = {
  id: string;
  providerId: string;
  providerName: string;
  category: Exclude<ServiceCategory, 'Todos'>;
  title: string;
  description: string;
  details: string;
  location: string;
  rating: number;
  reviews: number;
  phone: string;
  avatarColor: string;
};

export type Contract = {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  category: Exclude<ServiceCategory, 'Todos'>;
  date: string;
  status: ContractStatus;
  confirmationCode: string;
  rating?: number;
  comment?: string;
};

export const mockUser: User = {
  id: 'CC-849201',
  name: 'Mariana Oliveira',
  email: 'mariana@campchores.com',
  phone: '(19) 98888-1200',
  location: 'Campinas, SP',
  bio: 'Gosto de ajudar a deixar a rotina mais leve e a casa mais acolhedora.',
  isProvider: false,
};

// MOCK DATA: remova este import e estes registros antes da publicação oficial.
export const mockServices: Service[] = [
  {
    id: 'service-1',
    providerId: 'provider-1',
    providerName: 'Ana Paula Mendes',
    category: 'Limpeza Geral',
    title: 'Faxina residencial completa',
    description: 'Limpeza cuidadosa para deixar sua casa leve, limpa e pronta para a semana.',
    details: 'Inclui cozinha, banheiros, quartos, sala e áreas comuns. Produtos básicos podem ser combinados antes do atendimento.',
    location: 'Cambuí, Campinas - SP',
    rating: 4.9,
    reviews: 38,
    phone: '19991112233',
    avatarColor: '#208AEF',
  },
  {
    id: 'service-2',
    providerId: 'provider-2',
    providerName: 'Beatriz Santos',
    category: 'Passadoria',
    title: 'Passadoria delicada e organizada',
    description: 'Roupas passadas com cuidado, separadas por tipo e devolvidas no prazo combinado.',
    details: 'Atendimento em domicílio para peças do dia a dia e tecidos delicados. Disponibilidade de terça a sábado.',
    location: 'Taquaral, Campinas - SP',
    rating: 4.8,
    reviews: 24,
    phone: '19992223344',
    avatarColor: '#00BCD4',
  },
  {
    id: 'service-3',
    providerId: 'provider-3',
    providerName: 'Carlos Henrique',
    category: 'Pequenos Reparos',
    title: 'Pequenos reparos elétricos e hidráulicos',
    description: 'Soluções rápidas para torneiras, tomadas, lâmpadas e ajustes domésticos.',
    details: 'Avaliação inicial por mensagem e orçamento transparente antes de iniciar. Não realizo serviços de alta complexidade.',
    location: 'Barão Geraldo, Campinas - SP',
    rating: 4.7,
    reviews: 31,
    phone: '19993334455',
    avatarColor: '#0A3D7A',
  },
  {
    id: 'service-4',
    providerId: 'provider-4',
    providerName: 'Diana Ribeiro',
    category: 'Jardinagem',
    title: 'Jardinagem, poda e cuidado de plantas',
    description: 'Seu jardim bem cuidado com poda, limpeza de canteiros e orientação para plantas.',
    details: 'Faço manutenção periódica, poda leve, replantio e organização de vasos. Materiais especiais são combinados à parte.',
    location: 'Jardim Chapadão, Campinas - SP',
    rating: 5,
    reviews: 19,
    phone: '19994445566',
    avatarColor: '#2E7D32',
  },
  {
    id: 'service-5',
    providerId: 'provider-5',
    providerName: 'Eduardo Lima',
    category: 'Organização',
    title: 'Organização prática de ambientes',
    description: 'Mais espaço e tranquilidade para sua rotina com organização por categorias.',
    details: 'Atendimento para quartos, cozinhas, despensas e home office. O processo respeita seu ritmo e seus objetos.',
    location: 'Nova Campinas, Campinas - SP',
    rating: 4.9,
    reviews: 16,
    phone: '19995556677',
    avatarColor: '#1685F8',
  },
  {
    id: 'service-6',
    providerId: 'provider-6',
    providerName: 'Fernanda Costa',
    category: 'Limpeza Geral',
    title: 'Limpeza pós-obra sem complicação',
    description: 'Remoção cuidadosa de poeira e resíduos para você aproveitar seu novo espaço.',
    details: 'Limpeza de pisos, vidros, superfícies e armários após pequenas reformas residenciais. Atendimento com checklist.',
    location: 'Mansões Santo Antônio, Campinas - SP',
    rating: 4.8,
    reviews: 27,
    phone: '19996667788',
    avatarColor: '#4CAF50',
  },
];

export const mockContracts: Contract[] = [
  {
    id: 'contract-demo-1',
    serviceId: 'service-1',
    serviceTitle: 'Faxina residencial completa',
    providerName: 'Ana Paula Mendes',
    category: 'Limpeza Geral',
    date: 'Hoje, 14:00',
    status: 'ongoing',
    confirmationCode: '4829',
  },
  {
    id: 'contract-demo-2',
    serviceId: 'service-4',
    serviceTitle: 'Jardinagem, poda e cuidado de plantas',
    providerName: 'Diana Ribeiro',
    category: 'Jardinagem',
    date: '08 de junho de 2025',
    status: 'completed',
    confirmationCode: '1794',
    rating: 5,
    comment: 'Muito cuidadosa e pontual.',
  },
];
