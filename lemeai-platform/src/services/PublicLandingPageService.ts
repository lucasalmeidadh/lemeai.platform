const API_URL = import.meta.env.VITE_API_URL || '';

export interface PublicPageDetails {
  branchName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  promoText: string | null;
  promoActive: boolean;
  configuredSegments: string[];
}

export interface RegisterContactDTO {
  nome: string;
  telefone: string;
  email?: string;
  segment?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface PromoResult {
  promoCode: string | null;
  promoText: string | null;
  promoActive: boolean;
}

const PublicLandingPageService = {
  getPageDetails: async (token: string): Promise<PublicPageDetails> => {
    const res = await fetch(`${API_URL}/api/public/landing-page/${token}`);
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  },

  registerContact: async (token: string, payload: RegisterContactDTO): Promise<PromoResult> => {
    const res = await fetch(`${API_URL}/api/public/landing-page/${token}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    return data.dados;
  }
};

export default PublicLandingPageService;
