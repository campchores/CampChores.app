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
