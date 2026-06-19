import { useState, useEffect } from 'react';
import { FaTimes, FaRocket, FaArrowLeft, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { OpportunityService, type CreateOpportunityPayload, type CreateOpportunityCampoPersonalizado } from '../services/OpportunityService';
import CampoPersonalizadoService, { TipoCampoPersonalizado, type CampoPersonalizado } from '../services/CampoPersonalizadoService';
import CustomSelect from './CustomSelect';
import SearchableContactSelect from './SearchableContactSelect';
import { FaUserPlus, FaUser } from 'react-icons/fa';
import './CreateOpportunityModal.css';

interface CreateOpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const TIPO_LEAD_OPTIONS = [
    { value: '1', label: 'Quente' },
    { value: '2', label: 'Morno' },
    { value: '3', label: 'Frio' },
];

const BOOLEANO_OPTIONS = [
    { value: 'true', label: 'Sim' },
    { value: 'false', label: 'Não' },
];

type Step = 'contato' | 'geral';

const CreateOpportunityModal = ({ isOpen, onClose, onCreated }: CreateOpportunityModalProps) => {
    const [step, setStep] = useState<Step>('contato');

    const [tipoCadastro, setTipoCadastro] = useState<'novo' | 'existente' | null>(null);

    const [nomeContato, setNomeContato] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [contatoId, setContatoId] = useState<number | null>(null);
    const [tipoLeadId, setTipoLeadId] = useState('');
    const [valor, setValor] = useState('');
    const [observacao, setObservacao] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [camposPersonalizados, setCamposPersonalizados] = useState<CampoPersonalizado[]>([]);
    const [valoresCampos, setValoresCampos] = useState<Record<number, string>>({});
    const [isLoadingCampos, setIsLoadingCampos] = useState(false);

    const hasCamposPersonalizados = camposPersonalizados.length > 0;

    useEffect(() => {
        if (!isOpen) return;
        resetForm();
        loadCamposPersonalizados();
    }, [isOpen]);

    const resetForm = () => {
        setStep('contato');
        setTipoCadastro(null);
        setNomeContato('');
        setTelefone('');
        setEmail('');
        setContatoId(null);
        setTipoLeadId('');
        setValor('');
        setObservacao('');
        setValoresCampos({});
        setIsSaving(false);
    };

    const loadCamposPersonalizados = async () => {
        setIsLoadingCampos(true);
        try {
            const campos = await CampoPersonalizadoService.buscarTodos();
            setCamposPersonalizados(campos.sort((a, b) => a.ordem - b.ordem));
        } catch {
            setCamposPersonalizados([]);
        } finally {
            setIsLoadingCampos(false);
        }
    };


    const handleCampoValorChange = (campoPersonalizadoId: number, value: string) => {
        setValoresCampos(prev => ({ ...prev, [campoPersonalizadoId]: value }));
    };

    const validateStepContato = (): boolean => {
        if (!tipoCadastro) {
            toast.error('Selecione o tipo de cadastro.');
            return false;
        }
        if (tipoCadastro === 'novo' && !nomeContato.trim()) {
            toast.error('Informe o nome do contato.');
            return false;
        }
        if (tipoCadastro === 'existente' && !contatoId) {
            toast.error('Selecione um contato existente.');
            return false;
        }
        return true;
    };

    const validateCamposPersonalizados = (): boolean => {
        for (const campo of camposPersonalizados) {
            const valorCampo = (valoresCampos[campo.campoPersonalizadoId] ?? '').trim();
            if (campo.obrigatorio && !valorCampo) {
                toast.error(`O campo "${campo.nome}" é obrigatório.`);
                return false;
            }
        }
        return true;
    };

    const buildPayload = (): CreateOpportunityPayload => {
        const camposPreenchidos: CreateOpportunityCampoPersonalizado[] = camposPersonalizados
            .filter(campo => (valoresCampos[campo.campoPersonalizadoId] ?? '').trim() !== '')
            .map(campo => ({
                campoPersonalizadoId: campo.campoPersonalizadoId,
                valor: valoresCampos[campo.campoPersonalizadoId],
            }));

        return {
            contatoNovo: tipoCadastro === 'novo',
            contatoId: tipoCadastro === 'novo' ? null : contatoId,
            contato: tipoCadastro === 'novo'
                ? {
                      nome: nomeContato.trim(),
                      telefone: telefone.trim() || undefined,
                      email: email.trim() || undefined,
                  }
                : null,
            usuarioResponsavelId: null,
            tipoLeadId: tipoLeadId ? Number(tipoLeadId) : null,
            valor: valor ? parseFloat(valor) : null,
            observacao: observacao.trim() || null,
            camposPersonalizados: camposPreenchidos.length > 0 ? camposPreenchidos : null,
        };
    };

    const createOpportunity = async () => {
        setIsSaving(true);
        try {
            const result = await OpportunityService.createOpportunity(buildPayload());
            if (result.sucesso) {
                toast.success('Oportunidade criada com sucesso!');
                onCreated();
                onClose();
            } else {
                toast.error(result.mensagem || 'Erro ao criar oportunidade.');
            }
        } catch {
            toast.error('Erro ao criar oportunidade.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitContato = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStepContato()) return;

        if (hasCamposPersonalizados) {
            setStep('geral');
        } else {
            createOpportunity();
        }
    };

    const handleSubmitGeral = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateCamposPersonalizados()) return;
        createOpportunity();
    };

    const renderCampoInput = (campo: CampoPersonalizado) => {
        const value = valoresCampos[campo.campoPersonalizadoId] ?? '';

        if (campo.tipo === TipoCampoPersonalizado.Selecao) {
            return (
                <CustomSelect
                    value={value}
                    onChange={v => handleCampoValorChange(campo.campoPersonalizadoId, v)}
                    placeholder="Selecionar..."
                    options={(campo.opcoes ?? []).map(op => ({ value: op, label: op }))}
                    disabled={isSaving}
                />
            );
        }

        if (campo.tipo === TipoCampoPersonalizado.Booleano) {
            return (
                <CustomSelect
                    value={value}
                    onChange={v => handleCampoValorChange(campo.campoPersonalizadoId, v)}
                    placeholder="Selecionar..."
                    options={BOOLEANO_OPTIONS}
                    disabled={isSaving}
                />
            );
        }

        if (campo.tipo === TipoCampoPersonalizado.Data) {
            return (
                <input
                    type="date"
                    className="com-input"
                    value={value}
                    onChange={e => handleCampoValorChange(campo.campoPersonalizadoId, e.target.value)}
                    disabled={isSaving}
                />
            );
        }

        if (campo.tipo === TipoCampoPersonalizado.Numero) {
            return (
                <input
                    type="number"
                    step="0.01"
                    className="com-input"
                    value={value}
                    onChange={e => handleCampoValorChange(campo.campoPersonalizadoId, e.target.value)}
                    disabled={isSaving}
                />
            );
        }

        return (
            <input
                type="text"
                className="com-input"
                value={value}
                onChange={e => handleCampoValorChange(campo.campoPersonalizadoId, e.target.value)}
                disabled={isSaving}
            />
        );
    };

    if (!isOpen) return null;

    const steps: { key: Step; label: string }[] = [
        { key: 'contato', label: 'Dados do contato' },
        ...(hasCamposPersonalizados ? [{ key: 'geral' as Step, label: 'Dados gerais' }] : []),
    ];
    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="com-overlay" onClick={onClose}>
            <div className="com-drawer" onClick={e => e.stopPropagation()}>
                <div className="com-header">
                    <div className="com-header-info">
                        <FaRocket className="com-header-icon" />
                        <h3>Nova Oportunidade</h3>
                    </div>
                    <button className="com-close" onClick={onClose} aria-label="Fechar" disabled={isSaving}>
                        <FaTimes />
                    </button>
                </div>

                <div className="com-steps">
                    {steps.map((s, index) => (
                        <div key={s.key} className="com-step-wrapper">
                            <div className={`com-step ${index <= currentStepIndex ? 'active' : ''} ${index < currentStepIndex ? 'done' : ''}`}>
                                <span className="com-step-circle">{index < currentStepIndex ? <FaCheck size={10} /> : index + 1}</span>
                                <span className="com-step-label">{s.label}</span>
                            </div>
                            {index < steps.length - 1 && <div className="com-step-divider" />}
                        </div>
                    ))}
                </div>

                {step === 'contato' && (
                    <form className="com-form" onSubmit={handleSubmitContato}>
                        <div className="com-body">
                            {!tipoCadastro ? (
                                <div className="com-type-selection">
                                    <p className="com-type-selection-label">O que você deseja cadastrar?</p>
                                    <div className="com-type-selection-cards">
                                        <button
                                            type="button"
                                            className="com-type-card"
                                            onClick={() => setTipoCadastro('novo')}
                                        >
                                            <FaUserPlus className="com-type-card-icon" />
                                            <span className="com-type-card-title">Novo Contato</span>
                                            <span className="com-type-card-desc">Cadastrar um cliente do zero</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="com-type-card"
                                            onClick={() => setTipoCadastro('existente')}
                                        >
                                            <FaUser className="com-type-card-icon" />
                                            <span className="com-type-card-title">Contato Existente</span>
                                            <span className="com-type-card-desc">Selecionar um cliente da base</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {tipoCadastro === 'novo' ? (
                                        <div className="com-form-grid">
                                            <div className="com-form-group com-full">
                                                <label>Nome <span className="com-required">*</span></label>
                                                <input
                                                    type="text"
                                                    className="com-input"
                                                    value={nomeContato}
                                                    onChange={e => setNomeContato(e.target.value)}
                                                    placeholder="Nome do contato"
                                                    disabled={isSaving}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="com-form-group com-full">
                                                <label>Telefone</label>
                                                <input
                                                    type="text"
                                                    className="com-input"
                                                    value={telefone}
                                                    onChange={e => setTelefone(e.target.value)}
                                                    placeholder="5511999990000"
                                                    disabled={isSaving}
                                                />
                                            </div>
                                            <div className="com-form-group com-full">
                                                <label>E-mail</label>
                                                <input
                                                    type="email"
                                                    className="com-input"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    placeholder="email@exemplo.com"
                                                    disabled={isSaving}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="com-form-grid">
                                            <div className="com-form-group com-full" style={{ position: 'relative', zIndex: 10 }}>
                                                <label>Selecionar Contato <span className="com-required">*</span></label>
                                                <SearchableContactSelect
                                                    value={contatoId?.toString() || ''}
                                                    onChange={(val) => setContatoId(Number(val))}
                                                    placeholder="Buscar cliente..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="com-form-grid">
                                        <div className="com-form-group com-full">
                                            <label>Temperatura do lead</label>
                                            <CustomSelect
                                                value={tipoLeadId}
                                                onChange={setTipoLeadId}
                                                placeholder="Selecionar temperatura"
                                                options={TIPO_LEAD_OPTIONS}
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="com-form-group com-full">
                                            <label>Valor estimado (R$)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="com-input"
                                                value={valor}
                                                onChange={e => setValor(e.target.value)}
                                                placeholder="0,00"
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="com-form-group com-full">
                                            <label>Observação</label>
                                            <textarea
                                                className="com-input com-textarea"
                                                value={observacao}
                                                onChange={e => setObservacao(e.target.value)}
                                                placeholder="Detalhe como surgiu essa oportunidade..."
                                                rows={3}
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={`com-footer ${tipoCadastro ? 'com-footer-split' : ''}`}>
                            {tipoCadastro ? (
                                <>
                                    <button type="button" className="com-btn-cancel" onClick={() => setTipoCadastro(null)} disabled={isSaving}>
                                        <FaArrowLeft size={12} /> Voltar
                                    </button>
                                    <button type="submit" className="com-btn-confirm" disabled={isSaving || isLoadingCampos}>
                                        {isSaving ? 'Criando...' : hasCamposPersonalizados ? 'Continuar' : 'Criar Oportunidade'}
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="com-btn-cancel" onClick={onClose} disabled={isSaving}>
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {step === 'geral' && (
                    <form className="com-form" onSubmit={handleSubmitGeral}>
                        <div className="com-body">
                            <div className="com-campos-grid">
                                {camposPersonalizados.map(campo => (
                                    <div
                                        key={campo.campoPersonalizadoId}
                                        className={`com-form-group ${campo.tipo === TipoCampoPersonalizado.Texto ? 'com-full' : ''}`}
                                    >
                                        <label>
                                            {campo.nome} {campo.obrigatorio && <span className="com-required">*</span>}
                                        </label>
                                        {renderCampoInput(campo)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="com-footer com-footer-split">
                            <button type="button" className="com-btn-cancel" onClick={() => setStep('contato')} disabled={isSaving}>
                                <FaArrowLeft size={12} /> Voltar
                            </button>
                            <button type="submit" className="com-btn-confirm" disabled={isSaving}>
                                {isSaving ? 'Criando...' : 'Criar Oportunidade'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateOpportunityModal;
