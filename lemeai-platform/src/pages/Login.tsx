import React, { useState } from 'react';
import './Login.css';
import { FaLock, FaEnvelope, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
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
        navigate('/pipeline');
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
    <div className="login-centered-page">
      <div className="login-glass-card">
        <div className="card-header-new">
          <h2>Acesse sua conta</h2>
          <p className="subtitle">Digite suas credenciais para entrar no sistema.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-stack">
          {error && (
            <div className="error-alert">
              <FaExclamationCircle /> {error}
            </div>
          )}

          <div className="input-container">
            <div className="modern-input-wrapper">
              <FaEnvelope className="input-icon-left" />
              <input
                type="email"
                className="modern-input"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-container">
            <div className="modern-input-wrapper">
              <FaLock className="input-icon-left" />
              <input
                type="password"
                className="modern-input"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="forgot-password-link">
              <a href="#">Esqueci minha senha</a>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <FaSpinner className="fa-spin" /> Verificando...
              </>
            ) : (
              "Entrar agora"
            )}
          </button>
        </form>

        <div className="page-footer">
          <p className="powered-by">Powered by <a href="https://gbcode.com.br/" target="_blank" rel="noopener noreferrer"><strong>GBCode</strong></a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;