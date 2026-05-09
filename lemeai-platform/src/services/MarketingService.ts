import { apiFetch } from './api';

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';
export type TemplateComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
export type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface TemplateComponent {
    type: TemplateComponentType;
    format?: HeaderFormat;
    text?: string;
    buttons?: Array<{
        type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
        text: string;
        url?: string;
        phone_number?: string;
    }>;
}

export interface WhatsAppTemplate {
    id: string;
    name: string;
    category: TemplateCategory;
    status: TemplateStatus;
    language: string;
    components: TemplateComponent[];
    rejected_reason?: string;
    last_updated: string;
}

export interface Campaign {
    id: string;
    name: string;
    status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
    target_audience: string;
    template_id: string;
    scheduled_at?: string;
    sent_at?: string;
    metrics: {
        total: number;
        delivered: number;
        read: number;
        failed: number;
    };
}

export const MarketingService = {
    mockTemplates: [
        {
            id: '1',
            name: 'boas_vindas_vendas',
            category: 'MARKETING' as TemplateCategory,
            status: 'APPROVED' as TemplateStatus,
            language: 'pt_BR',
            components: [
                { type: 'HEADER' as TemplateComponentType, format: 'TEXT' as HeaderFormat, text: 'Bem-vindo!' },
                { type: 'BODY' as TemplateComponentType, text: 'Olá {{1}}! Identificamos seu interesse em nossa plataforma.' },
                { type: 'FOOTER' as TemplateComponentType, text: 'Equipe LemeAI' }
            ],
            last_updated: '2024-05-01T10:00:00Z'
        },
        {
            id: '2',
            name: 'lembrete_reuniao_v2',
            category: 'UTILITY' as TemplateCategory,
            status: 'APPROVED' as TemplateStatus,
            language: 'pt_BR',
            components: [
                { type: 'BODY' as TemplateComponentType, text: 'Oi {{1}}, passando para lembrar da nossa reunião hoje às {{2}}.' }
            ],
            last_updated: '2024-05-02T14:30:00Z'
        },
        {
            id: '3',
            name: 'promocao_maio',
            category: 'MARKETING' as TemplateCategory,
            status: 'PENDING' as TemplateStatus,
            language: 'pt_BR',
            components: [
                { type: 'HEADER' as TemplateComponentType, format: 'IMAGE' as HeaderFormat },
                { type: 'BODY' as TemplateComponentType, text: 'Aproveite 20% de desconto usando o cupom {{1}}.' }
            ],
            last_updated: '2024-05-06T18:00:00Z'
        }
    ],

    async getTemplates(): Promise<WhatsAppTemplate[]> {
        return new Promise(resolve => setTimeout(() => resolve(MarketingService.mockTemplates), 500));
    },

    async createTemplate(template: Omit<WhatsAppTemplate, 'id' | 'status' | 'last_updated'>): Promise<WhatsAppTemplate> {
        const newTemplate: WhatsAppTemplate = {
            ...template,
            id: Math.random().toString(36).substr(2, 9),
            status: 'PENDING',
            last_updated: new Date().toISOString()
        };
        MarketingService.mockTemplates.push(newTemplate);
        return newTemplate;
    },

    async getCampaigns(): Promise<Campaign[]> {
        return [];
    },

    async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
        return {} as Campaign;
    }
};
