import React, { useState } from 'react';
import { FaPhoneAlt, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { NvoipService } from '../services/NvoipService';
import './NvoipDialer.css';

export const NvoipDialer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [caller, setCaller] = useState('');
    const [called, setCalled] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCall = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!caller || !called) {
            toast.error('Preencha os números de origem e destino');
            return;
        }

        setIsLoading(true);
        try {
            await NvoipService.realizarChamada(caller, called);
            toast.success('Ligação iniciada com sucesso!');
            setIsOpen(false);
            setCaller('');
            setCalled('');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao realizar a chamada.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="nvoip-dialer-container">
            {isOpen && (
                <div className="nvoip-dialer-modal">
                    <div className="nvoip-dialer-header">
                        <h3>Realizar Ligação</h3>
                        <button className="nvoip-close-button" onClick={() => setIsOpen(false)}>
                            <FaTimes />
                        </button>
                    </div>
                    <form onSubmit={handleCall} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="nvoip-form-group">
                            <label>Seu Número (Origem)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: 11999999999" 
                                value={caller}
                                onChange={(e) => setCaller(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="nvoip-form-group">
                            <label>Número do Cliente (Destino)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: 11988888888" 
                                value={called}
                                onChange={(e) => setCalled(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="nvoip-submit-button" disabled={isLoading}>
                            <FaPhoneAlt /> {isLoading ? 'Ligando...' : 'Ligar'}
                        </button>
                    </form>
                </div>
            )}
            
            {!isOpen && (
                <button 
                    className="nvoip-dialer-button" 
                    onClick={() => setIsOpen(true)}
                    title="Ligar via Nvoip"
                >
                    <FaPhoneAlt />
                </button>
            )}
        </div>
    );
};
