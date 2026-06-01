import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FunnelChart.css';

export interface FunnelData {
    id: string;
    name: string;
    value: number;
    color: string;
}

interface FunnelLead {
    id: number;
    stageId: string;
    temperature: 'hot' | 'warm' | 'cold' | 'new';
    contactName?: string;
    dealId?: number;
}

interface FunnelChartProps {
    data: FunnelData[];
    leads?: FunnelLead[];
}

// Pipeline order (outermost → innermost)
const STAGE_ORDER = ['ai_service', 'intro', 'proposal', 'qualified', 'closed'] as const;

const STAGE_META: Record<string, { name: string; dotColor: string }> = {
    ai_service: { name: 'Atendimento IA',   dotColor: 'rgba(147,197,253,1)' },
    intro:       { name: 'Em Qualificação',  dotColor: 'rgba(96,165,250,1)'  },
    proposal:    { name: 'Proposta Enviada', dotColor: 'rgba(59,130,246,1)'  },
    qualified:   { name: 'Em Negociação',    dotColor: 'rgba(37,99,235,1)'   },
    closed:      { name: 'Venda Fechada',    dotColor: 'rgba(0,163,255,1)'   },
};

const FunnelChart: React.FC<FunnelChartProps> = ({ data, leads = [] }) => {
    const navigate = useNavigate();
    const [hoveredStage, setHoveredStage] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
    // Seed-based random generator to keep dot positions stable
    const getStableCoordinates = (stageIndex: number, dotIndex: number, rMin: number, rMax: number) => {
        let seed = stageIndex * 1000 + dotIndex * 17;

        const nextRand = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        const radius = rMin + nextRand() * (rMax - rMin);
        const angle = nextRand() * 2 * Math.PI;

        return {
            x: 50 + radius * Math.cos(angle),
            y: 50 + radius * Math.sin(angle),
        };
    };

    // Rings: innermost (index 0 = closed) → outermost (index 4 = ai_service)
    const ringConfig = useMemo(() => {
        const reversedOrder = [...STAGE_ORDER].reverse(); // closed → ai_service

        return reversedOrder.map((id, index) => {
            const stageData = data.find(d => d.id === id);
            const rMin = index === 0 ? 3 : index * 9;
            const rMax = (index + 1) * 9;

            return {
                id,
                name: stageData?.name || STAGE_META[id]?.name || id,
                value: stageData?.value || 0,
                rMin,
                rMax,
                index,
            };
        });
    }, [data]);

    const leadsDots = useMemo(() => {
        const dots: Array<{
            id: string; x: number; y: number; name: string;
            temperature: 'hot' | 'warm' | 'cold' | 'new';
            contactName?: string; dealId?: number;
        }> = [];

        const stageLeads: Record<string, FunnelLead[]> = {};
        leads.forEach(lead => {
            if (!stageLeads[lead.stageId]) stageLeads[lead.stageId] = [];
            stageLeads[lead.stageId].push(lead);
        });

        ringConfig.forEach(ring => {
            const list = leads.length > 0 ? (stageLeads[ring.id] || []) : Array(Math.min(ring.value, 20)).fill(null);
            const count = Math.min(list.length, 20);

            for (let i = 0; i < count; i++) {
                const lead = list[i] as FunnelLead | null;
                const coords = getStableCoordinates(ring.index, i, ring.rMin, ring.rMax - 1);
                dots.push({
                    id: `${ring.id}-dot-${lead?.id ?? i}`,
                    x: coords.x,
                    y: coords.y,
                    name: ring.name,
                    temperature: lead?.temperature ?? 'new',
                    contactName: lead?.contactName,
                    dealId: lead?.dealId,
                });
            }
        });

        return dots;
    }, [ringConfig, leads]);

    // Legend in pipeline order (outermost → innermost = left → right)
    const legendItems = useMemo(() =>
        STAGE_ORDER.map(id => {
            const ring = ringConfig.find(r => r.id === id);
            return {
                id,
                name: STAGE_META[id].name,
                dotColor: STAGE_META[id].dotColor,
                value: ring?.value ?? 0,
            };
        }),
    [ringConfig]);

    return (
        <div className="concentric-funnel-wrapper">
            {/* Legend cards — pipeline order left to right */}
            <div className="funnel-legend-row">
                {legendItems.map(item => (
                    <div
                        key={item.id}
                        className={`funnel-legend-item funnel-legend-${item.id}${hoveredStage === item.id ? ' legend-active' : ''}`}
                        onMouseEnter={() => setHoveredStage(item.id)}
                        onMouseLeave={() => setHoveredStage(null)}
                    >
                        <span className="funnel-legend-dot" style={{ background: item.dotColor }} />
                        <div className="funnel-legend-text">
                            <span className="funnel-legend-name">{item.name}</span>
                            <span className="funnel-legend-count">
                                {item.value} {item.value === 1 ? 'lead' : 'leads'}
                                {item.id === 'closed' && ' ✓'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Circle chart */}
            <div className="funnel-circle-wrap">
                <div className="radar-board">
                    <div className="radar-crosshair-h" />
                    <div className="radar-crosshair-v" />

                    {[...ringConfig].reverse().map(ring => {
                        const size = ring.rMax * 2;
                        const isHovered = hoveredStage === ring.id;
                        return (
                            <div
                                key={ring.id}
                                className={`radar-ring ring-${ring.id}${isHovered ? ' ring-highlighted' : ''}`}
                                style={{ width: `${size}%`, height: `${size}%`, zIndex: isHovered ? 15 : 10 - ring.index }}
                                title={`${ring.name}: ${ring.value} leads`}
                            />
                        );
                    })}

                    {leadsDots.map(dot => {
                        const tempLabel = dot.temperature === 'hot' ? 'Quente' : dot.temperature === 'warm' ? 'Morno' : dot.temperature === 'cold' ? 'Frio' : 'Novo';
                        const tooltipText = dot.contactName ? `${dot.contactName} · ${dot.name} (${tempLabel})` : `${dot.name} (${tempLabel})`;
                        return (
                            <div
                                key={dot.id}
                                className={`lead-dot lead-temp-${dot.temperature}${dot.dealId ? ' lead-dot-clickable' : ''}`}
                                style={{ left: `${dot.x}%`, top: `${dot.y}%`, zIndex: 12 }}
                                onMouseEnter={e => {
                                    const wrap = (e.currentTarget.closest('.funnel-circle-wrap') as HTMLElement)?.getBoundingClientRect();
                                    const dotRect = e.currentTarget.getBoundingClientRect();
                                    if (wrap) {
                                        setTooltip({
                                            x: dotRect.left - wrap.left + dotRect.width / 2,
                                            y: dotRect.top - wrap.top,
                                            content: tooltipText,
                                        });
                                    }
                                }}
                                onMouseLeave={() => setTooltip(null)}
                                onClick={() => dot.dealId && navigate(`/pipeline/deal/${dot.dealId}`)}
                            />
                        );
                    })}

                </div>

                {tooltip && (
                    <div
                        className="lead-dot-tooltip"
                        style={{ left: tooltip.x, top: tooltip.y }}
                    >
                        {tooltip.content}
                    </div>
                )}
            </div>

        </div>
    );
};

export default FunnelChart;
