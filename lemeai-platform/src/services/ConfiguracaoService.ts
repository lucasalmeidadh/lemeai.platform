import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface DiasUteis {
  segunda: boolean;
  terca: boolean;
  quarta: boolean;
  quinta: boolean;
  sexta: boolean;
  sabado: boolean;
  domingo: boolean;
}

export const DEFAULT_DIAS_UTEIS: DiasUteis = {
  segunda: true,
  terca: true,
  quarta: true,
  quinta: true,
  sexta: true,
  sabado: false,
  domingo: false,
};

const ConfiguracaoService = {
  getDiasUteis: async (): Promise<DiasUteis> => {
    const res = await apiFetch(`${API_URL}/api/configuracao/DiasUteis`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  updateDiasUteis: async (dias: DiasUteis): Promise<DiasUteis> => {
    const res = await apiFetch(`${API_URL}/api/configuracao/DiasUteis`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dias),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },
};

export default ConfiguracaoService;
