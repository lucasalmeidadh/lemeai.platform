
export interface Product {
    produtoId: number;
    codigo: string;
    codigoReferencia?: string;
    nome: string;
    codigoBarra?: string;
    marca: string;
    secao?: string;
    peso: number;
    preco: number;
    precoDeCusto: number;
    dataCriacao?: string;
    link?: string;
    descricaoDetalhada?: string;
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export interface CreateProductDTO {
    codigo: string;
    codigoReferencia?: string;
    nome: string;
    codigoBarra?: string;
    marca: string;
    secao?: string;
    peso: number;
    preco: number;
    precoDeCusto: number;
    link?: string;
    descricaoDetalhada?: string;
}

export interface UpdateProductDTO {
    produtoId: number;
    codigo: string;
    codigoReferencia?: string;
    nome: string;
    codigoBarra?: string;
    marca: string;
    secao?: string;
    peso: number;
    preco: number;
    precoDeCusto: number;
    link?: string;
    descricaoDetalhada?: string;
}

import { apiFetch } from './api';

const API_URL = 'https://api.gbcode.com.br';

export const ProductService = {
    getAll: async (): Promise<ApiResponse<Product[]>> => {
        const response = await apiFetch(`${API_URL}/api/Produto/BuscarTodos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            if (response.status === 400 || response.status === 404) {
                return { sucesso: true, mensagem: 'Sem produtos', dados: [] };
            }
            throw new Error('Erro ao buscar produtos');
        }
        return response.json();
    },

    getById: async (id: number): Promise<ApiResponse<Product>> => {
        const response = await apiFetch(`${API_URL}/api/Produto/BuscarPorId/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar produto');
        }
        return response.json();
    },

    create: async (product: CreateProductDTO): Promise<ApiResponse<Product>> => {
        const response = await apiFetch(`${API_URL}/api/Produto/Criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
        });
        if (!response.ok) {
            throw new Error('Erro ao criar produto');
        }
        return response.json();
    },

    update: async (product: UpdateProductDTO): Promise<ApiResponse<Product>> => {
        const response = await apiFetch(`${API_URL}/api/Produto/Atualizar/${product.produtoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
        });
        if (!response.ok) {
            throw new Error('Erro ao atualizar produto');
        }
        return response.json();
    },

    delete: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/Produto/Deletar/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao excluir produto');
        }
        return response.json();
    },
};
