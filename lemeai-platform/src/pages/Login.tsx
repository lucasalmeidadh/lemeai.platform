import React, { useState } from 'react';
import './Login.css';
import { FaUser, FaLock, FaArrowRight, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
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
      setError('Acesso negado. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Immersive Background Effects */}
      <div className="tech-grid"></div>
      <div className="wave-layer wave-1"></div>
      <div className="wave-layer wave-2"></div>

      {/* Centered Login Card */}
      <div className="login-card">
        <div className="card-header">
          <div className="brand-badge">LEME AI</div>
          <h2>Bem-vindo de volta!</h2>
          <p>Acesse seu painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-stack">
          {error && (
            <div className="error-alert">
              <FaExclamationCircle /> {error}
            </div>
          )}

          <div className="input-container">
            <label className="input-label">Email</label>
            <div className="modern-input-wrapper">
              <FaUser className="input-icon-left" />
              <input
                type="email"
                className="modern-input"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-container">
            <label className="input-label">Senha</label>
            <div className="modern-input-wrapper">
              <FaLock className="input-icon-left" />
              <input
                type="password"
                className="modern-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <FaSpinner className="fa-spin" /> Verificando...
              </>
            ) : (
              <>
                ACESSAR SISTEMA <FaArrowRight />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="page-footer">
        <p>Powered by <a href="https://gbcode.com.br/" target="_blank" rel="noopener noreferrer">GbCode</a></p>
      </div>

    </div>
  );
};

export default Login;