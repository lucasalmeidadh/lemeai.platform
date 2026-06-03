import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './MonthPicker.css';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange }) => {
  const [yearStr, monthStr] = value.split('-');
  const selectedYear = parseInt(yearStr);
  const selectedMonth = parseInt(monthStr) - 1; // 0-indexed

  const setYear = (delta: number) => {
    onChange(`${selectedYear + delta}-${monthStr}`);
  };

  const setMonth = (index: number) => {
    onChange(`${selectedYear}-${String(index + 1).padStart(2, '0')}`);
  };

  return (
    <div className="month-picker">
      <div className="month-picker-year">
        <button className="year-nav-btn" onClick={() => setYear(-1)}>
          <FaChevronLeft />
        </button>
        <span className="year-label">{selectedYear}</span>
        <button className="year-nav-btn" onClick={() => setYear(1)}>
          <FaChevronRight />
        </button>
      </div>

      <div className="month-picker-months">
        {MONTHS.map((m, i) => (
          <button
            key={i}
            className={`month-pill ${i === selectedMonth ? 'active' : ''}`}
            onClick={() => setMonth(i)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonthPicker;
