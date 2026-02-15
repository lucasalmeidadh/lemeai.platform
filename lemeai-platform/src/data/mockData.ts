export interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other' | 'ia';
  time: string;
  status?: 'sending' | 'sent' | 'failed';
  type?: 'text' | 'image' | 'audio' | 'file' | 'document';
  mediaUrl?: string;
}

export interface Contact {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  initials: string;
  phone: string;
  responsibleName?: string;
  statusId?: number;
  detailsValue?: number;
  messagesByDate: {
    [date: string]: Message[];
  };
}

export const contactsData: Contact[] = [
  {
    id: 1,
    name: 'Lucas Almeida',
    lastMessage: 'Olá, como você está hoje?',
    time: '5m',
    unread: 1,
    initials: 'LA',
    phone: '(41) 99820-7192',
    messagesByDate: {
      'Ontem': [
        { id: 1, text: 'Olá, como você está hoje?', sender: 'other', time: '15:30', status: 'sent' },
        { id: 2, text: 'Olá, Lucas! Estou bem e você?', sender: 'me', time: '15:31', status: 'sent' },
      ],
      'Hoje': [
        { id: 3, text: 'Estou ótimo', sender: 'other', time: '09:15', status: 'sent' },
        { id: 4, text: 'Que bom! Podemos agendar uma demonstração do produto para amanhã?', sender: 'me', time: '09:16', status: 'sent' }
      ]
    }
  },
  {
    id: 2,
    name: 'Camila Santana',
    lastMessage: 'Olá, eu gostaria de um orçamento.',
    time: '1h',
    unread: 0,
    initials: 'AB',
    phone: '(21) 99999-8888',
    messagesByDate: {
      'Hoje': [
        { id: 1, text: 'Olá, eu gostaria de um orçamento.', sender: 'other', time: '08:20', status: 'sent' }
      ]
    }
  },
  {
    id: 3,
    name: 'Bruna Rosa',
    lastMessage: 'Olá, tudo bem?',
    time: '3h',
    unread: 2,
    initials: 'JC',
    phone: '(31) 98888-7777',
    messagesByDate: {
      'Hoje': [
        { id: 1, text: 'Olá, tudo bem?', sender: 'other', time: '06:10', status: 'sent' }
      ]
    }
  },

];

export interface InternalUser {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
}

export const mockInternalUsers: InternalUser[] = [
  { id: 101, name: "Ana Souza", avatar: "AS", online: true },
  { id: 102, name: "Roberto Lima", avatar: "RL", online: false },
  { id: 103, name: "Fernanda Costa", avatar: "FC", online: true },
  { id: 104, name: "Gerente Geral", avatar: "GG", online: true },
];