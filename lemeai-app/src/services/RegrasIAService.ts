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

import { apiFetch } from './api';

const API_URL = 'https://api.gbcode.com.br';

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
        const response = await apiFetch(`${API_URL}/api/RegrasIA/BuscarPorId/${id}`, {
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
        const response = await apiFetch(`${API_URL}/api/RegrasIA/Criar`, {
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
        const response = await apiFetch(`${API_URL}/api/RegrasIA/Atualizar/${rule.id}`, {
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
        const response = await apiFetch(`${API_URL}/api/RegrasIA/Excluir/${id}`, {
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
};
