import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface PlanoBackend {
  planoId: number;
  planoNome: string;
  planoDescricao: string;
  planoPreco: number;
  planoCiclo: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'ANNUALLY';
  planoAtivo: boolean;
  abacateProductId: string | null;
  abacateStatus: string;
  planoCreatedat: string;
}

export interface AssinaturaBackend {
  assinaturaId: number;
  planoId: number;
  abacateSubscriptionId: string;
  assinaturaStatus: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
  assinaturaCiclo: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'ANNUALLY';
  assinaturaValor: number;
  assinaturaCheckoutUrl: string | null;
  assinaturaInicioEm: string | null;
  assinaturaExpiraEm: string | null;
}

export interface ApiResponse<T> {
  sucesso: boolean;
  mensagem: string;
  dados: T;
}

export const billingService = {
  // Planos (User & Admin)
  buscarTodosPlanos: async (): Promise<ApiResponse<PlanoBackend[]>> => {
    const response = await apiFetch(`${API_URL}/api/plano/BuscarTodos`);
    if (!response.ok) throw new Error('Erro ao carregar planos');
    return response.json();
  },

  buscarPlanoPorId: async (id: number): Promise<ApiResponse<PlanoBackend>> => {
    const response = await apiFetch(`${API_URL}/api/plano/BuscarPorId/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar plano');
    return response.json();
  },

  criarPlano: async (data: { nome: string; descricao: string; preco: number; ciclo: string }): Promise<ApiResponse<PlanoBackend>> => {
    const response = await apiFetch(`${API_URL}/api/plano/Criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar plano');
    return response.json();
  },

  atualizarPlano: async (data: { planoId: number; nome: string; descricao: string; preco: number; ativo: boolean }): Promise<ApiResponse<any>> => {
    const response = await apiFetch(`${API_URL}/api/plano/Atualizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar plano');
    return response.json();
  },

  removerPlano: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiFetch(`${API_URL}/api/plano/Remover/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao remover plano');
    return response.json();
  },

  // Assinaturas (User)
  buscarAssinaturaAtiva: async (): Promise<ApiResponse<AssinaturaBackend | null>> => {
    const response = await apiFetch(`${API_URL}/api/assinatura/BuscarAssinatura`);
    if (response.status === 400 || response.status === 404) {
      // Retorna a resposta mesmo que seja erro 400 controlada de "nenhuma assinatura encontrada"
      const data = await response.json().catch(() => null);
      if (data && data.sucesso === false) {
        return data;
      }
    }
    if (!response.ok) throw new Error('Erro ao carregar assinatura');
    return response.json();
  },

  criarCheckout: async (planoId: number): Promise<ApiResponse<AssinaturaBackend>> => {
    const response = await apiFetch(`${API_URL}/api/assinatura/CriarCheckout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planoId }),
    });
    if (!response.ok) throw new Error('Erro ao iniciar a contratação do plano');
    return response.json();
  },

  trocarPlano: async (novoPlanoId: number): Promise<ApiResponse<any>> => {
    const response = await apiFetch(`${API_URL}/api/assinatura/TrocarPlano`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novoPlanoId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.mensagem || 'Erro ao trocar plano');
    }
    return response.json();
  },

  cancelarAssinatura: async (): Promise<ApiResponse<any>> => {
    const response = await apiFetch(`${API_URL}/api/assinatura/Cancelar`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao cancelar assinatura');
    return response.json();
  },
};
