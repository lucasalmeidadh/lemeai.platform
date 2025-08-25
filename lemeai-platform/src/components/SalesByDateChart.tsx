import React from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer,YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20, right: 30, left: 20, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="leads" stackId="a" fill="#8884d8" name="Novos Leads" />
        <Bar dataKey="sales" stackId="a" fill="#82ca9d" name="Vendas Concluídas" />
      </BarChart>
    </ResponsiveContainer>
    
  );
};

export default SalesByDateChart;