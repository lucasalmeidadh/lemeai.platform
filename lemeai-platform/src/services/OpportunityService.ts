const apiUrl = import.meta.env.VITE_API_URL;

export interface DetalheConversa {
    // Define properties if known, otherwise empty for now as in the sample
    [key: string]: any;
}

export interface Opportunity {
    idConversa: number;
    idContato: number;
    nomeContato: string;
    numeroWhatsapp: string;
    dataConversaCriada: string;
    idStauts: number; // Keeping the typo as per API response
    descricaoStatus: string;
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
            const response = await fetch(`${apiUrl}/api/OportunidadeVenda/BuscarTodas`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
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
    }
};
