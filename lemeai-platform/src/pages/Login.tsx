import React, { useState } from 'react';
import './Login.css';
import { FaUser, FaLock, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const endpointLogin = import.meta.env.VITE_ENDPOINT_LOGIN;
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}${endpointLogin}`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Falha na autenticação');
      }

      const response1 = await fetch(`${apiUrl}/api/Auth/Me`, {
        credentials: 'include'
      });
      if (!response1.ok) {
        // If me fails but login passed, might be an issue, but usually means token not set? 
        // Let's assume header or cookie logic handles it.
        throw new Error('Falha na autenticação de sessão');
      }

      const data = await response1.json();
      localStorage.setItem('user', JSON.stringify(data));

      if (window.innerWidth <= 768) {
        navigate('/chat');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error(err);
      setError('Email ou senha inválidos. Por favor, tente novamente.');

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Branding Section */}
      <div className="login-branding-section">
        <div className="brand-content">
          <div className="brand-logo">CRM AI</div>
          <h1 className="brand-tagline">Transforme Conversas em Vendas</h1>
          <p className="brand-description">
            A plataforma inteligente para gerenciar seus leads, negociações e atendimento em um só lugar.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="login-form-section">
        <div className="login-card">
          <div className="login-header">
            <h2>Bem-vindo de volta!</h2>
            <p>Acesse sua conta para continuar.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-banner">{error}</div>}

            <div className="form-group">
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="Seu e-mail profissional"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Sua senha segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> Manter conectado
              </label>
              <a href="#" className="forgot-password">Esqueci a senha</a>
            </div>

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FaSpinner className="fa-spin" /> Verificando...
                </>
              ) : (
                <>
                  Acessar Plataforma <FaArrowRight />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;