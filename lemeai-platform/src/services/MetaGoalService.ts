import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface MetaGoal {
  id: number;
  tipoAlvo: 'user' | 'team';
  alvoId: number;
  alvoNome: string;
  tipo: 'value' | 'quantity' | 'calls';
  valorAlvo: number;
  mes: string;
}

export interface MetaGoalDto {
  tipoAlvo: 'user' | 'team';
  alvoId: number;
  tipo: 'value' | 'quantity' | 'calls';
  valorAlvo: number;
  mes: string;
}

export interface ReplicarMetaDto {
  mesOrigem: string;
  mesDestino: string;
}

export interface ReplicarMetaResult {
  copiadas: number;
  ignoradas: number;
}

const MetaGoalService = {
  buscarTodas: async (mes?: string, tipoAlvo?: 'user' | 'team'): Promise<MetaGoal[]> => {
    const params = new URLSearchParams();
    if (mes) params.set('mes', mes);
    if (tipoAlvo) params.set('tipoAlvo', tipoAlvo);
    const qs = params.toString() ? `?${params}` : '';
    const res = await apiFetch(`${API_URL}/api/meta/BuscarTodas${qs}`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  criar: async (dto: MetaGoalDto): Promise<MetaGoal> => {
    const res = await apiFetch(`${API_URL}/api/meta/Criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  atualizar: async (id: number, dto: MetaGoalDto): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/meta/Atualizar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },

  excluir: async (id: number): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/meta/Excluir/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },

  replicar: async (dto: ReplicarMetaDto): Promise<ReplicarMetaResult> => {
    const res = await apiFetch(`${API_URL}/api/meta/Replicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },
};

export default MetaGoalService;
