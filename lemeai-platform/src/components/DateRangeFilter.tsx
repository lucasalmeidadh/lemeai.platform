
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
    return (
        <div className="date-filter-container">
            <DatePicker
                selected={startDate}
                onChange={(date) => onChangeStartDate(date)}
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
                onChange={(date) => onChangeEndDate(date)}
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
    );
};

export default DateRangeFilter;
