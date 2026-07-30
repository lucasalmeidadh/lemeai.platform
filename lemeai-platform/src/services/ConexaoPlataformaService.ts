import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface ConexaoPlataforma {
    conexaoPlataformaId: number;
    branchId: number;
    plataforma: number;
    status: number;
    nome: string;
    identificador: string;
    identificadorSecundario: string | null;
    tokenExpiracao: string | null;
    configuracaoJson: string | null;
    conexaoCreatedat: string;
    conexaoUpdatedat: string;
    usuarioAtribuidoId: number | null;
    usuarioAtribuidoNome: string | null;
    agenteIaId: number | null;
    agenteIaNome: string | null;
    usandoAgentePadrao: boolean;
}

export interface AtualizarConexaoDTO {
    conexaoPlataformaId: number;
    nome: string;
    token?: string | null;
    tokenExpiracao?: string | null;
    configuracaoJson?: string | null;
    status: number;
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export const PlataformaEnum = {
    WhatsappMeta: 1,
    WhatsappEvolution: 2,
    Instagram: 3,
    FacebookMessenger: 4,
    LeadAds: 5,
} as const;

export const StatusConexaoEnum = {
    Ativa: 1,
    Inativa: 2,
    Expirada: 3,
} as const;

export const getPlatformLabel = (plataforma: number): string => {
    switch (plataforma) {
        case 1: return 'WhatsApp (Meta)';
        case 2: return 'WhatsApp (Evolution)';
        case 3: return 'Instagram';
        case 4: return 'Facebook';
        case 5: return 'Lead Ads';
        default: return 'Desconhecido';
    }
};

export const getStatusLabel = (status: number): string => {
    switch (status) {
        case 1: return 'Ativa';
        case 2: return 'Inativa';
        case 3: return 'Expirada';
        default: return 'Desconhecido';
    }
};

export const ConexaoPlataformaService = {
    buscarConexoesAtivas: async (): Promise<ApiResponse<ConexaoPlataforma[]>> => {
        const response = await apiFetch(`${API_URL}/api/ConexaoPlataforma/BuscarConexoesAtivas`);
        return response.json();
    },

    removerComPermissao: async (id: number): Promise<ApiResponse<null>> => {
        const response = await apiFetch(`${API_URL}/api/ConexaoPlataforma/RemoverComPermissao/${id}`, {
            method: 'DELETE',
        });
        return response.json();
    },

    atualizar: async (dto: AtualizarConexaoDTO): Promise<ApiResponse<null>> => {
        const response = await apiFetch(`${API_URL}/api/ConexaoPlataforma/Atualizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        return response.json();
    },

    atribuirUsuario: async (conexaoId: number, userId: number | null): Promise<ApiResponse<null>> => {
        const response = await apiFetch(`${API_URL}/api/ConexaoPlataforma/${conexaoId}/atribuir-usuario`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        return response.json();
    },

    atribuirAgenteIa: async (conexaoId: number, agentConfigId: number | null): Promise<ApiResponse<null>> => {
        const response = await apiFetch(`${API_URL}/api/ConexaoPlataforma/${conexaoId}/atribuir-agente-ia`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentConfigId }),
        });
        return response.json();
    },
};
