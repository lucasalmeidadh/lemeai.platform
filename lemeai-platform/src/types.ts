export interface User {
  id: number | null;
  name: string;
  email: string;
  profileId: number;
  status: 'Ativo' | 'Inativo';
}


export interface Profile {
  id: number;
  nome: string;
  codigo: string;
}

export interface Contact {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  initials: string;
  phone: string;
  statusId?: number; // 1: Não iniciado, 2: Em negociação, 3: Proposta enviada, 4: Venda Fechada, 5: Venda Perdida
  detailsValue?: number; // Saved value for the deal
  messagesByDate: {
    [date: string]: any[];
  }
}