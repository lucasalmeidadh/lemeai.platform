// ARQUIVO: src/components/DetailsPanel.tsx

import React, { useState } from 'react';
import './DetailsPanel.css';
// Adicionando novos ícones para a repaginada
import { FaTimes, FaSave, FaPhoneAlt, FaTag, FaRegStickyNote } from 'react-icons/fa';

interface DetailsPanelProps {
  contactName: string;
  onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ contactName, onClose }) => {
  const [status, setStatus] = useState('negotiating');

  return (
    <aside className="details-panel">
      <header className="details-header">
        <h3>Detalhes do Contato</h3>
        <button onClick={onClose} className="close-button">
          <FaTimes />
        </button>
      </header>

      <div className="details-content">
        {/* Seção de Resumo do Contato */}
        <div className="contact-summary">
          <div className="details-avatar">
            {contactName.charAt(0).toUpperCase()}
          </div>
          <h4 className="summary-name">{contactName}</h4>
          {/* Trocamos o e-mail pelo telefone com um ícone */}
          <div className="summary-phone">
            <FaPhoneAlt className="phone-icon" />
            <span>(11) 98765-4321</span>
          </div>
        </div>
        
        {/* Seção do Formulário, agora com um fundo para destaque */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="deal-status">
              <FaTag className="label-icon" />
              Status da Negociação
            </label>
            <select 
              id="deal-status" 
              className="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="not-started">Não iniciado</option>
              <option value="negotiating">Em negociação</option>
              <option value="deal-won">Venda Fechada</option>
              <option value="deal-lost">Venda Perdida</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="observations">
              <FaRegStickyNote className="label-icon" />
              Observações
            </label>
            <textarea 
              id="observations" 
              className="observations-textarea" 
              rows={5}
              placeholder="Adicione uma anotação sobre o cliente..."
            ></textarea>
          </div>
        </div>
      </div>

      {/* Footer do Painel com o Botão Salvar */}
      <div className="details-footer">
        <button className="save-button">
          <FaSave />
          <span>Salvar Alterações</span>
        </button>
      </div>
    </aside>
  );
};

export default DetailsPanel;