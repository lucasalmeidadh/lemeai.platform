import React from 'react';
import CustomSelect from './CustomSelect';
import './CompactMonthPicker.css';

interface CompactMonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
}

const MONTH_OPTIONS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const CompactMonthPicker: React.FC<CompactMonthPickerProps> = ({ value, onChange }) => {
  const [yearStr, monthStr] = value.split('-');

  // Gera opções de ano (2 anos anteriores e 2 anos seguintes)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = String(currentYear - 2 + i);
    return { value: y, label: y };
  });

  const handleMonthChange = (newMonth: string) => {
    onChange(`${yearStr}-${newMonth}`);
  };

  const handleYearChange = (newYear: string) => {
    onChange(`${newYear}-${monthStr}`);
  };

  return (
    <div className="compact-month-picker">
      <div style={{ width: '150px' }}>
        <CustomSelect
          options={MONTH_OPTIONS}
          value={monthStr}
          onChange={handleMonthChange}
          placeholder="Mês"
        />
      </div>
      <div style={{ width: '120px' }}>
        <CustomSelect
          options={yearOptions}
          value={yearStr}
          onChange={handleYearChange}
          placeholder="Ano"
        />
      </div>
    </div>
  );
};

export default CompactMonthPicker;
