import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface Campaign {
    campanhaId: number;
    campanhaNome: string;
    campanhaTemplateNome: string;
    campanhaTemplateIdioma: string;
    campanhaCategoria: CampanhaCategoria;
    campanhaStatus: CampanhaStatus;
    campanhaAgendadaEm: string | null;
    campanhaRedirecionarRespostaParaIA: boolean;
    campanhaCreatedat: string;
    campanhaUpdatedat: string;
}

export interface CampaignMetrics extends Campaign {
    totalDisparado: number;
    totalComInteracao: number;
    percentualInteracao: number;
}

export type CampanhaStatus = 'Rascunho' | 'Enviando' | 'Finalizada';
export type CampanhaCategoria = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

export interface CreateCampaignDTO {
    nome: string;
    templateNome: string;
    templateIdioma: string;
    categoria: CampanhaCategoria;
    agendadaEm?: string;
    redirecionarRespostaParaIA: boolean;
}

export interface UpdateCampaignDTO {
    campanhaId: number;
    nome: string;
    templateNome: string;
    templateIdioma: string;
    categoria: CampanhaCategoria;
    status: CampanhaStatus;
    agendadaEm?: string;
    redirecionarRespostaParaIA: boolean;
}

export interface Destinatario {
    destinatarioId: number;
    numero: string | null;
    bsuid: string | null;
    variaveis: string[] | null;
}

export interface DestinatarioInput {
    numero?: string;
    bsuid?: string;
    variaveis?: string[];
}

export interface ParametroTemplate {
    tipo: 'text' | 'image' | 'video' | 'document' | 'coupon_code';
    texto?: string;
    codigoCupom?: string;
    imagem?: { id?: string; link?: string };
    video?: { id?: string; link?: string };
    documento?: { id?: string; link?: string };
}

export interface ComponenteTemplate {
    tipo: 'HEADER' | 'BODY' | 'BUTTON';
    subTipo?: 'COPY_CODE' | 'URL' | 'QUICK_REPLY';
    indicesBotao?: number;
    parametros?: ParametroTemplate[];
}

export interface DispararDTO {
    destinatarios?: DestinatarioInput[];
    componentes?: ComponenteTemplate[];
}

export interface DispararResult {
    totalDestinatarios: number;
    totalEnviados: number;
    totalFalhas: number;
}

export interface Disparo {
    disparoId: number;
    contatoId: number | null;
    conversaId: number | null;
    disparoNumero: string;
    disparoStatus: 'enviado' | 'entregue' | 'lido' | 'falha';
    teveInteracao: boolean;
    disparoEnviadoEm: string;
    disparoEntregueEm: string | null;
    disparoLidoEm: string | null;
}

export interface ConversasResult {
    itens: Disparo[];
    total: number;
    pagina: number;
    porPagina: number;
}

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export const CampaignService = {
    getAll: async (): Promise<ApiResponse<Campaign[]>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/BuscarTodos`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return res.json();
        return res.json();
    },

    getMetrics: async (): Promise<ApiResponse<CampaignMetrics[]>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/ResumoMetricas`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },

    create: async (dto: CreateCampaignDTO): Promise<ApiResponse<Campaign>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/Criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        return res.json();
    },

    update: async (dto: UpdateCampaignDTO): Promise<ApiResponse<null>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/Atualizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        return res.json();
    },

    remove: async (id: number): Promise<ApiResponse<null>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/Remover/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },

    getDestinatarios: async (campanhaId: number): Promise<ApiResponse<Destinatario[]>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/${campanhaId}/destinatarios`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },

    addDestinatarios: async (campanhaId: number, destinatarios: DestinatarioInput[]): Promise<ApiResponse<{ total: number }>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/${campanhaId}/destinatarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinatarios }),
        });
        return res.json();
    },

    removeDestinatario: async (campanhaId: number, destinatarioId: number): Promise<ApiResponse<null>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/${campanhaId}/destinatarios/${destinatarioId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },

    disparar: async (id: number, dto: DispararDTO): Promise<ApiResponse<DispararResult>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/${id}/disparar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto),
        });
        return res.json();
    },

    getConversas: async (campanhaId: number, pagina = 1, porPagina = 20): Promise<ApiResponse<ConversasResult>> => {
        const res = await apiFetch(`${API_URL}/api/campanha/${campanhaId}/conversas?pagina=${pagina}&porPagina=${porPagina}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },
};
