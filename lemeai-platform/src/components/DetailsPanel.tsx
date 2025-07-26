// ARQUIVO: src/components/DetailsPanel.tsx

import React, { useState } from 'react';
// Corrigido: Importando seu próprio CSS
import './DetailsPanel.css'; 
// Corrigido: Removidos ícones que não estavam sendo usados
import { FaTimes, FaSave } from 'react-icons/fa'; 

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
        <div className="contact-summary">
          <div className="details-avatar">
            {contactName.charAt(0).toUpperCase()}
          </div>
          <h4>{contactName}</h4>
          <p>noronhaartur@gmail.com</p>
        </div>
        
        <div className="deal-status-section">
          <div className="form-group">
            <label htmlFor="deal-status">Status da Negociação</label>
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
            <label htmlFor="observations">Observações</label>
            <textarea 
              id="observations" 
              className="observations-textarea" 
              rows={5}
              placeholder="Adicione uma anotação sobre o cliente..."
            ></textarea>
          </div>

          <button className="save-button">
            <FaSave />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DetailsPanel;