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

const API_URL = import.meta.env.VITE_API_URL || '';

export const RegrasIAService = {
    getAll: async (): Promise<ApiResponse<IARule[]>> => {
        const response = await fetch(`${API_URL}/api/RegrasIA/BuscarTodos`, {
            method: 'GET',
            credentials: 'include',
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
        const response = await fetch(`${API_URL}/api/RegrasIA/BuscarPorId/${id}`, {
            method: 'GET',
            credentials: 'include',
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
        const response = await fetch(`${API_URL}/api/RegrasIA/Criar`, {
            method: 'POST',
            credentials: 'include',
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
        const response = await fetch(`${API_URL}/api/RegrasIA/Atualizar/${rule.id}`, {
            method: 'PUT',
            credentials: 'include',
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
        const response = await fetch(`${API_URL}/api/RegrasIA/Excluir/${id}`, {
            method: 'DELETE',
            credentials: 'include',
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
