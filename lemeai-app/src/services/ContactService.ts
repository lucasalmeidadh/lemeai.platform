export interface Contact {
    contatoId: number;
    nome: string;
    telefone: string;
    email: string | null;
    dataCriacao?: string;
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export interface CreateContactDTO {
    nome: string;
    telefone: string;
    email: string;
}

export interface UpdateContactDTO {
    contatoId: number;
    nome: string;
    telefone: string;
    email: string;
}

import { apiFetch } from './api';

const API_URL = 'https://api.gbcode.com.br';

export const ContactService = {
    getAll: async (): Promise<ApiResponse<Contact[]>> => {
        const response = await apiFetch(`${API_URL}/api/Contato/BuscarTodos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            if (response.status === 400) {
                return { sucesso: true, mensagem: 'Sem contatos', dados: [] };
            }
            throw new Error('Erro ao buscar contatos');
        }
        return response.json();
    },

    getById: async (id: number): Promise<ApiResponse<Contact>> => {
        const response = await apiFetch(`${API_URL}/api/Contato/BuscarPorId/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar contato');
        }
        return response.json();
    },

    create: async (contact: CreateContactDTO): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/Contato/Criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contact),
        });
        if (!response.ok) {
            throw new Error('Erro ao criar contato');
        }
        return response.json();
    },

    update: async (contact: UpdateContactDTO): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/Contato/Atualizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contact),
        });
        if (!response.ok) {
            throw new Error('Erro ao atualizar contato');
        }
        return response.json();
    },

    delete: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/Contato/Remover/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao remover contato');
        }
        return response.json();
    },
};
