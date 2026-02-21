export interface Contact {
    id: number;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    initials: string;
    phone: string;
    statusId?: number;
    detailsValue?: number;
    responsibleName?: string;
}

export interface Message {
    id: number;
    text: string;
    sender: 'me' | 'other' | 'ia';
    time: string;
    status?: 'sending' | 'sent' | 'read' | 'failed';
    type?: 'text' | 'image' | 'audio' | 'file' | 'document';
    mediaUrl?: string;
    fileDoc?: any;
}

export interface InternalUser {
    id: number;
    name: string;
    email?: string;
    role?: string;
}

export interface ApiConversation {
    idConversa: number;
    nomeCliente: string;
    numeroWhatsapp: string;
    ultimaMensagem: string;
    dataUltimaMensagem: string;
    totalNaoLidas: number;
    idStatus?: number;
    valor?: number;
}

export interface ApiMessage {
    idMensagem: number;
    idConversa: number;
    mensagem: string;
    origemMensagem: number;
    dataEnvio: string;
    tipoMensagem?: 'text' | 'image' | 'audio' | 'file' | 'document';
    urlMidia?: string;
    caminhoArquivo?: string;
}

export interface CurrentUser {
    id: number;
    nome?: string;
    name?: string;
}

export interface MessagesByDate {
    [date: string]: Message[];
}
