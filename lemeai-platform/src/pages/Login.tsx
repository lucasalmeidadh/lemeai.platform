import React, { useState, useEffect, useRef } from 'react';
import './Login.css';
import { FaLock, FaEnvelope, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import logoBrik from '../assets/logo.png';

const PHRASES = [
  'Vender mais todo dia.',
  'Focar no que mais importa, vender.',
  'Melhorar a cada mês.',
  'Do lead ao negócio ganho.',
];

const TYPING_SPEED  = 75;
const ERASING_SPEED = 35;
const PAUSE_AFTER   = 1800;
const PAUSE_BEFORE  = 400;

const Login = () => {
  const apiUrl        = import.meta.env.VITE_API_URL;
  const endpointLogin = import.meta.env.VITE_ENDPOINT_LOGIN;
  const navigate      = useNavigate();

  const [email, setEmail]         = useState<string>('');
  const [password, setPassword]   = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError]         = useState<string | null>(null);

  const [displayed, setDisplayed] = useState<string>('');
  const phraseIndex = useRef(0);
  const charIndex   = useRef(0);
  const isErasing   = useRef(false);

  useEffect(() => {
    const previousTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    
    // Load remembered email if present
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    if (savedRememberMe) {
      setRememberMe(true);
      setEmail(localStorage.getItem('rememberedEmail') || '');
    }
    
    return () => {
      if (previousTheme) document.documentElement.setAttribute('data-theme', previousTheme);
    };
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = PHRASES[phraseIndex.current];

      if (!isErasing.current) {
        if (charIndex.current < current.length) {
          charIndex.current++;
          setDisplayed(current.slice(0, charIndex.current));
          timeout = setTimeout(tick, TYPING_SPEED);
        } else {
          timeout = setTimeout(() => {
            isErasing.current = true;
            tick();
          }, PAUSE_AFTER);
        }
      } else {
        if (charIndex.current > 0) {
          charIndex.current--;
          setDisplayed(current.slice(0, charIndex.current));
          timeout = setTimeout(tick, ERASING_SPEED);
        } else {
          isErasing.current = false;
          phraseIndex.current = (phraseIndex.current + 1) % PHRASES.length;
          timeout = setTimeout(tick, PAUSE_BEFORE);
        }
      }
    };

    timeout = setTimeout(tick, PAUSE_BEFORE);
    return () => clearTimeout(timeout);
  }, []);

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

      // Handle "Remember Me"
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
      }

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
      <div className="login-central-container">

        {/* ── Lado esquerdo — Brand ── */}
        <div className="login-brand-side">
          <div className="brand-panel-inner">
            <img src={logoBrik} alt="Brik CRM" className="login-brand-logo" />
            <div className="brand-slogan-block">
              <h1 className="brand-slogan">
                Mais que um sistema, <br />um conceito.
              </h1>
              <p className="brand-typewriter" aria-live="polite">
                {displayed}<span className="typewriter-cursor" aria-hidden="true" />
              </p>
            </div>
          </div>
        </div>

        {/* ── Lado direito — Formulário ── */}
        <div className="login-form-side">
          <img src={logoBrik} alt="Brik CRM" className="form-logo-mobile" />

          <div className="form-header stagger-1">
            <h2>Acesse sua conta</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form-stack" autoComplete="off">
            {error && (
              <div className="error-alert" role="alert">
                <FaExclamationCircle />
                <span>{error}</span>
              </div>
            )}

            <div className="input-group stagger-2">
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
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="input-group stagger-3">
              <div className="input-group-row">
                <label htmlFor="login-password">Senha</label>
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
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="login-options-row stagger-3">
              <label className="remember-me-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Lembrar-me
              </label>
            </div>

            <button type="submit" className="btn-submit stagger-4" disabled={isLoading}>
              {isLoading
                ? <><FaSpinner className="fa-spin" /> Verificando...</>
                : 'Entrar agora'
              }
            </button>
          </form>

          <p className="login-onboarding-link stagger-5">
            Não tem uma conta? <Link to="/cadastro">Cadastre-se grátis</Link>
          </p>

          <p className="powered-by stagger-5">
            Powered by{' '}
            <a href="https://gbcode.com.br/" target="_blank" rel="noopener noreferrer">GBCode</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
