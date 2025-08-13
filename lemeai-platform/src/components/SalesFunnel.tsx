import React from 'react';
import { FunnelChart, Tooltip, Funnel, LabelList, Cell } from 'recharts';

interface FunnelData {
  name: string;
  value: number;
}

interface SalesFunnelProps {
  data: FunnelData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SalesFunnel: React.FC<SalesFunnelProps> = ({ data }) => {
  return (
    <FunnelChart width={730} height={250}>
      <Tooltip />
      <Funnel
        dataKey="value"
        data={data}
        isAnimationActive
      >
        <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
        {data.map((_entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Funnel>
    </FunnelChart>
  );
};

export default SalesFunnel;