import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import CampoPersonalizadoFormModal from '../components/CampoPersonalizadoFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CampoPersonalizadoService, {
  TipoCampoPersonalizado,
  type CampoPersonalizado,
  type CampoPersonalizadoDto,
} from '../services/CampoPersonalizadoService';
import './UserManagementPage.css';
import './CamposPersonalizadosPage.css';

const tipoLabels: Record<TipoCampoPersonalizado, string> = {
  [TipoCampoPersonalizado.Texto]: 'Texto',
  [TipoCampoPersonalizado.Numero]: 'Número',
  [TipoCampoPersonalizado.Data]: 'Data',
  [TipoCampoPersonalizado.Booleano]: 'Booleano',
  [TipoCampoPersonalizado.Selecao]: 'Seleção',
};

const CamposPersonalizadosPage = () => {
  const [campos, setCampos] = useState<CampoPersonalizado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campoToEdit, setCampoToEdit] = useState<CampoPersonalizado | null>(null);
  const [campoToDeleteId, setCampoToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await CampoPersonalizadoService.buscarTodos();
      setCampos(data.sort((a, b) => a.ordem - b.ordem));
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao carregar campos personalizados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredCampos = campos.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (campo: CampoPersonalizado | null = null) => {
    setCampoToEdit(campo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCampoToEdit(null);
  };

  const handleSave = async (dto: CampoPersonalizadoDto) => {
    setIsSaving(true);
    try {
      if (campoToEdit) {
        await CampoPersonalizadoService.atualizar({ ...dto, campoPersonalizadoId: campoToEdit.campoPersonalizadoId });
        toast.success('Campo personalizado atualizado com sucesso!');
      } else {
        await CampoPersonalizadoService.criar(dto);
        toast.success('Campo personalizado criado com sucesso!');
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar campo personalizado.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!campoToDeleteId) return;
    setIsDeleting(true);
    try {
      await CampoPersonalizadoService.remover(campoToDeleteId);
      toast.success('Campo personalizado removido.');
      setCampoToDeleteId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao remover campo personalizado.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <CampoPersonalizadoFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        campoToEdit={campoToEdit}
        isSaving={isSaving}
      />
      <ConfirmationModal
        isOpen={campoToDeleteId !== null}
        onClose={() => setCampoToDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Remover Campo Personalizado"
        message="Tem certeza que deseja remover este campo? Os valores já preenchidos em conversas não serão apagados."
        confirmText="Remover"
        isConfirming={isDeleting}
      />

      <div className="page-container">
        <div className="page-header">
          <h1>Campos Personalizados</h1>
          <button className="add-button" onClick={() => handleOpenModal()}>
            <FaPlus /> Novo Campo
          </button>
        </div>

        <div className="dashboard-card">
          <div className="filters-container">
            <input
              type="text"
              placeholder="Buscar por nome do campo..."
              className="filter-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-container">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Obrigatório</th>
                  <th>Ordem</th>
                  <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                      Carregando...
                    </td>
                  </tr>
                ) : filteredCampos.length > 0 ? (
                  filteredCampos.map(campo => (
                    <tr key={campo.campoPersonalizadoId}>
                      <td className="campo-name-cell">{campo.nome}</td>
                      <td>{tipoLabels[campo.tipo]}</td>
                      <td>
                        <span className={`status-badge ${campo.obrigatorio ? 'status-ativo' : 'status-inativo'}`}>
                          {campo.obrigatorio ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td>{campo.ordem}</td>
                      <td>
                        <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button className="action-icon-btn edit" onClick={() => handleOpenModal(campo)} title="Editar">
                            <FaEdit size={14} />
                          </button>
                          <button className="action-icon-btn delete" onClick={() => setCampoToDeleteId(campo.campoPersonalizadoId)} title="Remover">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                      Nenhum campo personalizado cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default CamposPersonalizadosPage;
