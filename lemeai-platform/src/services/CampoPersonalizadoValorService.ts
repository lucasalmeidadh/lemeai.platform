import { apiFetch } from './api';
import type { CampoPersonalizado } from './CampoPersonalizadoService';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface CampoPersonalizadoValor extends CampoPersonalizado {
  valor: string | null;
}

export interface PreencherValorItem {
  campoPersonalizadoId: number;
  valor: string | null;
}

const CampoPersonalizadoValorService = {
  buscarPorConversa: async (conversaId: number): Promise<CampoPersonalizadoValor[]> => {
    const res = await apiFetch(`${API_URL}/api/campopersonalizadovalor/BuscarPorConversa/${conversaId}`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados ?? [];
  },

  preencherValores: async (conversaId: number, valores: PreencherValorItem[]): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/campopersonalizadovalor/PreencherValores/${conversaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valores }),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },
};

export default CampoPersonalizadoValorService;
