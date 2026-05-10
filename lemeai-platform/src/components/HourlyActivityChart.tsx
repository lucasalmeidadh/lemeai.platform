import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

interface HourlyData {
    hour: string;
    count: number;
}

interface HourlyActivityChartProps {
    data: HourlyData[];
}

const HourlyActivityChart: React.FC<HourlyActivityChartProps> = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Cores baseadas no tema para manter consistência
    const axisColor = isDark ? '#adb5bd' : '#6c757d';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const tooltipBg = isDark ? '#1e1e1e' : '#fff';
    const tooltipColor = isDark ? '#e9ecef' : '#000';

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--petroleum-blue)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--petroleum-blue)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: axisColor, fontSize: 11 }}
                    interval={2} // Mostra as horas de 2 em 2 para não poluir
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: axisColor, fontSize: 11 }}
                />
                <Tooltip 
                    contentStyle={{
                        backgroundColor: tooltipBg,
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: isDark ? '1px solid #343a40' : 'none',
                        color: tooltipColor,
                        fontSize: '12px'
                    }}
                />
                <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="Conversas"
                    stroke="var(--petroleum-blue)" 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={3}
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default HourlyActivityChart;
