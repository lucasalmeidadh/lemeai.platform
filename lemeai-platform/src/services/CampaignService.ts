import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface Campaign {
    campanhaId: number;
    campanhaNome: string;
    campanhaTemplateNome: string;
    campanhaTemplateIdioma: string;
    campanhaCategoria: CampanhaCategoria;
    campanhaStatus: CampanhaStatus;
    campanhaAgendadaEm: string | null;
    campanhaCreatedat: string;
    campanhaUpdatedat: string;
}

export interface CampaignMetrics extends Campaign {
    totalDisparado: number;
    totalComInteracao: number;
    percentualInteracao: number;
}

export type CampanhaStatus = 'Rascunho' | 'Enviando' | 'Finalizada';
export type CampanhaCategoria = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

export interface CreateCampaignDTO {
    nome: string;
    templateNome: string;
    templateIdioma: string;
    categoria: CampanhaCategoria;
    agendadaEm?: string;
}

export interface UpdateCampaignDTO {
    campanhaId: number;
    nome: string;
    templateNome: string;
    templateIdioma: string;
    categoria: CampanhaCategoria;
    status: CampanhaStatus;
    agendadaEm?: string;
}

export interface DispararDestinatario {
    numero?: string;
    bsuid?: string;
    /** variaveis[0] → {{1}}, variaveis[1] → {{2}}, etc. Sobrepõe BODY de componentes para este destinatário. */
    variaveis?: string[];
}

export interface DispararDTO {
    destinatarios: DispararDestinatario[];
    componentes?: ComponenteTemplate[];
}

export interface ComponenteTemplate {
    tipo: 'HEADER' | 'BODY' | 'BUTTON';
    indicesBotao?: number;
    parametros: { tipo: string; texto: string }[];
}

export interface DispararResult {
    totalDestinatarios: number;
    totalEnviados: number;
    totalFalhas: number;
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export const CampaignService = {
    getAll: async (): Promise<ApiResponse<Campaign[]>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/BuscarTodos`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return res.json();
        return res.json();
    },

    getMetrics: async (): Promise<ApiResponse<CampaignMetrics[]>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/ResumoMetricas`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },

    create: async (dto: CreateCampaignDTO): Promise<ApiResponse<Campaign>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/Criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        return res.json();
    },

    update: async (dto: UpdateCampaignDTO): Promise<ApiResponse<null>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/Atualizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        return res.json();
    },

    remove: async (id: number): Promise<ApiResponse<null>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/Remover/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },

    disparar: async (id: number, dto: DispararDTO): Promise<ApiResponse<DispararResult>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/${id}/disparar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        return res.json();
    },
};
