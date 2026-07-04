import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface MotivoPerda {
    motivoPerdaId: number;
    descricao: string;
    dataCriacao?: string;
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export interface CreateMotivoPerdaDTO {
    descricao: string;
}

export interface UpdateMotivoPerdaDTO {
    motivoPerdaId: number;
    descricao: string;
}

export const MotivoPerdaService = {
    getAll: async (): Promise<ApiResponse<MotivoPerda[]>> => {
        const response = await apiFetch(`${API_URL}/api/MotivoPerda/BuscarTodos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            if (response.status === 400 || response.status === 404) {
                return { sucesso: true, mensagem: 'Sem motivos de perda', dados: [] };
            }
            throw new Error('Erro ao buscar motivos de perda');
        }
        return response.json();
    },

    getById: async (id: number): Promise<ApiResponse<MotivoPerda>> => {
        const response = await apiFetch(`${API_URL}/api/MotivoPerda/BuscarPorId/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar motivo de perda');
        }
        return response.json();
    },

    create: async (motivoPerda: CreateMotivoPerdaDTO): Promise<ApiResponse<MotivoPerda>> => {
        const response = await apiFetch(`${API_URL}/api/MotivoPerda/Criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(motivoPerda),
        });
        if (!response.ok) {
            throw new Error('Erro ao criar motivo de perda');
        }
        return response.json();
    },

    update: async (motivoPerda: UpdateMotivoPerdaDTO): Promise<ApiResponse<MotivoPerda>> => {
        const response = await apiFetch(`${API_URL}/api/MotivoPerda/Atualizar/${motivoPerda.motivoPerdaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(motivoPerda),
        });
        if (!response.ok) {
            throw new Error('Erro ao atualizar motivo de perda');
        }
        return response.json();
    },

    delete: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/MotivoPerda/Deletar/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao excluir motivo de perda');
        }
        return response.json();
    },
};
