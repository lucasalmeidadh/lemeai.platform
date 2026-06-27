import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import './SubscriptionExpiredModal.css';

interface SubscriptionExpiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    expirationDate?: string | null;
}

const SubscriptionExpiredModal: React.FC<SubscriptionExpiredModalProps> = ({ isOpen, onClose, expirationDate }) => {
    const navigate = useNavigate();

    if (!isOpen) {
        return null;
    }

    const formattedDate = expirationDate
        ? new Date(expirationDate).toLocaleDateString('pt-BR')
        : null;

    const handleGoToPlan = () => {
        onClose();
        navigate('/plano');
    };

    return (
        <div className="subscription-expired-overlay" onClick={onClose}>
            <div className="subscription-expired-content" onClick={(e) => e.stopPropagation()}>
                <header className="subscription-expired-header">
                    <div className="subscription-expired-header-icon">
                        <FaExclamationTriangle />
                    </div>
                    <h2>Assinatura vencida</h2>
                    <button onClick={onClose} className="subscription-expired-close-button" aria-label="Fechar">
                        <FaTimes />
                    </button>
                </header>
                <main className="subscription-expired-body">
                    <p>
                        {formattedDate
                            ? <>Sua assinatura venceu em <strong>{formattedDate}</strong>.</>
                            : 'Sua assinatura está vencida.'}
                    </p>
                    <p>
                        Para continuar utilizando todos os recursos da plataforma sem interrupções, renove sua assinatura.
                    </p>
                </main>
                <footer className="subscription-expired-footer">
                    <button type="button" className="subscription-expired-btn secondary" onClick={onClose}>
                        Fechar
                    </button>
                    <button type="button" className="subscription-expired-btn primary" onClick={handleGoToPlan}>
                        Ir para planos
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SubscriptionExpiredModal;
