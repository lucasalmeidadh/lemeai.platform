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
};
