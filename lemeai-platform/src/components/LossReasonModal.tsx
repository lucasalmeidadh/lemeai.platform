import { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import CustomSelect from './CustomSelect';
import { MotivoPerdaService, type MotivoPerda } from '../services/MotivoPerdaService';
import './LossReasonModal.css';

interface LossReasonModalProps {
    isOpen: boolean;
    dealTitle: string;
    onConfirm: (motivoPerdaId: number, motivoPerdaDetalhe: string) => Promise<void>;
    onCancel: () => void;
}

const LossReasonModal = ({ isOpen, dealTitle, onConfirm, onCancel }: LossReasonModalProps) => {
    const [motivos, setMotivos] = useState<MotivoPerda[]>([]);
    const [isLoadingMotivos, setIsLoadingMotivos] = useState(false);
    const [selectedMotivoId, setSelectedMotivoId] = useState<string>('');
    const [detalhe, setDetalhe] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setSelectedMotivoId('');
        setDetalhe('');
        setIsSaving(false);

        const loadMotivos = async () => {
            setIsLoadingMotivos(true);
            try {
                const res = await MotivoPerdaService.getAll();
                if (res.sucesso) setMotivos(res.dados ?? []);
            } catch {
                toast.error('Erro ao carregar motivos de perda.');
            } finally {
                setIsLoadingMotivos(false);
            }
        };
        loadMotivos();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!selectedMotivoId) return;
        setIsSaving(true);
        try {
            await onConfirm(Number(selectedMotivoId), detalhe.trim());
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="lrm-overlay" onClick={onCancel}>
            <div className="lrm-modal" onClick={e => e.stopPropagation()}>
                <div className="lrm-header">
                    <div className="lrm-header-info">
                        <FaExclamationTriangle className="lrm-header-icon" />
                        <div>
                            <h3>Motivo da Perda</h3>
                            <p title={dealTitle}>{dealTitle}</p>
                        </div>
                    </div>
                    <button className="lrm-close" onClick={onCancel} aria-label="Fechar" disabled={isSaving}>
                        <FaTimes />
                    </button>
                </div>

                <div className="lrm-body">
                    <p className="lrm-info-text">
                        Para marcar esta oportunidade como venda perdida é necessário informar o motivo.
                    </p>

                    <div className="lrm-form-group">
                        <label>Motivo da Perda <span className="lrm-required">*</span></label>
                        <CustomSelect
                            value={selectedMotivoId}
                            onChange={setSelectedMotivoId}
                            disabled={isSaving || isLoadingMotivos}
                            placeholder={isLoadingMotivos ? 'Carregando motivos...' : 'Selecione um motivo...'}
                            options={motivos.map(m => ({ value: m.motivoPerdaId.toString(), label: m.descricao }))}
                        />
                    </div>

                    <div className="lrm-form-group">
                        <label>Detalhe (opcional)</label>
                        <textarea
                            className="lrm-textarea"
                            value={detalhe}
                            onChange={e => setDetalhe(e.target.value)}
                            placeholder="Ex: Cliente achou caro comparado ao concorrente X"
                            rows={3}
                            disabled={isSaving}
                        />
                    </div>
                </div>

                <div className="lrm-footer">
                    <button className="lrm-btn-cancel" onClick={onCancel} disabled={isSaving}>
                        Cancelar
                    </button>
                    <button
                        className="lrm-btn-confirm"
                        disabled={!selectedMotivoId || isSaving}
                        onClick={handleConfirm}
                    >
                        {isSaving ? 'Confirmando...' : 'Confirmar Perda'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LossReasonModal;
