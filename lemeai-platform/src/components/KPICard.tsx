import React from 'react';
import './KPICard.css';

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, isActive, onClick }) => {
  return (
    <div
      className={`kpi-card ${isActive ? 'active' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="kpi-data-content">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
      </div>
      <div className="kpi-icon-wrapper">
        {icon}
      </div>
    </div>
  );
};

export default KPICard;