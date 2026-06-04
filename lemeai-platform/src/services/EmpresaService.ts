import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = `${API_URL}/api/AdministrarEmpresas`;

export interface EmpresaUsuario {
    usuarioId: number;
    nome: string;
    email: string;
    tipoUsuarioId: number;
    ativo: boolean;
}

export interface Empresa {
    id: number;
    nome: string;
    cnpj: string;
    dataAssinaturaExpira: string;
    ativo?: boolean;
    usuarios?: EmpresaUsuario[];
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export interface CriarEmpresaDTO {
    nome: string;
    cnpj: string;
    dataAssinaturaExpira: string;
}

export interface AtualizarEmpresaDTO {
    id: number;
    nome: string;
    cnpj: string;
    dataAssinaturaExpira: string;
}

export interface CriarUsuarioEmpresaDTO {
    empresaId: number;
    nome: string;
    email: string;
    senha: string;
    tipoUsuarioId: number;
}

export interface AtualizarUsuarioEmpresaDTO {
    usuarioId: number;
    empresaId: number;
    nome: string;
    email: string;
    tipoUsuarioId: number;
    ativo: boolean;
}

export const EmpresaService = {
    buscarTodas: async (): Promise<ApiResponse<Empresa[]>> => {
        const response = await apiFetch(`${BASE}/BuscarTodasEmpresas`);
        if (response.status === 204) return { sucesso: true, mensagem: '', dados: [] };
        if (!response.ok) throw new Error('Erro ao buscar empresas');
        return response.json();
    },

    buscarPorId: async (empresaId: number): Promise<ApiResponse<Empresa>> => {
        const response = await apiFetch(`${BASE}/BuscarEmpresaPorId/${empresaId}`);
        if (!response.ok) throw new Error('Erro ao buscar empresa');
        return response.json();
    },

    criar: async (data: CriarEmpresaDTO): Promise<ApiResponse<Empresa>> => {
        const response = await apiFetch(`${BASE}/CriarEmpresa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erro ao criar empresa');
        return response.json();
    },

    atualizar: async (data: AtualizarEmpresaDTO): Promise<ApiResponse<Empresa>> => {
        const response = await apiFetch(`${BASE}/AtualizarEmpresa`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erro ao atualizar empresa');
        return response.json();
    },

    desativar: async (empresaId: number): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${BASE}/DesativarEmpresa/${empresaId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erro ao desativar empresa');
        return response.json();
    },

    criarUsuario: async (data: CriarUsuarioEmpresaDTO): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${BASE}/CriarUsuarioEmpresa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erro ao criar usuário da empresa');
        return response.json();
    },

    atualizarUsuario: async (data: AtualizarUsuarioEmpresaDTO): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${BASE}/AtualizarUsuarioEmpresa`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erro ao atualizar usuário da empresa');
        return response.json();
    },
};
