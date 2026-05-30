import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface MetaTemplate {
    metaTemplateId: number;
    templateMetaId: string;
    nome: string;
    categoria: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    idioma: string;
    status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'DISABLED' | 'PAUSED';
    qualidade: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    componentesJson: string | null;
    motivoRejeicao: string | null;
    sincronizadoEm: string | null;
    criadoEm: string;
}

export interface BotaoTemplate {
    tipo: 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER';
    texto: string;
    url?: string;
    telefone?: string;
}

export interface CreateTemplateDTO {
    nome: string;
    categoria: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    idioma: string;
    textoBody: string;
    textoHeader?: string;
    formatoHeader?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    exemploHeaderHandle?: string;
    caminhoMidiaHeader?: string;
    exemploHeaderTexto?: string;
    textoFooter?: string;
    botoes?: BotaoTemplate[];
    exemplosBody?: string[];
}

export interface ObterHandleExemploResult {
    handle: string;
    caminhoLocal: string;
}


export interface SincronizarResult {
    criados: number;
    atualizados: number;
    total: number;
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export const MetaTemplateService = {
    getAll: async (): Promise<ApiResponse<MetaTemplate[]>> => {
        const response = await apiFetch(`${API_URL}/api/meta/template/BuscarTodos`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ sucesso: false, mensagem: 'Erro ao buscar templates.', dados: [] }));
            return err;
        }
        return response.json();
    },

    getById: async (id: number): Promise<ApiResponse<MetaTemplate>> => {
        const response = await apiFetch(`${API_URL}/api/meta/template/BuscarPorId/${id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar template');
        }
        return response.json();
    },

    create: async (dto: CreateTemplateDTO): Promise<ApiResponse<MetaTemplate>> => {
        const response = await apiFetch(`${API_URL}/api/meta/template/Criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        const data = await response.json();
        return data;
    },

    remove: async (id: number): Promise<ApiResponse<null>> => {
        const response = await apiFetch(`${API_URL}/api/meta/template/Remover/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    },

    sincronizar: async (): Promise<ApiResponse<SincronizarResult>> => {
        const response = await apiFetch(`${API_URL}/api/meta/template/Sincronizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    },

    obterHandleExemplo: async (arquivo: File): Promise<ApiResponse<ObterHandleExemploResult>> => {
        const formData = new FormData();
        formData.append('arquivo', arquivo);
        const response = await apiFetch(`${API_URL}/api/meta/template/ObterHandleExemplo`, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        return data;
    },

};
