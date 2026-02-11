export interface Detail {
    id: number;
    conversationId: number;
    userId: number;
    content: string;
    createdAt: string;
    conversation: any | null; // Keep flexible as per JSON, but likely won't be used in UI for now
    usuario: any | null;      // Keep flexible as per JSON
}

export interface AddDetailPayload {
    idConversa: number;
    descricao: string;
    statusNegociacaoId: number;
    valor: number;
}
