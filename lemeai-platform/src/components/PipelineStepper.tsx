import React from 'react';
import './PipelineStepper.css';

interface PipelineStepperProps {
  currentStatusId?: number;
}

const FUNNEL_STEPS = [
  { id: 1, label: 'Atendimento IA' },
  { id: 8, label: 'IA Encerrada' },
  { id: 2, label: 'Em Qualificação' },
  { id: 4, label: 'Proposta Enviada' },
  { id: 5, label: 'Em Negociação' },
  { id: 3, label: 'Ganho' }
];

const PipelineStepper: React.FC<PipelineStepperProps> = ({ currentStatusId }) => {
  if (!currentStatusId) return null;

  const currentIndex = FUNNEL_STEPS.findIndex(step => step.id === currentStatusId);
  const isWon = currentStatusId === 3;
  const isLost = currentStatusId === 6;

  // Determine if a step is completed or active
  const getStepStatus = (index: number) => {
    if (isWon) return 'completed won';
    
    if (currentIndex > index) return 'completed';
    if (currentIndex === index) return 'active';
    return 'upcoming';
  };

  return (
    <div className="pipeline-stepper-container">
      {FUNNEL_STEPS.map((step, index) => {
        const status = getStepStatus(index);
        
        return (
          <div key={step.id} className={`pipeline-step ${status}`}>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
      
      {/* Terminal States appended as final step */}
      {isLost && (
        <div className="pipeline-step active lost terminal">
          <span className="step-label">Venda Perdida</span>
        </div>
      )}
    </div>
  );
};

export default PipelineStepper;
