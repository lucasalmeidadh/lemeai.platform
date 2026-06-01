import { apiFetch } from './api';

const apiUrl = import.meta.env.VITE_API_URL;

export interface TipoTarefa {
    tipoTarefaId: number;
    nome: string;
    dataCriacao: string;
}

export interface Tarefa {
    tarefaId: number;
    usuarioCriacaoId: number;
    conversaId: number | null;
    descricao: string;
    estaConcluida: boolean;
    tipoTarefaId: number;
    dataRetorno: string | null;
    dataCriacao: string;
}

export interface CreateTarefaDTO {
    descricao: string;
    conversaId: number | null;
    tipoTarefaId: number;
    dataRetorno: string | null;
}

export interface UpdateTarefaDTO {
    tarefaId: number;
    descricao?: string;
    estaConcluida?: boolean;
    tipoTarefaId?: number;
    dataRetorno?: string | null;
}

interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export const TipoTarefaService = {
    async getAll(): Promise<TipoTarefa[]> {
        const res = await apiFetch(`${apiUrl}/api/TipoTarefa/BuscarTodos`);
        const result: ApiResponse<TipoTarefa[]> = await res.json();
        return result.sucesso ? result.dados : [];
    },

    async criar(nome: string): Promise<ApiResponse<TipoTarefa>> {
        const res = await apiFetch(`${apiUrl}/api/TipoTarefa/Criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome }),
        });
        return res.json();
    },

    async atualizar(tipoTarefaId: number, nome: string): Promise<ApiResponse<null>> {
        const res = await apiFetch(`${apiUrl}/api/TipoTarefa/Atualizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipoTarefaId, nome }),
        });
        return res.json();
    },

    async remover(tipoTarefaId: number): Promise<ApiResponse<null>> {
        const res = await apiFetch(`${apiUrl}/api/TipoTarefa/Remover/${tipoTarefaId}`, {
            method: 'DELETE',
        });
        return res.json();
    },
};

export const TarefaService = {
    async getAll(): Promise<Tarefa[]> {
        const res = await apiFetch(`${apiUrl}/api/Tarefa/BuscarTodos`);
        const result: ApiResponse<Tarefa[]> = await res.json();
        return result.sucesso ? result.dados : [];
    },

    async getByConversa(conversaId: number): Promise<Tarefa[]> {
        const res = await apiFetch(`${apiUrl}/api/Tarefa/BuscarPorConversa/${conversaId}`);
        const result: ApiResponse<Tarefa[]> = await res.json();
        return result.sucesso ? result.dados : [];
    },

    async getById(tarefaId: number): Promise<ApiResponse<Tarefa>> {
        const res = await apiFetch(`${apiUrl}/api/Tarefa/BuscarPorId/${tarefaId}`);
        return res.json();
    },

    async criar(dto: CreateTarefaDTO): Promise<ApiResponse<Tarefa>> {
        const res = await apiFetch(`${apiUrl}/api/Tarefa/Criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        return res.json();
    },

    async atualizar(dto: UpdateTarefaDTO): Promise<ApiResponse<null>> {
        const res = await apiFetch(`${apiUrl}/api/Tarefa/Atualizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        return res.json();
    },

    async remover(tarefaId: number): Promise<ApiResponse<null>> {
        const res = await apiFetch(`${apiUrl}/api/Tarefa/Remover/${tarefaId}`, {
            method: 'DELETE',
        });
        return res.json();
    },
};
