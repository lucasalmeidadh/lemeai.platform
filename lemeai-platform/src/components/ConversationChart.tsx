
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
    date: string;
    conversations: number;
}

interface ConversationChartProps {
    data: ChartData[];
}

const ConversationChart: React.FC<ConversationChartProps> = ({ data }) => {
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6c757d', fontSize: 12 }}
                    dy={10}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6c757d', fontSize: 12 }}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: 'none',
                        padding: '10px'
                    }}
                />
                <Bar
                    dataKey="conversations"
                    name="Conversas"
                    fill="#005f73"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default ConversationChart;
