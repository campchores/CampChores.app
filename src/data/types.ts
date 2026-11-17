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
  publicId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  isProvider: boolean;
  avatarUrl: string;
};

export type Service = {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string;
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
  hidden: boolean;
  rating?: number;
  comment?: string;
};
