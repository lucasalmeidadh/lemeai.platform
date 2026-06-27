import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaBuilding, 
  FaIdCard, 
  FaSpinner, 
  FaArrowLeft, 
  FaArrowRight, 
  FaExclamationCircle,
  FaCheckCircle,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import logoBrik from '../assets/logo.png';
import { apiFetch } from '../services/api';
import toast from 'react-hot-toast';
import './OnboardingPage.css';

const OnboardingPage = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Onboarding Step State
  const [step, setStep] = useState<number>(1);

  // Form Fields State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpValidated, setOtpValidated] = useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);

  // Password Visibility Toggle State
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // UI Status State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isValidatingOtp, setIsValidatingOtp] = useState<boolean>(false);
  const [otpCooldown, setOtpCooldown] = useState<number>(0);

  useEffect(() => {
    const previousTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      if (previousTheme) document.documentElement.setAttribute('data-theme', previousTheme);
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (otpCooldown > 0) {
      timer = setTimeout(() => {
        setOtpCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleValidateOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error('Por favor, insira o código de 6 dígitos.');
      return;
    }
    setIsValidatingOtp(true);

    try {
      const response = await apiFetch(`${apiUrl}/api/Auth/ValidateOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigoOtp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok || data.sucesso === false) {
        throw new Error(data.mensagem || data.message || 'Código de verificação incorreto.');
      }

      setOtpValidated(true);
      toast.success('Código verificado com sucesso!');
    } catch (err: any) {
      setOtpValidated(false);
      toast.error(err.message || 'Código de verificação incorreto.');
    } finally {
      setIsValidatingOtp(false);
    }
  };

  // Format CNPJ as 00.000.000/0000-00
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.substring(0, 14);
    
    // Apply CNPJ mask
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/, "$1.$2.$3/$4");
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d{0,3})$/, "$1.$2.$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,3})$/, "$1.$2");
    }
    setCnpj(value);
  };

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Por favor, preencha o e-mail corporativo para enviar o código.');
      return;
    }
    setIsSendingOtp(true);

    try {
      const response = await apiFetch(`${apiUrl}/api/Auth/SendOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || data.sucesso === false) {
        throw new Error(data.mensagem || data.message || 'Falha ao enviar o código de verificação.');
      }

      toast.success('Código de verificação enviado para o seu e-mail!');
      setOtpSent(true);
      setOtpCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar o código de verificação.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const hasMinMax = password.length >= 8 && password.length <= 16;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinMax && hasUpper && hasLower && hasSpecial;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation for Step 1
    if (!name || !email || !password || !confirmPassword || !otpCode) {
      toast.error('Por favor, preencha todos os campos, incluindo o código de verificação.');
      return;
    }

    if (!otpValidated) {
      toast.error('Código de verificação inválido ou incorreto.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    if (!isPasswordValid) {
      toast.error('A senha não atende aos requisitos mínimos.');
      return;
    }

    if (otpCode.length !== 6) {
      toast.error('O código de verificação deve ter 6 dígitos.');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      toast.error('Por favor, insira um CNPJ válido com 14 dígitos.');
      setIsLoading(false);
      return;
    }

    if (!companyName) {
      toast.error('Por favor, insira o nome da sua empresa.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiFetch(`${apiUrl}/api/Auth/Register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeUsuario: name,
          email,
          senha: password,
          nomeEmpresa: companyName,
          cnpj: cleanCnpj,
          codigoOtp: otpCode
        }),
      });

      const data = await response.json();

      if (!response.ok || data.sucesso === false) {
        throw new Error(data.mensagem || 'Falha ao realizar cadastro.');
      }

      setRegistrationSuccess(true);
      toast.success('Sua empresa e conta foram criadas com sucesso!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      toast.error(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-root">
      <div className="onboarding-central-container">
        
        {/* Lado esquerdo — Formulário */}
        <div className="onboarding-form-side">
          
          <div className="onboarding-header">
            <h2>Criar sua conta</h2>
            <p>{step === 1 ? 'Passo 1: Suas informações de login' : 'Passo 2: Sobre a sua empresa'}</p>
          </div>

          {registrationSuccess && (
            <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <FaSpinner className="fa-spin" /> Redirecionando para o login...
            </div>
          )}

          {!registrationSuccess && (
            <>
              {step === 1 ? (
                <form onSubmit={handleNextStep} className="onboarding-form-stack">
                  <div className="input-group">
                    <label htmlFor="register-name">Nome Completo</label>
                    <div className="input-wrapper">
                      <FaUser className="input-icon" aria-hidden="true" />
                      <input
                        id="register-name"
                        type="text"
                        placeholder="Ex: João da Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={otpValidated}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="register-email">E-mail Corporativo</label>
                    <div className="email-otp-row">
                      <div className="input-wrapper email-input-wrapper">
                        <FaEnvelope className="input-icon" aria-hidden="true" />
                        <input
                          id="register-email"
                          type="email"
                          placeholder="nome@suaempresa.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (otpSent) {
                              setOtpSent(false);
                              setOtpCode('');
                            }
                          }}
                          required
                          autoComplete="off"
                          disabled={otpValidated || isSendingOtp}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-send-otp"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || otpCooldown > 0 || !email}
                      >
                        {isSendingOtp ? (
                          <FaSpinner className="fa-spin" />
                        ) : otpCooldown > 0 ? (
                          `Reenviar em ${otpCooldown}s`
                        ) : otpSent ? (
                          'Reenviar Código'
                        ) : (
                          'Enviar Código'
                        )}
                      </button>
                    </div>
                  </div>

                  {otpSent && (
                    <div className="input-group animate-fade-in">
                      <label htmlFor="register-otp">Código de Verificação (OTP)</label>
                      <div className="email-otp-row">
                        <div className="input-wrapper email-input-wrapper">
                          <FaLock className="input-icon" aria-hidden="true" />
                          <input
                            id="register-otp"
                            type="text"
                            placeholder="Insira o código de 6 dígitos"
                            value={otpCode}
                            onChange={(e) => {
                              setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6));
                              setOtpValidated(false);
                            }}
                            required
                            maxLength={6}
                            disabled={otpValidated || isValidatingOtp}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-send-otp"
                          onClick={handleValidateOtp}
                          disabled={isValidatingOtp || otpCode.length !== 6 || otpValidated}
                        >
                          {isValidatingOtp ? (
                            <FaSpinner className="fa-spin" />
                          ) : otpValidated ? (
                            'Validado'
                          ) : (
                            'Validar Código'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {otpSent && otpValidated && (
                    <div className="onboarding-form-grid animate-fade-in">
                      <div className="input-group">
                        <label htmlFor="register-password">Senha</label>
                        <div className="input-wrapper">
                          <FaLock className="input-icon" aria-hidden="true" />
                          <input
                            id="register-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        <div className="password-requirements">
                          <div className={`req-item ${hasMinMax ? 'valid' : 'invalid'}`}>
                            {hasMinMax ? <FaCheckCircle /> : <FaExclamationCircle />} Entre 8 e 16 caracteres
                          </div>
                          <div className={`req-item ${hasUpper ? 'valid' : 'invalid'}`}>
                            {hasUpper ? <FaCheckCircle /> : <FaExclamationCircle />} 1 letra maiúscula
                          </div>
                          <div className={`req-item ${hasLower ? 'valid' : 'invalid'}`}>
                            {hasLower ? <FaCheckCircle /> : <FaExclamationCircle />} 1 letra minúscula
                          </div>
                          <div className={`req-item ${hasSpecial ? 'valid' : 'invalid'}`}>
                            {hasSpecial ? <FaCheckCircle /> : <FaExclamationCircle />} 1 caractere especial
                          </div>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="register-confirm-password">Confirmar Senha</label>
                        <div className="input-wrapper">
                          <FaLock className="input-icon" aria-hidden="true" />
                          <input
                            id="register-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="onboarding-actions">
                    <span />
                    {otpSent && otpValidated && (
                      <button type="submit" className="btn-submit">
                        Próximo passo <FaArrowRight />
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="onboarding-form-stack">
                  <div className="input-group">
                    <label htmlFor="register-company">Nome da Empresa</label>
                    <div className="input-wrapper">
                      <FaBuilding className="input-icon" aria-hidden="true" />
                      <input
                        id="register-company"
                        type="text"
                        placeholder="Ex: Minha Empresa LTDA"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="register-cnpj">CNPJ da Empresa</label>
                    <div className="input-wrapper">
                      <FaIdCard className="input-icon" aria-hidden="true" />
                      <input
                        id="register-cnpj"
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        onChange={handleCnpjChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="onboarding-actions">
                    <button 
                      type="button" 
                      className="btn-back" 
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                    >
                      <FaArrowLeft /> Voltar
                    </button>
                    <button type="submit" className="btn-submit" disabled={isLoading}>
                      {isLoading ? (
                        <><FaSpinner className="fa-spin" /> Finalizando...</>
                      ) : (
                        'Criar minha conta experimental'
                      )}
                    </button>
                  </div>
                </form>
              )}

              <p className="onboarding-link">
                Já possui uma conta? <Link to="/login">Acesse agora</Link>
              </p>
            </>
          )}

        </div>

        {/* Lado direito — Brand Panel */}
        <div className="onboarding-brand-side">
          <div className="brand-panel-inner">
            <img src={logoBrik} alt="Brik CRM" className="login-brand-logo" />
            <div className="brand-slogan-block">
              <h1 className="brand-slogan">
                Comece grátis hoje mesmo.
              </h1>
              <p className="brand-typewriter">
                Seu período de avaliação de 7 dias com todos os recursos liberados começará logo após o cadastro.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OnboardingPage;
