import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface ConversaProduto {
    oportunidadeProdutoId: number;
    conversaId: number;
    produtoId: number;
    codigo: string | null;
    nome: string | null;
    marca: string | null;
    quantidade: number;
    precoUnitarioNegociado: number;
    precoTotal: number;
}

export interface VincularProdutoDTO {
    produtoId: number;
    quantidade: number;
    precoUnitarioNegociado: number;
}

export interface AtualizarProdutoDTO {
    quantidade: number;
    precoUnitarioNegociado: number;
}

interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export const ConversaProdutoService = {
    listar: async (conversaId: number): Promise<ApiResponse<ConversaProduto[]>> => {
        const res = await apiFetch(`${API_URL}/api/Chat/Conversas/${conversaId}/Produtos`);
        if (!res.ok) {
            if (res.status === 400 || res.status === 404) {
                return { sucesso: true, mensagem: '', dados: [] };
            }
            throw new Error('Erro ao buscar produtos da conversa');
        }
        return res.json();
    },

    vincular: async (conversaId: number, dto: VincularProdutoDTO): Promise<ApiResponse<ConversaProduto>> => {
        const res = await apiFetch(`${API_URL}/api/Chat/Conversas/${conversaId}/Produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        const data = await res.json();
        if (!res.ok || !data.sucesso) throw new Error(data.mensagem || 'Erro ao vincular produto');
        return data;
    },

    atualizar: async (conversaId: number, oportunidadeProdutoId: number, dto: AtualizarProdutoDTO): Promise<ApiResponse<ConversaProduto>> => {
        const res = await apiFetch(`${API_URL}/api/Chat/Conversas/${conversaId}/Produtos/${oportunidadeProdutoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        const data = await res.json();
        if (!res.ok || !data.sucesso) throw new Error(data.mensagem || 'Erro ao atualizar produto');
        return data;
    },

    remover: async (conversaId: number, oportunidadeProdutoId: number): Promise<ApiResponse<null>> => {
        const res = await apiFetch(`${API_URL}/api/Chat/Conversas/${conversaId}/Produtos/${oportunidadeProdutoId}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok || !data.sucesso) throw new Error(data.mensagem || 'Erro ao remover produto');
        return data;
    },
};
