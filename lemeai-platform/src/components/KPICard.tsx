import React from 'react';
import './KPICard.css';

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-icon-wrapper">
        {icon}
      </div>
      <div className="kpi-content">
        <span className="kpi-title">{title}</span>
        <span className="kpi-value">{value}</span>
      </div>
    </div>
  );
};

export default KPICard;