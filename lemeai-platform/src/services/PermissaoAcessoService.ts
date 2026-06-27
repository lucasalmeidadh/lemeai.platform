import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface Permissao {
  idPermissao: number;
  nomePermissao: string;
  nomeTela: string;
}

const PermissaoAcessoService = {
  buscarCatalogo: async (): Promise<Permissao[]> => {
    const res = await apiFetch(`${API_URL}/api/PermissaoAcesso/TiposPermissoes`);
    if (res.status === 204) return [];
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados ?? [];
  },

  buscarPermissoesPorTipoUsuario: async (tipoUsuarioId: number): Promise<number[]> => {
    const res = await apiFetch(`${API_URL}/api/PermissaoAcesso/PermissoesPorTipoUsuario/${tipoUsuarioId}`);
    if (res.status === 204) return [];
    const data = await res.json();
    if (!data.sucesso || !data.dados?.permissoes) return [];
    return data.dados.permissoes.map((p: { idPermissao: number }) => p.idPermissao);
  },

  salvarPermissoesPorTipoUsuario: async (tipoUsuarioId: number, permissaoIds: number[]): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/PermissaoAcesso/PermissoesPorTipoUsuario`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoUsuario: tipoUsuarioId,
        permissoes: permissaoIds.map(id => ({ idPermissao: id })),
      }),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },
};

export default PermissaoAcessoService;
