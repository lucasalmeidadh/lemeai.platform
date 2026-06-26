import React from 'react';
import { FaBuilding, FaUser, FaPhone, FaEnvelope, FaBookmark, FaMapMarkerAlt } from 'react-icons/fa';
import { getMidiaUrl } from '../services/GerenciarEmpresaService';
import './LandingPagePreview.css';

interface LandingPagePreviewProps {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  logoPath: string | null;
  segmentsList: string[];
  promoActive: boolean;
  promoCode: string;
  promoText: string;
  branchName?: string;
}

const LandingPagePreview: React.FC<LandingPagePreviewProps> = React.memo(function LandingPagePreview({
  primaryColor,
  bgColor,
  textColor,
  logoPath,
  segmentsList,
  promoActive,
  promoCode,
  promoText,
  branchName = 'Sua Empresa',
}) {
  const themeStyles = {
    '--preview-primary': primaryColor || '#0a5c5a',
    '--preview-bg': bgColor || '#0d0f12',
    '--preview-text': textColor || '#ffffff',
  } as React.CSSProperties;

  const firstSegment = segmentsList.length > 0 ? segmentsList[0] : 'Selecione...';

  return (
    <div className="lp-preview-viewport">
      <div className="lp-preview-scroll" style={themeStyles}>
        <div className="lp-preview-page">
          <div className="lp-preview-card">
            <div className="lp-preview-header">
              {logoPath ? (
                <img src={getMidiaUrl(logoPath)} alt="Logo" className="lp-preview-logo" />
              ) : (
                <div
                  className="lp-preview-avatar"
                  style={{ backgroundColor: primaryColor }}
                >
                  <FaBuilding />
                </div>
              )}
              <div className="lp-preview-company-name">{branchName}</div>
              <div className="lp-preview-tagline">
                Cadastre-se rapidamente para fazer parte da nossa base de clientes!
              </div>
            </div>

            <div className="lp-preview-form">
              <div className="lp-preview-field">
                <label><FaUser /> Nome Completo</label>
                <div className="lp-preview-input">Digite seu nome</div>
              </div>

              <div className="lp-preview-row">
                <div className="lp-preview-field">
                  <label><FaPhone /> WhatsApp / Celular</label>
                  <div className="lp-preview-input">(00) 00000-0000</div>
                </div>
                <div className="lp-preview-field">
                  <label><FaEnvelope /> E-mail (Opcional)</label>
                  <div className="lp-preview-input">exemplo@email.com</div>
                </div>
              </div>

              <div className="lp-preview-field">
                <label><FaBookmark /> Como conheceu a {branchName}?</label>
                <div className="lp-preview-input">{firstSegment}</div>
              </div>

              <div className="lp-preview-address-divider">
                <FaMapMarkerAlt /> Cidade
              </div>

              <div className="lp-preview-field">
                <label>Cidade onde reside</label>
                <div className="lp-preview-input">Digite sua cidade</div>
              </div>

              <div
                className="lp-preview-button"
                style={{ backgroundColor: primaryColor }}
              >
                Finalizar Cadastro
              </div>
            </div>

            {promoActive && promoCode && (
              <div className="lp-preview-coupon">
                <div className="lp-preview-coupon-inner">
                  <div className="lp-preview-coupon-label" style={{ color: primaryColor }}>
                    SEU CUPOM DE DESCONTO
                  </div>
                  <div className="lp-preview-coupon-code" style={{ color: primaryColor }}>
                    {promoCode}
                  </div>
                  {promoText && (
                    <div className="lp-preview-coupon-text">{promoText}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default LandingPagePreview;
