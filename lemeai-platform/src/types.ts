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
  messagesByDate: {
    [date: string]: any[];
  }
}