import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface EquipeMembro {
  id: number;
  nome: string;
}

export interface Equipe {
  id: number;
  nome: string;
  liderId: number;
  liderNome: string;
  membroIds: number[];
  membros: EquipeMembro[];
}

export interface EquipeDto {
  nome: string;
  liderId: number;
  membroIds: number[];
}

const EquipeService = {
  buscarTodas: async (): Promise<Equipe[]> => {
    const res = await apiFetch(`${API_URL}/api/equipe/BuscarTodas`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  criar: async (dto: EquipeDto): Promise<Equipe> => {
    const res = await apiFetch(`${API_URL}/api/equipe/Criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  atualizar: async (id: number, dto: EquipeDto): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/equipe/Atualizar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },

  excluir: async (id: number): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/equipe/Excluir/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },
};

export default EquipeService;
