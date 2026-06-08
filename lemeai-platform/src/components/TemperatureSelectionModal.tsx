import React, { useState } from 'react';
import './TemperatureSelectionModal.css';
import { FaTimes, FaFire, FaSun, FaSnowflake } from 'react-icons/fa';

interface TemperatureSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (tipoLeadId: number) => void;
}

const TemperatureSelectionModal: React.FC<TemperatureSelectionModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [selectedTemp, setSelectedTemp] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedTemp !== null) {
            onConfirm(selectedTemp);
        }
    };

    return (
        <div className="temp-modal-overlay" onClick={onClose}>
            <div className="temp-modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="temp-modal-header">
                    <h2>Qualificar Lead (Temperatura)</h2>
                    <button className="close-temp-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </header>

                <div className="temp-modal-body">
                    <p className="temp-modal-instruction">
                        Defina a temperatura do negócio para prosseguir com a mudança de status.
                    </p>

                    <div className="temp-options-grid">
                        <button
                            type="button"
                            className={`temp-option-card hot-option ${selectedTemp === 1 ? 'selected' : ''}`}
                            onClick={() => setSelectedTemp(1)}
                        >
                            <div className="temp-icon-wrapper">
                                <FaFire />
                            </div>
                            <span className="temp-option-label">Quente</span>
                            <span className="temp-option-desc">Alto interesse e pronto para fechamento.</span>
                        </button>

                        <button
                            type="button"
                            className={`temp-option-card warm-option ${selectedTemp === 2 ? 'selected' : ''}`}
                            onClick={() => setSelectedTemp(2)}
                        >
                            <div className="temp-icon-wrapper">
                                <FaSun />
                            </div>
                            <span className="temp-option-label">Morno</span>
                            <span className="temp-option-desc">Interessado, mas necessita de follow-up.</span>
                        </button>

                        <button
                            type="button"
                            className={`temp-option-card cold-option ${selectedTemp === 3 ? 'selected' : ''}`}
                            onClick={() => setSelectedTemp(3)}
                        >
                            <div className="temp-icon-wrapper">
                                <FaSnowflake />
                            </div>
                            <span className="temp-option-label">Frio</span>
                            <span className="temp-option-desc">Pouco engajamento ou em estágio inicial.</span>
                        </button>
                    </div>
                </div>

                <footer className="temp-modal-footer">
                    <button className="temp-btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="temp-btn-confirm"
                        onClick={handleConfirm}
                        disabled={selectedTemp === null}
                    >
                        Confirmar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TemperatureSelectionModal;
