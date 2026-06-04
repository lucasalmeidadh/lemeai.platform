import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface FaturamentoMensal {
  mes: string;
  mesLabel: string;
  totalFaturado: number;
}

export interface PerformanceIndividual {
  usuarioId: number;
  usuarioNome: string;
  totalFaturado: number;
  totalLigacoes: number;
  metaFaturamento: number;
  metaLigacoes: number;
  percentualFaturamento: number;
  percentualLigacoes: number;
}

export interface PerformanceEquipe {
  equipeId: number;
  equipeNome: string;
  totalFaturado: number;
  totalLigacoes: number;
  metaFaturamento: number;
  percentualAtingido: number;
}

export interface PerformanceEquipeMembro {
  usuarioId: number;
  usuarioNome: string;
  totalFaturado: number;
  metaFaturamento: number;
  percentualFaturamento: number;
  totalLigacoes: number;
}

export interface PerformanceEquipeDetalhes {
  equipeId: number;
  equipeNome: string;
  membros: PerformanceEquipeMembro[];
}

export interface ProjecaoFechamento {
  diasUteisTotais: number;
  diasUteisDecorridos: number;
  mediaDiaria: number;
  projecaoFechamento: number;
}

const RelatorioService = {
  getFaturamentoMensal: async (meses?: number): Promise<FaturamentoMensal[]> => {
    const qs = meses ? `?meses=${meses}` : '';
    const res = await apiFetch(`${API_URL}/api/relatorio/FaturamentoMensal${qs}`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  getPerformanceIndividual: async (mes: string): Promise<PerformanceIndividual[]> => {
    const res = await apiFetch(`${API_URL}/api/relatorio/PerformanceIndividual?mes=${mes}`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  getPerformanceEquipes: async (mes: string): Promise<PerformanceEquipe[]> => {
    const res = await apiFetch(`${API_URL}/api/relatorio/PerformanceEquipes?mes=${mes}`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  getPerformanceEquipeMembros: async (equipeId: number, mes: string): Promise<PerformanceEquipeDetalhes> => {
    const res = await apiFetch(`${API_URL}/api/relatorio/PerformanceEquipeMembros?equipeId=${equipeId}&mes=${mes}`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  getProjecaoFechamento: async (mes: string, usuarioId: number): Promise<ProjecaoFechamento> => {
    const res = await apiFetch(`${API_URL}/api/relatorio/ProjecaoFechamento?mes=${mes}&usuarioId=${usuarioId}`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },
};

export default RelatorioService;
