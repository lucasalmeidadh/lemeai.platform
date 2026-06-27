import { apiFetch } from './api';

const apiUrl = import.meta.env.VITE_API_URL;

export interface GoogleCalendarEvent {
    id: string;
    titulo: string;
    descricao?: string;
    inicio: string;
    fim: string;
    emailsConvidados: string[];
    linkMeet: string | null;
    criarLinkMeet: boolean;
    agendaId: number | null;
    atualizadoEm: string;
    cancelado: boolean;
}

export interface CreateGoogleEventDTO {
    titulo: string;
    descricao?: string;
    inicio: string;
    fim: string;
    emailsConvidados?: string[];
    criarLinkMeet?: boolean;
    contatoId?: number;
    sincronizarComAgenda?: boolean;
}

export interface UpdateGoogleEventDTO {
    titulo: string;
    descricao?: string;
    inicio: string;
    fim: string;
    emailsConvidados?: string[];
    criarLinkMeet?: boolean;
}

export interface GoogleCalendarResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export const GoogleCalendarService = {
    async getAuthUrl(redirectUri: string): Promise<string | null> {
        const response = await apiFetch(`${apiUrl}/api/CalendarioGoogle/Autenticar/Google?redirectUri=${encodeURIComponent(redirectUri)}`);
        const result: GoogleCalendarResponse<string> = await response.json();
        return result.sucesso ? result.dados : null;
    },

    async authCallback(code: string, redirectUri: string): Promise<GoogleCalendarResponse<null>> {
        const response = await apiFetch(`${apiUrl}/api/CalendarioGoogle/Autenticar/Callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri })
        });
        return await response.json();
    },

    async disconnect(): Promise<GoogleCalendarResponse<null>> {
        const response = await apiFetch(`${apiUrl}/api/CalendarioGoogle/Desconectar`, {
            method: 'DELETE'
        });
        return await response.json();
    },

    async create(event: CreateGoogleEventDTO): Promise<GoogleCalendarResponse<GoogleCalendarEvent>> {
        const response = await apiFetch(`${apiUrl}/api/CalendarioGoogle/Criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
        return await response.json();
    },

    async getAll(dataInicio?: string, dataFim?: string, incluirCancelados = false): Promise<GoogleCalendarResponse<GoogleCalendarEvent[]>> {
        const params = new URLSearchParams();
        if (dataInicio) params.set('dataInicio', dataInicio);
        if (dataFim) params.set('dataFim', dataFim);
        if (incluirCancelados) params.set('incluirCancelados', 'true');
        const response = await apiFetch(`${apiUrl}/api/CalendarioGoogle/BuscarTodas?${params.toString()}`);
        return await response.json();
    },

    async getById(eventId: string): Promise<GoogleCalendarResponse<GoogleCalendarEvent>> {
        const response = await apiFetch(`${apiUrl}/api/CalendarioGoogle/BuscarPorId/${eventId}`);
        return await response.json();
    },

    async update(eventId: string, event: UpdateGoogleEventDTO): Promise<GoogleCalendarResponse<null>> {
        const response = await apiFetch(`${apiUrl}/api/CalendarioGoogle/Atualizar/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
        return await response.json();
    },

    async remove(eventId: string): Promise<GoogleCalendarResponse<null>> {
        const response = await apiFetch(`${apiUrl}/api/CalendarioGoogle/Deletar/${eventId}`, {
            method: 'DELETE'
        });
        return await response.json();
    }
};
