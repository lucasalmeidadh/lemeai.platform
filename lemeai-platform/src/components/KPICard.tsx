import React from 'react';
import './KPICard.css';

// Definimos os tipos das propriedades que nosso cartão receberá
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode; // O ícone será um componente React
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