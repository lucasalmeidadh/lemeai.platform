
import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './DateRangeFilter.css';

// Register locale for strict type checking
// @ts-ignore
registerLocale('pt-BR', ptBR);

interface DateRangeFilterProps {
    startDate: Date | null;
    endDate: Date | null;
    onChangeStartDate: (date: Date | null) => void;
    onChangeEndDate: (date: Date | null) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
    startDate,
    endDate,
    onChangeStartDate,
    onChangeEndDate
}) => {
    const handlePresetClick = (daysBack: number) => {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - daysBack);
        onChangeStartDate(pastDate);
        onChangeEndDate(today);
    };

    const isPresetActive = (daysBack: number) => {
        if (!startDate || !endDate) return false;

        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - daysBack);

        // Simple date comparison ignoring time
        return startDate.toDateString() === pastDate.toDateString() &&
            endDate.toDateString() === today.toDateString();
    };

    return (
        <div className="date-filter-wrapper">
            <div className="date-presets">
                <button
                    className={`preset-btn ${isPresetActive(7) ? 'active' : ''}`}
                    onClick={() => handlePresetClick(7)}
                >
                    7 dias
                </button>
                <button
                    className={`preset-btn ${isPresetActive(15) ? 'active' : ''}`}
                    onClick={() => handlePresetClick(15)}
                >
                    15 dias
                </button>
                <button
                    className={`preset-btn ${isPresetActive(30) ? 'active' : ''}`}
                    onClick={() => handlePresetClick(30)}
                >
                    30 dias
                </button>
            </div>
            <div className="date-filter-container">
                <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => onChangeStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="DD/MM/AAAA"
                    dateFormat="dd/MM/yyyy"
                    className="date-input-clean"
                    locale="pt-BR"
                    isClearable
                    showPopperArrow={false}
                />
                <span className="date-separator">até</span>
                <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => onChangeEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || undefined}
                    placeholderText="DD/MM/AAAA"
                    dateFormat="dd/MM/yyyy"
                    className="date-input-clean"
                    locale="pt-BR"
                    isClearable
                    showPopperArrow={false}
                />
            </div>
        </div>
    );
};

export default DateRangeFilter;
