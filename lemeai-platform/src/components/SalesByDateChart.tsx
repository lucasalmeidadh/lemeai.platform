import React from 'react';
import { AreaChart, Area, XAxis, ResponsiveContainer, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ChartData {
  date: string;
  sales: number;
  leads: number;
}

interface SalesByDateChartProps {
  data: ChartData[];
}

const SalesByDateChart: React.FC<SalesByDateChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={data}
        margin={{
          top: 10, right: 30, left: 0, bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFF',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="#8884d8"
          fillOpacity={1}
          fill="url(#colorLeads)"
          name="Novos Leads"
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="#82ca9d"
          fillOpacity={1}
          fill="url(#colorSales)"
          name="Vendas Concluídas"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SalesByDateChart;