import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaBuilding, FaTicketAlt, FaCheckCircle, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBookmark } from 'react-icons/fa';
import PublicLandingPageService, { type PublicPageDetails } from '../services/PublicLandingPageService';
import { getMidiaUrl } from '../services/GerenciarEmpresaService';
import CustomSelect from '../components/CustomSelect';
import './PublicLandingPage.css';

const PublicLandingPage = () => {
  const { token } = useParams<{ token: string }>();
  const [config, setConfig] = useState<PublicPageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoText, setPromoText] = useState<string | null>(null);

  // Form fields
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [comoConheceu, setComoConheceu] = useState('');
  const [comoConheceuOutros, setComoConheceuOutros] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (token) {
      loadPageConfig();
    }
  }, [token]);

  useEffect(() => {
    // Permite scroll no body nesta pagina publica
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    return () => {
      // Restaura o overflow original ao desmontar
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const defaultSegments = [
    'Hotéis / Pousada',
    'Instagram',
    'Já conhecia a loja',
    'CAT',
    'Pontos turísticos da cidade',
    'Outros'
  ];

  const loadPageConfig = async () => {
    try {
      const data = await PublicLandingPageService.getPageDetails(token!);
      setConfig(data);
      const segmentsList = data.configuredSegments && data.configuredSegments.length > 0 ? data.configuredSegments : defaultSegments;
      setComoConheceu(segmentsList[0] || '');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar a página.');
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete address using ViaCEP API
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCep = e.target.value.replace(/\D/g, '');
    setCep(rawCep);

    if (rawCep.length === 8) {
      const toastId = toast.loading('Buscando CEP...');
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const data = await response.json();
        if (data.erro) {
          toast.error('CEP não encontrado.', { id: toastId });
          return;
        }
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
        toast.success('Endereço autocompletado!', { id: toastId });
      } catch (err) {
        toast.error('Erro ao buscar o CEP.', { id: toastId });
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Formata telefone amigavelmente (ex: (11) 99999-9999)
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 10) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setTelefone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !telefone) {
      toast.error('Por favor, preencha o Nome e o Telefone.');
      return;
    }

    setSubmitting(true);
    try {
      const segmentValue = comoConheceu === 'Outros' ? comoConheceuOutros : comoConheceu;
      const result = await PublicLandingPageService.registerContact(token!, {
        nome,
        telefone,
        email: email || undefined,
        segment: segmentValue || undefined,
        cep: undefined,
        street: undefined,
        number: undefined,
        complement: undefined,
        neighborhood: undefined,
        city: city || undefined,
        state: undefined
      });

      setPromoCode(result.promoCode);
      setPromoText(result.promoText);
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar o cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-landing-loading">
        <div className="spinner"></div>
        <p>Carregando página da loja...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="public-landing-error">
        <FaBuilding className="error-icon" />
        <h2>Página não encontrada</h2>
        <p>Esta página pública pode ter sido desativada ou a URL está incorreta.</p>
      </div>
    );
  }

  // Prepara variáveis de tema baseadas na configuração da empresa
  const themeStyles = {
    '--primary-color': config.primaryColor || '#0a5c5a',
    '--bg-color': config.backgroundColor || '#0d0f12',
    '--text-color': config.textColor || '#ffffff',
    '--primary-hover-color': config.primaryColor ? `${config.primaryColor}dd` : '#0a5c5add'
  } as React.CSSProperties;

  const segmentsList = config.configuredSegments && config.configuredSegments.length > 0 ? config.configuredSegments : defaultSegments;
  const selectOptions = segmentsList.map(seg => ({ value: seg, label: seg }));

  return (
    <div className="public-landing-container" style={themeStyles}>
      <div className="public-landing-card">
        {/* Header da Empresa */}
        <div className="public-landing-header">
          {config.logoUrl ? (
            <img src={getMidiaUrl(config.logoUrl)} alt={config.branchName} className="company-logo" />
          ) : (
            <div className="company-avatar-placeholder">
              <FaBuilding />
            </div>
          )}
          <h1 className="company-name">{config.branchName}</h1>
          <p className="company-tagline">
            Cadastre-se rapidamente para fazer parte da nossa base de clientes!
          </p>
        </div>

        {/* Formulário de Cadastro */}
        {!success ? (
          <form className="public-landing-form" onSubmit={handleSubmit}>
            <div className="form-group-row">
              <div className="form-field">
                <label htmlFor="nome-input"><FaUser /> Nome Completo</label>
                <input
                  id="nome-input"
                  type="text"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group-row double-fields">
              <div className="form-field">
                <label htmlFor="telefone-input"><FaPhone /> WhatsApp / Celular</label>
                <input
                  id="telefone-input"
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={handlePhoneChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="email-input"><FaEnvelope /> E-mail (Opcional)</label>
                <input
                  id="email-input"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-field">
                <label htmlFor="como-conheceu-select"><FaBookmark /> Como conheceu a {config.branchName}?</label>
                <CustomSelect
                  options={selectOptions}
                  value={comoConheceu}
                  onChange={setComoConheceu}
                  placeholder="Selecione uma opção..."
                />
              </div>
            </div>

            {comoConheceu === 'Outros' && (
              <div className="form-group-row fade-in">
                <div className="form-field">
                  <label htmlFor="como-conheceu-outros-input">Digite aqui como nos conheceu</label>
                  <input
                    id="como-conheceu-outros-input"
                    type="text"
                    placeholder="Especifique..."
                    value={comoConheceuOutros}
                    onChange={(e) => setComoConheceuOutros(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Seção de Endereço */}
            <div className="address-section-header">
              <FaMapMarkerAlt />
              <span>Cidade</span>
            </div>

            <div className="form-group-row">
              <div className="form-field">
                <label htmlFor="cidade-input">Cidade onde reside</label>
                <input
                  id="cidade-input"
                  type="text"
                  placeholder="Digite sua cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </button>
          </form>
        ) : (
          /* Tela de Sucesso com o Cupom */
          <div className="public-landing-success fade-in">
            <FaCheckCircle className="success-icon" />
            <h2>Cadastro Realizado!</h2>
            <p>Seus dados foram salvos com sucesso no nosso CRM.</p>

            {config.promoActive && promoCode && (
              <div className="coupon-card">
                <div className="coupon-dashed-border">
                  <div className="coupon-header">
                    <FaTicketAlt className="ticket-icon" />
                    <span>SEU CUPOM DE DESCONTO</span>
                  </div>
                  <div className="coupon-code">{promoCode}</div>
                  <p className="coupon-description">
                    {promoText || 'Apresente este código no caixa para obter seu benefício.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicLandingPage;
