import { apiFetch } from './api';

const apiUrl = import.meta.env.VITE_API_URL;

export interface StartTestSessionResponse {
    sessionId?: string;
    agentName?: string;
    mensagem?: string;
}

export interface SendTestMessageRequest {
    sessionId: string;
    message: string;
}

export interface ResetTestSessionRequest {
    sessionId: string;
}

export class AgentTesterService {
    /**
     * Inicia uma nova sessão de teste do agente.
     */
    static async startSession(): Promise<StartTestSessionResponse> {
        const response = await apiFetch(`${apiUrl}/api/AgentTester/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Falha ao iniciar sessão de teste do agente');
        }

        return response.json();
    }

    /**
     * Envia uma mensagem para o agente na sessão atual.
     */
    static async sendMessage(payload: SendTestMessageRequest): Promise<any> {
        const response = await apiFetch(`${apiUrl}/api/AgentTester/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('Falha ao enviar mensagem para o agente');
        }

        return response.json();
    }

    /**
     * Reseta a sessão atual do agente.
     */
    static async resetSession(payload: ResetTestSessionRequest): Promise<any> {
        const response = await apiFetch(`${apiUrl}/api/AgentTester/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('Falha ao resetar sessão do agente');
        }

        return response.json();
    }
}
