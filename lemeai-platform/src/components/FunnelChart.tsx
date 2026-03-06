import React from 'react';
import './FunnelChart.css';

export interface FunnelData {
    id: string;
    name: string;
    value: number;
    color: string;
}

interface FunnelChartProps {
    data: FunnelData[];
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="funnel-container">
            {data.map((item) => {
                // Calculate percentage, min 2% just to show a sliver of the bar if it's 0
                const percentage = Math.max((item.value / maxValue) * 100, 2);

                return (
                    <div className="funnel-row" key={item.id}>
                        <div className="funnel-label">{item.name}</div>
                        <div className="funnel-track">
                            <div
                                className="funnel-fill"
                                style={{ width: `${percentage}%`, background: item.color }}
                            />
                        </div>
                        <div className="funnel-value">{item.value}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default FunnelChart;
