import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { FaCopy, FaDownload, FaSync, FaSave, FaImage, FaTrash } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import GerenciarEmpresaService, { getMidiaUrl } from '../services/GerenciarEmpresaService';
import './LandingPageConfigTab.css';

const LandingPageConfigTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState('');
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#0a5c5a');
  const [bgColor, setBgColor] = useState('#0d0f12');
  const [textColor, setTextColor] = useState('#ffffff');
  const [promoCode, setPromoCode] = useState('');
  const [promoText, setPromoText] = useState('');
  const [promoActive, setPromoActive] = useState(false);
  const [segmentsText, setSegmentsText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await GerenciarEmpresaService.getLandingPageConfig();
      setToken(data.publicPageToken || '');
      setLogoPath(data.publicPageLogoPath || null);
      setPrimaryColor(data.publicPagePrimaryColor || '#0a5c5a');
      setBgColor(data.publicPageBackgroundColor || '#0d0f12');
      setTextColor(data.publicPageTextColor || '#ffffff');
      setPromoCode(data.promoCode || '');
      setPromoText(data.promoText || '');
      setPromoActive(data.promoActive || false);
      setSegmentsText(data.configuredSegments || '');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar configurações da página pública.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await GerenciarEmpresaService.updateLandingPageConfig({
        publicPagePrimaryColor: primaryColor,
        publicPageBackgroundColor: bgColor,
        publicPageTextColor: textColor,
        promoCode,
        promoText,
        promoActive,
        configuredSegments: segmentsText
      });
      toast.success('Configurações salvas com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateNewToken = async () => {
    if (!window.confirm('Tem certeza que deseja gerar um novo link público? O QR Code e link antigos deixarão de funcionar.')) {
      return;
    }
    try {
      const data = await GerenciarEmpresaService.generateLandingPageToken();
      setToken(data.publicPageToken);
      toast.success('Novo link público gerado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar novo link.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    const toastId = toast.loading('Enviando logo...');
    try {
      const result = await GerenciarEmpresaService.updateLandingPageLogo(file);
      setLogoPath(result.caminhoRelativo);
      toast.success('Logo atualizada com sucesso!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer upload da logo.', { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, 1000, 1000);
        context.drawImage(image, 50, 50, 900, 900);

        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `qrcode_captura_${token.substring(0, 6)}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  if (loading) {
    return <div className="landing-page-config-loading">Carregando configurações da página de captura...</div>;
  }

  const publicUrl = `${window.location.origin}/p/${token}`;

  return (
    <div className="landing-page-config-container">
      <div className="config-grid">
        <div className="config-form-section">
          <h3>Visual da Página</h3>
          <p className="section-description">Ajuste o visual da página pública onde seus clientes farão o cadastro.</p>

          <div className="logo-section-wrapper">
            <label>Logo da Página de Captura</label>
            <div className="logo-flex-container">
              <div className="logo-preview-box">
                {logoPath ? (
                  <img src={getMidiaUrl(logoPath)} alt="Logo Página de Captura" />
                ) : (
                  <div className="logo-placeholder">Logo Principal ou Sem Logo</div>
                )}
              </div>
              <div className="logo-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaImage /> Escolher Logo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleLogoUpload}
                />
                <p className="logo-hint">Deixe vazio para herdar a logo principal da empresa.</p>
              </div>
            </div>
          </div>

          <div className="colors-grid">
            <div className="form-group">
              <label>Cor Primária (Tema)</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  maxLength={7}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Cor de Fundo</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  maxLength={7}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Cor do Texto</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div className="form-group segments-group">
            <label htmlFor="segments-input">Segmentos para Seleção (Separados por vírgula)</label>
            <input
              id="segments-input"
              type="text"
              placeholder="Ex: Varejo, Tecnologia, Vestuário, Alimentos"
              value={segmentsText}
              onChange={(e) => setSegmentsText(e.target.value)}
            />
            <p className="input-hint">Estes segmentos aparecerão como um dropdown para o cliente escolher na página.</p>
          </div>

          <hr className="divider" />

          <h3>Configuração de Cupom</h3>
          <p className="section-description">Defina o prêmio ou incentivo para quem realizar o cadastro completo na loja.</p>

          <div className="form-group checkbox-group">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={promoActive}
                onChange={(e) => setPromoActive(e.target.checked)}
              />
              <span className="slider"></span>
              Ativar exibição de cupom / desconto
            </label>
          </div>

          {promoActive && (
            <div className="promo-fields fade-in">
              <div className="form-group">
                <label htmlFor="promo-code-input">Código do Cupom</label>
                <input
                  id="promo-code-input"
                  type="text"
                  placeholder="Ex: CUPOM5"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="promo-text-input">Texto de Instruções do Cupom</label>
                <textarea
                  id="promo-text-input"
                  placeholder="Ex: Apresente este código no caixa para receber 5% de desconto na primeira compra."
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="form-actions-bar">
            <button
              type="button"
              className="button primary"
              onClick={handleSave}
              disabled={saving}
            >
              <FaSave /> {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>

        <div className="config-qr-section">
          <div className="qr-card">
            <h3>QR Code & Link Público</h3>
            <p className="section-description text-center">Disponibilize este QR Code na sua loja física.</p>

            <div className="qr-display-area">
              <div ref={qrRef} className="qr-wrapper">
                <QRCodeSVG
                  value={publicUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <button
                type="button"
                className="button secondary qr-download-btn"
                onClick={handleDownloadQR}
              >
                <FaDownload /> Baixar QR Code (PNG)
              </button>
            </div>

            <div className="url-copy-box">
              <input type="text" value={publicUrl} readOnly />
              <button type="button" className="button icon-btn" onClick={handleCopyLink} title="Copiar Link">
                <FaCopy />
              </button>
            </div>

            <div className="regenerate-token-wrapper">
              <button
                type="button"
                className="button danger-flat btn-sm"
                onClick={handleGenerateNewToken}
              >
                <FaSync /> Gerar Novo Link Público
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageConfigTab;
