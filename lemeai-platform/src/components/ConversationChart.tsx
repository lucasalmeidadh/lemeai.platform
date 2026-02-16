import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

interface ChartData {
    date: string;
    conversations: number;
}

interface ConversationChartProps {
    data: ChartData[];
}

const ConversationChart: React.FC<ConversationChartProps> = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Chart colors based on theme
    const axisColor = isDark ? '#adb5bd' : '#6c757d';
    const gridColor = isDark ? '#343a40' : '#e9ecef';
    const barColor = '#005f73'; // Brand color, works on both but could be lighter on dark
    const tooltipBg = isDark ? '#1e1e1e' : '#fff';
    const tooltipColor = isDark ? '#e9ecef' : '#000';
    const tooltipBorder = isDark ? '1px solid #343a40' : 'none';

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart
                data={data}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: axisColor, fontSize: 12 }}
                    dy={10}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: axisColor, fontSize: 12 }}
                />
                <Tooltip
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                    contentStyle={{
                        backgroundColor: tooltipBg,
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: tooltipBorder,
                        padding: '10px',
                        color: tooltipColor
                    }}
                    itemStyle={{ color: tooltipColor }}
                    labelStyle={{ color: tooltipColor }}
                />
                <Bar
                    dataKey="conversations"
                    name="Conversas"
                    fill={barColor}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default ConversationChart;
