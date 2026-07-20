export interface IARule {
    id: number;
    descricaoRegra: string;
    ordem?: number;
}

export interface IAFaq {
    id: number;
    pergunta: string;
    resposta: string;
    ordem?: number;
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export interface CreateIARuleDTO {
    descricaoRegra: string;
    ordem?: number;
}

export interface UpdateIARuleDTO {
    id: number;
    descricaoRegra: string;
    ordem?: number;
}

export interface CreateIAFaqDTO {
    pergunta: string;
    resposta: string;
    ordem?: number;
}

export interface UpdateIAFaqDTO {
    id: number;
    pergunta: string;
    resposta: string;
    ordem?: number;
}

// TomVozEnum — tooltip reproduz literalmente o texto de PromptBuilderService.DescreverTomVoz
export const TOM_VOZ_OPTIONS = [
    { value: 1, label: 'Profissional', tooltip: 'Tom de voz: profissional e formal.' },
    { value: 2, label: 'Descontraído', tooltip: 'Tom de voz: descontraído e casual.' },
    { value: 3, label: 'Focado em Conversão', tooltip: 'Tom de voz: focado em conversão, direto e persuasivo.' },
    { value: 4, label: 'Empático', tooltip: 'Tom de voz: empático e acolhedor.' },
] as const;

// ObjetivoPrincipalEnum — tooltip reproduz literalmente o texto de PromptBuilderService.DescreverObjetivoPrincipal
export const OBJETIVO_PRINCIPAL_OPTIONS = [
    { value: 1, label: 'Qualificar leads', tooltip: 'Objetivo principal: qualificar leads antes de encaminhar para um vendedor.' },
    { value: 2, label: 'Suporte técnico', tooltip: 'Objetivo principal: prestar suporte técnico aos clientes.' },
    { value: 3, label: 'Vender produtos', tooltip: 'Objetivo principal: vender produtos/serviços diretamente na conversa.' },
    { value: 4, label: 'Tirar dúvidas', tooltip: 'Objetivo principal: tirar dúvidas gerais sobre a empresa.' },
] as const;

export interface ConfigAgente {
    id: number;
    nomeAgente: string;
    tomVoz: number;
    objetivoPrincipal: number;
    sobreEmpresa: string;
    instrucoesAdicionais: string | null;
    condicoesTransbordo: string;
    botAtivo: boolean;
    regras: IARule[];
    faqs: IAFaq[];
}

export interface CreateConfigAgenteDTO {
    nomeAgente: string;
    tomVoz: number;
    objetivoPrincipal: number;
    sobreEmpresa: string;
    instrucoesAdicionais: string | null;
    condicoesTransbordo: string;
    regras?: CreateIARuleDTO[];
    faqs?: CreateIAFaqDTO[];
}

export interface UpdateConfigAgenteDTO {
    id: number;
    nomeAgente: string;
    tomVoz: number;
    objetivoPrincipal: number;
    sobreEmpresa: string;
    instrucoesAdicionais: string | null;
    condicoesTransbordo: string;
}

import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export const RegrasIAService = {
    getById: async (id: number): Promise<ApiResponse<IARule>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/BuscarRegraPorId/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar regra');
        }
        return response.json();
    },

    create: async (rule: CreateIARuleDTO): Promise<ApiResponse<IARule>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/CriarRegra`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rule),
        });
        if (!response.ok) {
            throw new Error('Erro ao criar regra');
        }
        return response.json();
    },

    update: async (rule: UpdateIARuleDTO): Promise<ApiResponse<IARule>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/AtualizarRegra/${rule.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rule),
        });
        if (!response.ok) {
            throw new Error('Erro ao atualizar regra');
        }
        return response.json();
    },

    delete: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/ExcluirRegra/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao excluir regra');
        }
        return response.json();
    },

    getFaqById: async (id: number): Promise<ApiResponse<IAFaq>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/BuscarFaqPorId/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar FAQ');
        }
        return response.json();
    },

    createFaq: async (faq: CreateIAFaqDTO): Promise<ApiResponse<IAFaq>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/CriarFaq`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(faq),
        });
        if (!response.ok) {
            throw new Error('Erro ao criar FAQ');
        }
        return response.json();
    },

    updateFaq: async (faq: UpdateIAFaqDTO): Promise<ApiResponse<IAFaq>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/AtualizarFaq/${faq.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(faq),
        });
        if (!response.ok) {
            throw new Error('Erro ao atualizar FAQ');
        }
        return response.json();
    },

    deleteFaq: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/ExcluirFaq/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao excluir FAQ');
        }
        return response.json();
    },

    getConfigAgente: async (): Promise<ApiResponse<ConfigAgente | null>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/BuscarConfigAgente`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar configuração do agente');
        }
        return response.json();
    },

    createConfigAgente: async (config: CreateConfigAgenteDTO): Promise<ApiResponse<null>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/CriarConfigAgente`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });
        if (!response.ok) {
            throw new Error('Erro ao criar configuração do agente');
        }
        return response.json();
    },

    updateConfigAgente: async (config: UpdateConfigAgenteDTO): Promise<ApiResponse<null>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/AtualizarConfigAgente`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar configuração do agente');
        }

        return response.json();
    },

    deleteConfigAgente: async (id: number): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/ExcluirConfigAgente/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao excluir configuração do agente');
        }
        return response.json();
    },

    toggleBot: async (botAtivo: boolean): Promise<ApiResponse<null>> => {
        const response = await apiFetch(`${API_URL}/api/RegrasIA/AlternarBot`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ botAtivo }),
        });
        if (!response.ok) {
            throw new Error('Erro ao alterar estado do bot');
        }
        return response.json();
    },
};
