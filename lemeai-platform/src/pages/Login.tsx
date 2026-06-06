import React, { useState, useEffect } from 'react';
import './Login.css';
import { FaLock, FaEnvelope, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logoDark from '../assets/logo-dark.png';

const PHRASES = [
  'Vender mais todo dia.',
  'Focar no que mais importa, vender.',
  'Melhorar a cada mês.',
  'Do lead a venda fechada.',
];

const TYPING_SPEED   = 60;
const DELETING_SPEED = 35;
const PAUSE_AFTER    = 1800;
const PAUSE_BEFORE   = 400;

function useTypewriter(phrases: string[]) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];

    if (!isDeleting && displayed === current) {
      const t = setTimeout(() => setIsDeleting(true), PAUSE_AFTER);
      return () => clearTimeout(t);
    }
    if (isDeleting && displayed === '') {
      const t = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIdx((i) => (i + 1) % phrases.length);
      }, PAUSE_BEFORE);
      return () => clearTimeout(t);
    }

    const speed = isDeleting ? DELETING_SPEED : TYPING_SPEED;
    const t = setTimeout(() => {
      setDisplayed(isDeleting
        ? current.slice(0, displayed.length - 1)
        : current.slice(0, displayed.length + 1)
      );
    }, speed);

    return () => clearTimeout(t);
  }, [displayed, isDeleting, phraseIdx, phrases]);

  return displayed;
}

const Login = () => {
  const apiUrl        = import.meta.env.VITE_API_URL;
  const endpointLogin = import.meta.env.VITE_ENDPOINT_LOGIN;
  const navigate      = useNavigate();

  const [email, setEmail]         = useState<string>('');
  const [password, setPassword]   = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError]         = useState<string | null>(null);

  const typed = useTypewriter(PHRASES);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}${endpointLogin}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Falha na autenticação');

      const response1 = await fetch(`${apiUrl}/api/Auth/Me`, { credentials: 'include' });
      if (!response1.ok) throw new Error('Falha na autenticação de sessão');

      const data = await response1.json();
      localStorage.setItem('user', JSON.stringify(data));

      navigate(window.innerWidth <= 768 ? '/pipeline' : '/monitoramento');
    } catch (err) {
      console.error(err);
      setError('Acesso negado. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root">

      {/* ── Painel esquerdo — brand + typewriter ── */}
      <div className="login-brand-panel">
        <div className="mesh-orb mesh-orb-1" aria-hidden="true" />
        <div className="mesh-orb mesh-orb-2" aria-hidden="true" />
        <div className="mesh-orb mesh-orb-3" aria-hidden="true" />

        <div className="brand-panel-inner">
          <img src={logoDark} alt="LemeIA" className="brand-logo" />

          <div className="brand-typewriter-block">
            <p className="brand-pre">Plataforma de vendas que faz você</p>
            <h1 className="brand-typed">
              <span>{typed}</span><span className="cursor" aria-hidden="true" />
            </h1>
          </div>

          <p className="brand-description">
            Gestão comercial com inteligência artificial integrada. Do lead ao fechamento, tudo em um só lugar.
          </p>
        </div>
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <img src={logoDark} alt="LemeIA" className="form-logo-mobile" />

          <div className="form-header">
            <h2>Acesse sua conta</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form-stack">
            {error && (
              <div className="error-alert" role="alert">
                <FaExclamationCircle />
                <span>{error}</span>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="login-email">E-mail</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-group-row">
                <label htmlFor="login-password">Senha</label>
                {/* <a href="#" className="forgot-link">Esqueci minha senha</a> */}
              </div>
              <div className="input-wrapper">
                <FaLock className="input-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading
                ? <><FaSpinner className="fa-spin" /> Verificando...</>
                : 'Entrar agora'
              }
            </button>
          </form>

          <p className="powered-by">
            Powered by{' '}
            <a href="https://gbcode.com.br/" target="_blank" rel="noopener noreferrer">GBCode</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
