import React, { useState } from 'react';
import './Login.css';
import { FaUser, FaLock, FaArrowRight } from 'react-icons/fa';
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

      const response1 = await fetch('http://localhost:8080/api/Auth/Me', {
        credentials: 'include'
      });
      if (!response1.ok) {
        throw new Error('Falha na autenticação');
      }

      const data = await response1.json();
      localStorage.setItem('user', JSON.stringify(data));

      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      setError('Email ou senha inválidos. Por favor, tente novamente.');

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container-creative">
      <div className="login-background">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
      </div>

      <div className="login-form-wrapper">
        <div className="login-header">
          <h2 className="logo-creative">LEME.AI</h2>
          <h3>Seja Bem-vindo</h3>
          <p>Insira suas credenciais para acessar a plataforma.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-creative">

          {error && <p className="error-message-creative">{error}</p>}

          <div className="input-group-creative">
            <FaUser className="icon-creative" />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group-creative">
            <FaLock className="icon-creative" />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="options-creative">
            <label>
              <input type="checkbox" /> Manter conectado
            </label>
            <a href="#">Esqueci a senha</a>
          </div>

          <button type="submit" className="button-creative" disabled={isLoading}>
            {isLoading ? 'Verificando...' : 'Acessar Plataforma'}
            {!isLoading && <FaArrowRight className="button-icon" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;