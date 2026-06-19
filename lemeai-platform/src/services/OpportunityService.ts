import { apiFetch } from './api';

const apiUrl = import.meta.env.VITE_API_URL;

export interface DetalheConversa {
    idDetalhe: number;
    idConversa: number;
    descricaoDetalhe: string;
    dataDetalheCriado: string;
    idUsuarioCriador: number;
    nomeUsuarioCriador: string;
}

export interface Opportunity {
    idConversa: number;
    idContato: number;
    nomeContato: string;
    numeroWhatsapp: string;
    dataConversaCriada: string;
    dataFechamentoVenda: string | null;
    idStauts: number;
    descricaoStatus: string;
    nomeUsuarioResponsavel: string;
    idUsuarioResponsavel?: number;
    valor: number;
    detalhesConversa: DetalheConversa[];
    campanha?: boolean;
    idCampanha?: number | null;
    nomeCampanha?: string;
    tipoLeadId?: number;
}

export interface OpportunityResponse {
    sucesso: boolean;
    mensagem: string;
    dados: Opportunity[];
}

export interface CreateOpportunityCampoPersonalizado {
    campoPersonalizadoId: number;
    valor: string | null;
}

export interface CreateOpportunityPayload {
    contatoNovo: boolean;
    contatoId: number | null;
    contato: {
        nome: string;
        telefone?: string;
        email?: string;
    } | null;
    usuarioResponsavelId: number | null;
    tipoLeadId: number | null;
    valor: number | null;
    observacao: string | null;
    camposPersonalizados?: CreateOpportunityCampoPersonalizado[] | null;
}

export const OpportunityService = {
    createOpportunity: async (payload: CreateOpportunityPayload): Promise<{ sucesso: boolean; mensagem: string; dados: number | null }> => {
        const response = await apiFetch(`${apiUrl}/api/OportunidadeVenda/Criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    getAllOpportunities: async (): Promise<Opportunity[]> => {
        try {
            const response = await apiFetch(`${apiUrl}/api/OportunidadeVenda/BuscarTodas`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 400) {
                    return [];
                }
                throw new Error('Erro ao buscar oportunidades');
            }

            const data: OpportunityResponse = await response.json();

            if (data.sucesso) {
                return data.dados;
            } else {
                console.error(data.mensagem);
                return [];
            }
        } catch (error) {
            console.error('Erro no servico de oportunidades:', error);
            throw error;
        }
    },

    addDetails: async (details: { idConversa: number, descricao: string, statusNegociacaoId: number, valor: number }): Promise<{ sucesso: boolean, mensagem?: string }> => {
        try {
            const response = await apiFetch(`${apiUrl}/api/Detalhes/Adicionar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(details)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensagem || 'Erro ao adicionar detalhes');
            }

            return { sucesso: true };
        } catch (error: any) {
            console.error('Erro ao adicionar detalhes:', error);
            return { sucesso: false, mensagem: error.message };
        }
    }
};
