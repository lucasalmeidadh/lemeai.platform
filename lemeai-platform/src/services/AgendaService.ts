import { apiFetch } from './api';

const apiUrl = import.meta.env.VITE_API_URL;

export interface AgendaEvent {
    agendaId: number;
    descricao: string;
    dataInicio: string;
    dataFim: string;
    contatoId?: number;
    detalhes?: string;
    dataCriacao?: string;
}

export interface CreateEventDTO {
    descricao: string;
    dataInicio: string;
    dataFim: string;
    contatoId?: number;
    detalhes?: string;
}

export interface UpdateEventDTO extends CreateEventDTO {
    agendaId: number;
}

export interface AgendaResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export const AgendaService = {
    async getAll(): Promise<AgendaEvent[]> {
        const response = await apiFetch(`${apiUrl}/api/Agenda/BuscarTodos`);
        const result: AgendaResponse<AgendaEvent[]> = await response.json();
        return result.sucesso ? result.dados : [];
    },

    async getById(id: number): Promise<AgendaEvent | null> {
        const response = await apiFetch(`${apiUrl}/api/Agenda/BuscarPorId/${id}`);
        const result: AgendaResponse<AgendaEvent> = await response.json();
        return result.sucesso ? result.dados : null;
    },

    async getTodayEvents(): Promise<AgendaEvent[]> {
        const response = await apiFetch(`${apiUrl}/api/Agenda/EventosDoDia`);
        const result: AgendaResponse<AgendaEvent[]> = await response.json();
        return result.sucesso ? result.dados : [];
    },

    async getNextDayEvents(): Promise<AgendaEvent[]> {
        const response = await apiFetch(`${apiUrl}/api/Agenda/EventosProximoDia`);
        const result: AgendaResponse<AgendaEvent[]> = await response.json();
        return result.sucesso ? result.dados : [];
    },

    async create(event: CreateEventDTO): Promise<AgendaResponse<AgendaEvent>> {
        const response = await apiFetch(`${apiUrl}/api/Agenda/Criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
        return await response.json();
    },

    async update(event: UpdateEventDTO): Promise<AgendaResponse<AgendaEvent>> {
        const response = await apiFetch(`${apiUrl}/api/Agenda/Atualizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
        return await response.json();
    },

    async remove(id: number): Promise<AgendaResponse<null>> {
        const response = await apiFetch(`${apiUrl}/api/Agenda/Remover/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    },

    // Chat specific scheduling
    async getEventsByConversation(conversationId: number): Promise<AgendaEvent[]> {
        const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${conversationId}/Agendamentos`);
        const result: AgendaResponse<AgendaEvent[]> = await response.json();
        return result.sucesso ? result.dados : [];
    },

    async createEventByConversation(conversationId: number, event: CreateEventDTO): Promise<AgendaResponse<AgendaEvent>> {
        // According to docs, contatoId is derived automatically from conversationId in this endpoint
        const { contatoId, ...payload } = event;
        const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${conversationId}/AdicionarAgendamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    }
};
