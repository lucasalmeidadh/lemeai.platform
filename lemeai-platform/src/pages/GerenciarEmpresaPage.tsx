import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { FaCalendarCheck, FaCheckCircle, FaTimesCircle, FaCalendarWeek, FaBuilding, FaCamera, FaPen, FaTimes, FaQrcode } from 'react-icons/fa';
import GerenciarEmpresaService, { DEFAULT_DIAS_UTEIS, getMidiaUrl, type DiasUteis, type DadosGeraisEmpresa, type AtualizarDadosGeraisDTO } from '../services/GerenciarEmpresaService';
import LogoCropModal from '../components/LogoCropModal';
import LandingPageConfigTab from '../components/LandingPageConfigTab';
import './GerenciarEmpresaPage.css';

const LOGO_MIN_DIMENSION = 64;
const LOGO_MAX_DIMENSION = 2000;
const LOGO_MIN_ASPECT_RATIO = 1;
const LOGO_MAX_ASPECT_RATIO = 4;

const readImageDimensions = (arquivo: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem selecionada.'));
    };
    img.src = url;
  });
};

const DAY_CONFIG: {
  key: keyof DiasUteis;
  label: string;
  abbr: string;
  type: 'weekday' | 'weekend';
}[] = [
  { key: 'segunda', label: 'Segunda-feira', abbr: 'SEG', type: 'weekday' },
  { key: 'terca',   label: 'Terça-feira',   abbr: 'TER', type: 'weekday' },
  { key: 'quarta',  label: 'Quarta-feira',  abbr: 'QUA', type: 'weekday' },
  { key: 'quinta',  label: 'Quinta-feira',  abbr: 'QUI', type: 'weekday' },
  { key: 'sexta',   label: 'Sexta-feira',   abbr: 'SEX', type: 'weekday' },
  { key: 'sabado',  label: 'Sábado',        abbr: 'SÁB', type: 'weekend' },
  { key: 'domingo', label: 'Domingo',       abbr: 'DOM', type: 'weekend' },
];

