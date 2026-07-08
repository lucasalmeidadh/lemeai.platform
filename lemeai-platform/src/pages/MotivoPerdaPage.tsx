import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import './MotivoPerdaPage.css';
import { MotivoPerdaService, type MotivoPerda } from '../services/MotivoPerdaService';

const MotivoPerdaPage = () => {
    const [motivos, setMotivos] = useState<MotivoPerda[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMotivo, setCurrentMotivo] = useState<MotivoPerda | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [descricao, setDescricao] = useState('');

    useEffect(() => {
        loadMotivos();
    }, []);

    const loadMotivos = async () => {
        setIsLoading(true);
        try {
            const response = await MotivoPerdaService.getAll();
            if (response.sucesso) {
                setMotivos(response.dados);
            } else {
                toast.error(response.mensagem || 'Erro ao carregar motivos de perda.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (motivo?: MotivoPerda) => {
        if (motivo) {
            setCurrentMotivo(motivo);
            setDescricao(motivo.descricao);
        } else {
            setCurrentMotivo(null);
            setDescricao('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentMotivo(null);
        setDescricao('');
    };

    const handleSaveMotivo = async () => {
        if (!descricao.trim()) {
            toast.error('A descrição do motivo de perda é obrigatória.');
            return;
        }

        try {
            if (currentMotivo) {
                const response = await MotivoPerdaService.update({
                    motivoPerdaId: currentMotivo.motivoPerdaId,
                    descricao: descricao.trim(),
                });
                if (response.sucesso) {
                    toast.success('Motivo de perda atualizado com sucesso!');
                    loadMotivos();
                    handleCloseModal();
                } else {
                    toast.error(response.mensagem || 'Erro ao atualizar.');
                }
            } else {
                const response = await MotivoPerdaService.create({ descricao: descricao.trim() });
                if (response.sucesso) {
                    toast.success('Motivo de perda criado com sucesso!');
                    loadMotivos();
                    handleCloseModal();
                } else {
                    toast.error(response.mensagem || 'Erro ao criar.');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar motivo de perda.');
        }
    };

    const handleDeleteMotivo = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir este motivo de perda?')) {
            try {
                const response = await MotivoPerdaService.delete(id);
                if (response.sucesso) {
                    toast.success('Motivo de perda removido com sucesso!');
                    loadMotivos();
                } else {
                    toast.error(response.mensagem || 'Erro ao remover motivo de perda.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao remover motivo de perda.');
            }
        }
    };

    return (
        <div className="page-container motivo-perda-page">
            <div className="page-header">
                <h1>Motivos de Perda</h1>
                <button className="add-button" onClick={() => handleOpenModal()}>
                    <FaPlus /> Novo
                </button>
            </div>

            <div className="dashboard-card">
                <div className="table-container">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={2} style={{ textAlign: 'center', padding: '40px' }}>
                                        Carregando motivos de perda...
                                    </td>
                                </tr>
                            ) : motivos.length > 0 ? (
                                motivos.map((motivo) => (
                                    <tr key={motivo.motivoPerdaId}>
                                        <td>{motivo.descricao}</td>
                                        <td>
                                            <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                                <button className="action-icon-btn edit" onClick={() => handleOpenModal(motivo)} title="Editar">
                                                    <FaEdit size={14} />
                                                </button>
                                                <button className="action-icon-btn delete" onClick={() => handleDeleteMotivo(motivo.motivoPerdaId)} title="Excluir">
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} style={{ textAlign: 'center', padding: '40px' }}>
                                        Nenhum motivo de perda encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{currentMotivo ? 'Editar Motivo de Perda' : 'Novo Motivo de Perda'}</h2>
                            <button className="close-button" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="descricao">Descrição *</label>
                                <input
                                    type="text"
                                    id="descricao"
                                    name="descricao"
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                    placeholder="Ex: Preço, Concorrência, Sem resposta..."
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="secondary-button" onClick={handleCloseModal}>Cancelar</button>
                            <button className="primary-button" onClick={handleSaveMotivo}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MotivoPerdaPage;
