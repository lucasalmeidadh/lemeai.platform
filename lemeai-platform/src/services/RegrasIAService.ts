export interface IARule {
    id: number;
    descricaoRegra: string;
    ordem?: number;
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export interface CreateIARuleDTO {
    descricaoRegra: string;
    ordem?: number;
}

export interface UpdateIARuleDTO {
    id: number;
    descricaoRegra: string;
    ordem?: number;
}

export interface ConfigAgente {
    id: number;
    nome: string;
    descricaoCabecalho: string;
    descricaoRodape: string;
    regras: IARule[];
}

import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export const RegrasIAService = {
    getAll: async (): Promise<ApiResponse<IARule[]>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/BuscarTodos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar regras');
        }
        return response.json();
    },

    getById: async (id: number): Promise<ApiResponse<IARule>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/BuscarRegraPorId/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar regra');
        }
        return response.json();
    },

    create: async (rule: CreateIARuleDTO): Promise<ApiResponse<IARule>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/CriarRegra`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rule),
        });
        if (!response.ok) {
            throw new Error('Erro ao criar regra');
        }
        return response.json();
    },

    update: async (rule: UpdateIARuleDTO): Promise<ApiResponse<IARule>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/AtualizarRegra/${rule.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rule),
        });
        if (!response.ok) {
            throw new Error('Erro ao atualizar regra');
        }
        return response.json();
    },

    delete: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/ExcluirRegra/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao excluir regra');
        }
        return response.json();
    },

    getConfigAgente: async (): Promise<ApiResponse<ConfigAgente>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/BuscarConfigAgente`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar configuração do agente');
        }
        return response.json();
    },

    createConfigAgente: async (config: Omit<ConfigAgente, 'id'>): Promise<ApiResponse<ConfigAgente>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/CriarConfigAgente`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });
        if (!response.ok) {
            throw new Error('Erro ao criar configuração do agente');
        }
        return response.json();
    },

    updateConfigAgente: async (id: number, config: Partial<ConfigAgente>): Promise<ApiResponse<ConfigAgente>> => {
        const { regras, ...dadosParaEnviar } = config;

        const response = await apiFetch(`${API_URL}/api/RegrasIA/AtualizarConfigAgente`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, ...dadosParaEnviar }),
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar configuração do agente');
        }

        return response.json();
    },

    deleteConfigAgente: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/ExcluirConfigAgente/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao excluir configuração do agente');
        }
        return response.json();
    },
};
