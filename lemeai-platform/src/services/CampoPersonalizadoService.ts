import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export const TipoCampoPersonalizado = {
  Texto: 1,
  Numero: 2,
  Data: 3,
  Booleano: 4,
  Selecao: 5,
} as const;

export type TipoCampoPersonalizado = typeof TipoCampoPersonalizado[keyof typeof TipoCampoPersonalizado];

export interface CampoPersonalizado {
  campoPersonalizadoId: number;
  nome: string;
  chave: string;
  tipo: TipoCampoPersonalizado;
  opcoes: string[] | null;
  obrigatorio: boolean;
  ordem: number;
}

export interface CampoPersonalizadoDto {
  campoPersonalizadoId?: number;
  nome: string;
  tipo: TipoCampoPersonalizado;
  opcoes: string[] | null;
  obrigatorio: boolean;
  ordem: number;
}

const CampoPersonalizadoService = {
  buscarTodos: async (): Promise<CampoPersonalizado[]> => {
    const res = await apiFetch(`${API_URL}/api/campopersonalizado/BuscarTodos`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados ?? [];
  },

  buscarPorId: async (id: number): Promise<CampoPersonalizado> => {
    const res = await apiFetch(`${API_URL}/api/campopersonalizado/BuscarPorId/${id}`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  criar: async (dto: CampoPersonalizadoDto): Promise<CampoPersonalizado> => {
    const res = await apiFetch(`${API_URL}/api/campopersonalizado/Criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  atualizar: async (dto: CampoPersonalizadoDto): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/campopersonalizado/Atualizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },

  remover: async (id: number): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/campopersonalizado/Remover/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },
};

export default CampoPersonalizadoService;
