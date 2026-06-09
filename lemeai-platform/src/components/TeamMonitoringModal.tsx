import React from 'react';
import { FaTimes, FaUsers } from 'react-icons/fa';
import './UserFormModal.css';

export interface TeamMember {
  id: number;
  name: string;
  salesValue: number;
  calls: number;
  valueGoal: number;
  valueProgress: number;
}

interface TeamMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  members: TeamMember[];
  formatCurrency: (val: number) => string;
  getProgressBarColorClass: (pct: number) => string;
}

const TeamMonitoringModal: React.FC<TeamMonitoringModalProps> = ({
  isOpen, onClose, teamName, members, formatCurrency, getProgressBarColorClass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content team-monitoring-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2><FaUsers style={{ marginRight: 8, color: 'var(--petroleum-blue)' }} />{teamName}</h2>
          <button onClick={onClose} className="close-modal-button"><FaTimes /></button>
        </header>

        <div style={{ padding: '24px 30px 30px' }}>
          {members.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px 0' }}>
              Nenhum membro encontrado para esta equipe.
            </p>
          ) : (
            <table className="management-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Faturamento</th>
                  <th>Ligações</th>
                  <th>Meta Mensal</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: 600 }}>{member.name}</td>
                    <td>{formatCurrency(member.salesValue)}</td>
                    <td>{member.calls}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                          <div
                            className={`progress-track-fill ${getProgressBarColorClass(member.valueProgress)}`}
                            style={{ width: `${Math.min(member.valueProgress, 100)}%`, height: '100%', borderRadius: 4 }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, minWidth: 36 }}>
                          {Math.round(member.valueProgress)}%
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        Meta: {formatCurrency(member.valueGoal)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMonitoringModal;
