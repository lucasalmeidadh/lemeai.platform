import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface DadosGeraisEmpresa {
  nomeEmpresa: string;
  ramoAtividade: string;
  cnpj: string;
  pathLogo: string;
}

export interface AtualizarDadosGeraisDTO {
  nomeEmpresa: string;
  ramoAtividade: string;
  cnpj: string;
}

export interface DiasUteis {
  segunda: boolean;
  terca: boolean;
  quarta: boolean;
  quinta: boolean;
  sexta: boolean;
  sabado: boolean;
  domingo: boolean;
}

export const getMidiaUrl = (path: string): string => `${API_URL}/api/Media/${path}`;

export const DEFAULT_DIAS_UTEIS: DiasUteis = {
  segunda: true,
  terca: true,
  quarta: true,
  quinta: true,
  sexta: true,
  sabado: false,
  domingo: false,
};

const GerenciarEmpresaService = {
  getDadosGerais: async (): Promise<DadosGeraisEmpresa> => {
    const res = await apiFetch(`${API_URL}/api/gerenciarempresa/DadosGerais`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  atualizarDadosGerais: async (dados: AtualizarDadosGeraisDTO): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/gerenciarempresa/AtualizarDadosGerais`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },

  getDiasUteis: async (): Promise<DiasUteis> => {
    const res = await apiFetch(`${API_URL}/api/gerenciarempresa/DiasUteis`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  updateDiasUteis: async (dias: DiasUteis): Promise<DiasUteis> => {
    const res = await apiFetch(`${API_URL}/api/gerenciarempresa/DiasUteis`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dias),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  updateLogo: async (arquivo: File): Promise<{ caminhoRelativo: string }> => {
    const formData = new FormData();
    formData.append('logo', arquivo);
    const res = await apiFetch(`${API_URL}/api/gerenciarempresa/Logo`, {
      method: 'PUT',
      body: formData,
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  getLandingPageConfig: async (): Promise<any> => {
    const res = await apiFetch(`${API_URL}/api/empresa/landing-page-config`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  updateLandingPageConfig: async (dados: any): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/empresa/landing-page-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
  },

  updateLandingPageLogo: async (arquivo: File): Promise<{ caminhoRelativo: string }> => {
    const formData = new FormData();
    formData.append('logo', arquivo);
    const res = await apiFetch(`${API_URL}/api/empresa/landing-page-config/logo`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  generateLandingPageToken: async (): Promise<any> => {
    const res = await apiFetch(`${API_URL}/api/empresa/landing-page-config/generate-token`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },
};

export default GerenciarEmpresaService;
