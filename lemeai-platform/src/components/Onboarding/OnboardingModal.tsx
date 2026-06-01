import React from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { FaTimes, FaTachometerAlt, FaComments, FaStream } from 'react-icons/fa';
import logoLight from '../../assets/logo-light.png';

const OnboardingModal: React.FC = () => {
  const { isModalOpen, startOnboarding, skipOnboarding } = useOnboarding();

  if (!isModalOpen) return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <button className="onboarding-close" onClick={skipOnboarding}>
          <FaTimes />
        </button>

        <div className="onboarding-content">
          <div className="onboarding-icon">
            <img src={logoLight} alt="LemeAI Logo" style={{ height: '100%', width: 'auto' }} />
          </div>

          <h1>Bem-vindo!</h1>
          <p>
            Estamos muito felizes em ter você aqui. Este é o seu CRM definitivo
            para gestão de atendimento e vendas. Quer que a gente te mostre o caminho?
          </p>

          <div className="onboarding-features">
            <div className="feature-mini-card">
              <FaTachometerAlt className="feature-icon" />
              <strong>Dashboard</strong>
              <small>Visão geral dos seus números</small>
            </div>
            <div className="feature-mini-card">
              <FaComments className="feature-icon" />
              <strong>Chat</strong>
              <small>Fale com seus clientes</small>
            </div>
            <div className="feature-mini-card">
              <FaStream className="feature-icon" />
              <strong>Pipeline</strong>
              <small>Controle suas vendas</small>
            </div>
          </div>

          <div className="onboarding-actions">
            <button className="btn-primary" onClick={startOnboarding}>
              Vamos lá!
            </button>
            <button className="btn-ghost" onClick={skipOnboarding}>
              Explorar sozinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
