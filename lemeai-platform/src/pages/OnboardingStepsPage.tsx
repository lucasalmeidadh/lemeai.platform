import React from 'react';
import { FaBox, FaComments, FaWhatsapp, FaExternalLinkAlt, FaRocket } from 'react-icons/fa';
import './OnboardingStepsPage.css';

const OnboardingStepsPage = () => {
    const steps = [
        {
            title: 'Cadastro de Produtos e Serviços',
            description: 'Cadastre os itens que sua empresa oferece para que a IA possa fornecer informações precisas aos clientes.',
            icon: <FaBox />,
            link: '/products',
            buttonText: 'Configurar Produtos'
        },
        {
            title: 'Regras do Chat',
            description: 'Defina as diretrizes de comportamento da IA, tom de voz e informações cruciais sobre seu negócio.',
            icon: <FaComments />,
            link: '/chat-rules',
            buttonText: 'Definir Regras'
        },
        {
            title: 'Conexão Whatsapp',
            description: 'Conecte seu número de WhatsApp para começar a atender seus clientes automaticamente.',
            icon: <FaWhatsapp />,
            link: '/connections',
            buttonText: 'Conectar WhatsApp'
        }
    ];

    const handleOpenLink = (link: string) => {
        window.open(link, '_blank');
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-header">
                <div className="header-icon">
                    <FaRocket />
                </div>
                <h1>Bem-vindo ao LemeAI!</h1>
                <p>Siga estes três passos fundamentais para colocar sua operação para rodar com excelência.</p>
            </div>

            <div className="steps-container">
                {steps.map((step, index) => (
                    <div key={index} className="step-card">
                        <div className="step-badge">Passo {index + 1}</div>
                        <div className="step-icon">{step.icon}</div>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                        <button onClick={() => handleOpenLink(step.link)} className="step-button">
                            <span>{step.buttonText}</span>
                            <FaExternalLinkAlt />
                        </button>
                    </div>
                ))}
            </div>

            <div className="onboarding-footer">
                <p>Precisa de ajuda? Clique em <strong>Ajuda</strong> no menu lateral para ver tutoriais em vídeo.</p>
            </div>
        </div>
    );
};

export default OnboardingStepsPage;
