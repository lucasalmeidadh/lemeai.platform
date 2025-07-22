import React, { useState } from 'react';
import './Login.css';
import { FaUser, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Login = () => {
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
      const response = await fetch('https://lemeia-api.onrender.com/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Falha na autenticação');
      }

      const data = await response.json();
      
      localStorage.setItem('authToken', data.token);

      console.log('Login bem-sucedido! Token guardado:', data.token);
      
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      setError('Email ou senha inválidos. Por favor, tente novamente.');

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Lado Esquerdo: Informação e Branding */}
      <div className="info-side">
        <div className="info-content">
          <div className="company-logo">
            <h3>LEME.AI</h3>
          </div>
          <h1>A sua plataforma de vendas</h1>
          <p>Conecte-se com seus clientes de forma fácil e eficiente.</p>
        </div>
      </div>

      {/* Lado Direito: Formulário de Login */}
      <div className="form-side">
        <div className="login-box">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="input-with-icon">
              <FaUser className="icon" />
              <input
                type="email"
                id="email"
                placeholder="Usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="input-with-icon">
              <FaLock className="icon" />
              <input
                type="password"
                id="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="options">
              <label>
                <input type="checkbox" /> Lembrar-me
              </label>
              <a href="#">Esqueci a senha</a>
            </div>
            
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'ENTRAR'}
            </button>
          </form>
          <div className="signup-link">
            <p>Novo por aqui? <a href="#">Crie uma conta</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;