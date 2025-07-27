// ARQUIVO: src/data/mockData.ts

// Definimos os "tipos" dos nossos dados para garantir consistência
export interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  time: string;
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
    [date: string]: Message[];
  };
}

// Nossos dados centralizados
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
        { id: 1, text: 'Olá, como você está hoje?', sender: 'other', time: '15:30' },
        { id: 2, text: 'Olá, Lucas! Estou bem e você?', sender: 'me', time: '15:31' },
      ],
      'Hoje': [
        { id: 3, text: 'Estou ótimo', sender: 'other', time: '09:15' },
        { id: 4, text: 'Que bom! Podemos agendar uma demonstração do produto para amanhã?', sender: 'me', time: '09:16' }
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
        { id: 1, text: 'Olá, eu gostaria de um orçamento.', sender: 'other', time: '08:20' }
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
        { id: 1, text: 'Olá, tudo bem?', sender: 'other', time: '06:10' }
      ]
    }
  },
];