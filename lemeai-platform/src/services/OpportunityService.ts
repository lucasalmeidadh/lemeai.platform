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

// Mock data provided by user to fix the listing issue
const MOCK_OPPORTUNITIES: Opportunity[] = [
    {
        "idConversa": 10,
        "idContato": 13,
        "nomeContato": "Luiz Guilherme",
        "numeroWhatsapp": "554195548806",
        "dataConversaCriada": "2026-01-26T00:00:00Z",
        "idStauts": 6,
        "descricaoStatus": "Venda Perdida",
        "nomeUsuarioResponsavel": "Luiz Guilherme Barbieri",
        "valor": 20.1,
        "detalhesConversa": [
            {
                "idDetalhe": 0,
                "idConversa": 10,
                "descricaoDetalhe": "cliente quer bateria zetta",
                "dataDetalheCriado": "2026-01-13T16:01:25.662911Z",
                "idUsuarioCriador": 1,
                "nomeUsuarioCriador": "Luiz Guilherme Barbieri"
            },
            {
                "idDetalhe": 0,
                "idConversa": 10,
                "descricaoDetalhe": "Teste 123",
                "dataDetalheCriado": "2026-01-26T13:33:31.877994Z",
                "idUsuarioCriador": 2,
                "nomeUsuarioCriador": "Lucas Alexandre"
            }
        ]
    },
    {
        "idConversa": 11,
        "idContato": 15,
        "nomeContato": "Lucas Almeida",
        "numeroWhatsapp": "554198207192",
        "dataConversaCriada": "2026-01-27T15:53:52.324416Z",
        "idStauts": 6,
        "descricaoStatus": "Venda Perdida",
        "nomeUsuarioResponsavel": "Lucas Alexandre",
        "valor": 0,
        "detalhesConversa": []
    },
    {
        "idConversa": 12,
        "idContato": 12,
        "nomeContato": "Maria Gabriele",
        "numeroWhatsapp": "554197131605",
        "dataConversaCriada": "2026-01-27T16:21:48.002972Z",
        "idStauts": 6,
        "descricaoStatus": "Venda Perdida",
        "nomeUsuarioResponsavel": "Luiz Guilherme Barbieri",
        "valor": 0,
        "detalhesConversa": []
    },
    {
        "idConversa": 13,
        "idContato": 13,
        "nomeContato": "Luiz Guilherme",
        "numeroWhatsapp": "554195548806",
        "dataConversaCriada": "2026-01-30T21:30:35.925691Z",
        "idStauts": 6,
        "descricaoStatus": "Venda Perdida",
        "nomeUsuarioResponsavel": "Luiz Guilherme Barbieri",
        "valor": 0,
        "detalhesConversa": []
    },
    {
        "idConversa": 14,
        "idContato": 12,
        "nomeContato": "Maria Gabriele",
        "numeroWhatsapp": "554197131605",
        "dataConversaCriada": "2026-01-30T21:46:36.388493Z",
        "idStauts": 6,
        "descricaoStatus": "Venda Perdida",
        "nomeUsuarioResponsavel": "Luiz Guilherme Barbieri",
        "valor": 0,
        "detalhesConversa": []
    },
    {
        "idConversa": 15,
        "idContato": 15,
        "nomeContato": "Lucas Almeida",
        "numeroWhatsapp": "554198207192",
        "dataConversaCriada": "2026-02-02T23:38:55.904671Z",
        "idStauts": 2,
        "descricaoStatus": "Não Iniciado",
        "nomeUsuarioResponsavel": "Lucas Alexandre",
        "valor": 0,
        "detalhesConversa": []
    },
    {
        "idConversa": 16,
        "idContato": 13,
        "nomeContato": "Luiz Guilherme",
        "numeroWhatsapp": "554195548806",
        "dataConversaCriada": "2026-02-07T01:08:23.812533Z",
        "idStauts": 3,
        "descricaoStatus": "Venda Fechada",
        "nomeUsuarioResponsavel": "Luiz Guilherme Barbieri",
        "valor": 0,
        "detalhesConversa": []
    },
    {
        "idConversa": 17,
        "idContato": 12,
        "nomeContato": "Maria Gabriele",
        "numeroWhatsapp": "554197131605",
        "dataConversaCriada": "2026-02-09T17:22:06.020712Z",
        "idStauts": 1,
        "descricaoStatus": "Atendimento IA",
        "nomeUsuarioResponsavel": "IA",
        "valor": 0,
        "detalhesConversa": []
    }
];

export const OpportunityService = {
    getAllOpportunities: async (): Promise<Opportunity[]> => {
        // Return mock data immediately to solve the issue
        // return Promise.resolve(MOCK_OPPORTUNITIES);

        // Original logic kept for reference but disabled
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
