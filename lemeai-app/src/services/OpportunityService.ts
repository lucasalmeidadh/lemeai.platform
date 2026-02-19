import { apiFetch } from './api';

const apiUrl = 'https://api.gbcode.com.br';

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
    idStauts: number;
    descricaoStatus: string;
    nomeUsuarioResponsavel: string;
    valor: number;
    detalhesConversa: DetalheConversa[];
}

export interface OpportunityResponse {
    sucesso: boolean;
    mensagem: string;
    dados: Opportunity[];
}

export const OpportunityService = {
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
            console.error('Erro no serviço de oportunidades:', error);
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