const GerenciarEmpresaPage = () => {
  const [dadosGerais, setDadosGerais] = useState<DadosGeraisEmpresa | null>(null);
  const [isLoadingDados, setIsLoadingDados] = useState(true);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingDados, setIsSavingDados] = useState(false);
  const [isEditingDados, setIsEditingDados] = useState(false);
  const [dadosGeraisBackup, setDadosGeraisBackup] = useState<DadosGeraisEmpresa | null>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workingDays, setWorkingDays] = useState<DiasUteis>(DEFAULT_DIAS_UTEIS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDias, setIsLoadingDias] = useState(true);
  const [activeTab, setActiveTab] = useState<'dados' | 'funcionamento' | 'captura'>('dados');

  useEffect(() => {
    GerenciarEmpresaService.getDadosGerais()
      .then(setDadosGerais)
      .catch((err: any) => toast.error(err.message ?? 'Erro ao carregar dados da empresa.'))
      .finally(() => setIsLoadingDados(false));

    GerenciarEmpresaService.getDiasUteis()
      .then(setWorkingDays)
      .catch((err: any) => toast.error(err.message ?? 'Erro ao carregar dias de funcionamento.'))
      .finally(() => setIsLoadingDias(false));
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!arquivo) return;
    setPendingLogoFile(arquivo);
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setPendingLogoFile(null);

    try {
      const { width, height } = await readImageDimensions(croppedFile);
      if (width < LOGO_MIN_DIMENSION || height < LOGO_MIN_DIMENSION) {
        toast.error(`A área cortada deve ter no mínimo ${LOGO_MIN_DIMENSION}x${LOGO_MIN_DIMENSION}px.`);
        return;
      }
      if (width > LOGO_MAX_DIMENSION || height > LOGO_MAX_DIMENSION) {
        toast.error(`A área cortada deve ter no máximo ${LOGO_MAX_DIMENSION}x${LOGO_MAX_DIMENSION}px.`);
        return;
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao validar a imagem cortada.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const { caminhoRelativo } = await GerenciarEmpresaService.updateLogo(croppedFile);
      setDadosGerais(prev => prev ? { ...prev, pathLogo: caminhoRelativo } : prev);
      toast.success('Logo atualizada com sucesso!');
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao atualizar logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCropCancel = () => setPendingLogoFile(null);

  const handleDadosGeraisChange = (field: keyof AtualizarDadosGeraisDTO, value: string) => {
    setDadosGerais(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSalvarDadosGerais = async () => {
    if (!dadosGerais) return;
    setIsSavingDados(true);
    try {
      await GerenciarEmpresaService.atualizarDadosGerais({
        nomeEmpresa: dadosGerais.nomeEmpresa,
        ramoAtividade: dadosGerais.ramoAtividade,
        cnpj: dadosGerais.cnpj,
      });
      toast.success('Dados da empresa atualizados com sucesso!');
      setIsEditingDados(false);
      setDadosGeraisBackup(null);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao atualizar dados da empresa.');
    } finally {
      setIsSavingDados(false);
    }
  };

  const handleHabilitarEdicaoDados = () => {
    setDadosGeraisBackup(dadosGerais);
    setIsEditingDados(true);
  };

  const handleCancelarEdicaoDados = () => {
    if (dadosGeraisBackup) setDadosGerais(dadosGeraisBackup);
    setDadosGeraisBackup(null);
    setIsEditingDados(false);
  };

  const handleToggle = async (day: keyof DiasUteis) => {
    const prev = workingDays;
    const updated = { ...workingDays, [day]: !workingDays[day] };
    setWorkingDays(updated);
    setIsSaving(true);
    try {
      await GerenciarEmpresaService.updateDiasUteis(updated);
      toast.success('Dias de funcionamento atualizados!');
    } catch (err: any) {
      setWorkingDays(prev);
      toast.error(err.message ?? 'Erro ao atualizar dias de funcionamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeDays = Object.values(workingDays).filter(Boolean).length;
  const inactiveDays = 7 - activeDays;
  const weekendDays = DAY_CONFIG.filter(d => d.type === 'weekend' && workingDays[d.key]).length;

  const logoUrl = dadosGerais?.pathLogo ? getMidiaUrl(dadosGerais.pathLogo) : null;

  return (
    <div className="gerenciar-empresa-page">
      <div className="gerenciar-empresa-header">
        <div>
          <h1>Gerenciar Empresa</h1>
          <p className="gerenciar-empresa-header-subtitle">
            Consulte os dados da empresa e configure os dias de funcionamento.
          </p>
        </div>
      </div>

      <div className="ge-tab-nav">
        <button
          className={`ge-tab-button ${activeTab === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          <FaBuilding />
          <span className="ge-tab-text-full">Dados Gerais</span>
          <span className="ge-tab-text-short">Dados</span>
        </button>
        <button
          className={`ge-tab-button ${activeTab === 'funcionamento' ? 'active' : ''}`}
          onClick={() => setActiveTab('funcionamento')}
        >
          <FaCalendarCheck />
          <span className="ge-tab-text-full">Funcionamento</span>
          <span className="ge-tab-text-short">Dias</span>
        </button>
        <button
          className={`ge-tab-button ${activeTab === 'captura' ? 'active' : ''}`}
          onClick={() => setActiveTab('captura')}
        >
          <FaQrcode />
          <span className="ge-tab-text-full">Página de Captura</span>
          <span className="ge-tab-text-short">Captura</span>
        </button>
      </div>

      <div className="ge-tab-content">
        {activeTab === 'dados' && (
          <div className="ge-tab-pane">
            <div className="gerenciar-empresa-card">
              <div className="gerenciar-empresa-card-header">
                <div className="gerenciar-empresa-card-header-icon">
                  <FaBuilding />
                </div>
                <div className="gerenciar-empresa-card-header-text">
                  <h3>Dados da Empresa</h3>
                  <p>Informações gerais cadastradas para a sua empresa.</p>
                </div>
                {!isLoadingDados && !isEditingDados && (
                  <button
                    type="button"
                    className="button secondary dados-gerais-edit-toggle"
                    onClick={handleHabilitarEdicaoDados}
                  >
                    <FaPen />
                    Editar
                  </button>
                )}
              </div>

              {isLoadingDados ? (
                <div className="gerenciar-empresa-loading">Carregando dados...</div>
              ) : (
                <div className="dados-gerais-body">
                  <div className="logo-uploader">
                    <button
                      type="button"
                      className="logo-uploader-preview"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      aria-label="Alterar logo da empresa"
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo da empresa" />
                      ) : (
                        <FaBuilding className="logo-uploader-placeholder-icon" />
                      )}
                      <div className="logo-uploader-overlay">
                        <FaCamera />
                      </div>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      hidden
                      onChange={handleLogoChange}
                    />
                    <span className="logo-uploader-hint">
                      {isUploadingLogo
                        ? 'Enviando logo...'
                        : 'JPG, PNG ou WebP — até 5MB. Use formato horizontal ou quadrado.'}
                    </span>
                  </div>

                  <div className="dados-gerais-fields form-grid">
                    <div className="form-group">
                      <label htmlFor="nomeEmpresa">Nome da empresa</label>
                      <input
                        id="nomeEmpresa"
                        type="text"
                        value={dadosGerais?.nomeEmpresa || ''}
                        onChange={e => handleDadosGeraisChange('nomeEmpresa', e.target.value)}
                        disabled={!isEditingDados || isSavingDados}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ramoAtividade">Ramo de atividade</label>
                      <input
                        id="ramoAtividade"
                        type="text"
                        value={dadosGerais?.ramoAtividade || ''}
                        onChange={e => handleDadosGeraisChange('ramoAtividade', e.target.value)}
                        disabled={!isEditingDados || isSavingDados}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="cnpj">CNPJ</label>
                      <input
                        id="cnpj"
                        type="text"
                        value={dadosGerais?.cnpj || ''}
                        onChange={e => handleDadosGeraisChange('cnpj', e.target.value)}
                        disabled={!isEditingDados || isSavingDados}
                      />
                    </div>
                    {isEditingDados && (
                      <div className="form-group full-width dados-gerais-actions">
                        <button
                          type="button"
                          className="button secondary"
                          onClick={handleCancelarEdicaoDados}
                          disabled={isSavingDados}
                        >
                          <FaTimes />
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="button primary"
                          onClick={handleSalvarDadosGerais}
                          disabled={isSavingDados}
                        >
                          {isSavingDados ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'funcionamento' && (
          <div className="ge-tab-pane">
            <div className="gerenciar-empresa-summary">
              <div className="summary-card">
                <div className="summary-card-icon active">
                  <FaCheckCircle />
                </div>
                <div className="summary-card-info">
                  <span className="summary-card-value">{activeDays}</span>
                  <span className="summary-card-label">Dias ativos por semana</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-card-icon inactive">
                  <FaTimesCircle />
                </div>
                <div className="summary-card-info">
                  <span className="summary-card-value">{inactiveDays}</span>
                  <span className="summary-card-label">Dias sem operação</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-card-icon weekend">
                  <FaCalendarWeek />
                </div>
                <div className="summary-card-info">
                  <span className="summary-card-value">{weekendDays}</span>
                  <span className="summary-card-label">Fins de semana ativos</span>
                </div>
              </div>
            </div>

            <div className="gerenciar-empresa-card">
              <div className="gerenciar-empresa-card-header">
                <div className="gerenciar-empresa-card-header-icon">
                  <FaCalendarCheck />
                </div>
                <div className="gerenciar-empresa-card-header-text">
                  <h3>Dias de Funcionamento</h3>
                  <p>Ative ou desative cada dia da semana conforme a operação da empresa.</p>
                </div>
              </div>

              {isLoadingDias ? (
                <div className="gerenciar-empresa-loading">Carregando configurações...</div>
              ) : (
                <div className="working-days-calendar">
                  {DAY_CONFIG.map(day => {
                    const isActive = workingDays[day.key];
                    return (
                      <label
                        key={day.key}
                        className={`calendar-day-cell ${isActive ? 'active' : 'inactive'}`}
                        title={day.label}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => handleToggle(day.key)}
                          disabled={isSaving}
                          aria-label={`Ativar ${day.label}`}
                        />
                        <span className="calendar-day-abbr">{day.abbr}</span>
                        <span className="calendar-day-check">
                          {isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'captura' && (
          <div className="ge-tab-pane">
            <LandingPageConfigTab />
          </div>
        )}
      </div>

      {pendingLogoFile && (
        <LogoCropModal
          file={pendingLogoFile}
          minAspect={LOGO_MIN_ASPECT_RATIO}
          maxAspect={LOGO_MAX_ASPECT_RATIO}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default GerenciarEmpresaPage;
