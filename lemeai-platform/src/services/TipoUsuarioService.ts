import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface TipoUsuario {
  id: number;
  nome: string;
  codigo: number | null;
  canReceiveLead: boolean;
}

export interface TipoUsuarioDto {
  nome: string;
  canReceiveLead: boolean;
}

const TipoUsuarioService = {
  buscarTodos: async (): Promise<TipoUsuario[]> => {
    const res = await apiFetch(`${API_URL}/api/TipoUsuario/BuscarTodos`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  criar: async (dto: TipoUsuarioDto): Promise<TipoUsuario> => {
    const res = await apiFetch(`${API_URL}/api/TipoUsuario/Criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  atualizar: async (id: number, dto: TipoUsuarioDto): Promise<TipoUsuario> => {
    const res = await apiFetch(`${API_URL}/api/TipoUsuario/Atualizar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  deletar: async (id: number): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/TipoUsuario/Deletar/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },
};

export default TipoUsuarioService;
