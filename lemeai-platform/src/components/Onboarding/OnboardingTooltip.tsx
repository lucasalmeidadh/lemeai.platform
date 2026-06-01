import React, { useEffect, useState, useRef } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

const OnboardingTooltip: React.FC = () => {
  const { isActive, currentStep, steps, nextStep, skipOnboarding, prevStep } = useOnboarding();
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (!isActive || !step) return;

    const updatePosition = () => {
      const target = document.getElementById(step.targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        const tooltipWidth = 300; // Estimação inicial
        
        // Lógica simplificada de posicionamento (melhorar futuramente com bibliotecas como Popper)
        let top = rect.bottom + 15 + window.scrollY;
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;

        // Ajuste básico para não sair da tela
        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 10;

        setCoords({ top, left });
        
        // Scroll até o elemento
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight temporário
        target.classList.add('onboarding-highlight');
        return () => target.classList.remove('onboarding-highlight');
      } else {
        setCoords(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isActive, currentStep, steps, step]);

  if (!isActive || !step || !coords) return null;

  return (
    <>
      <div className="onboarding-tour-overlay" />
      <div 
        ref={tooltipRef}
        className="onboarding-tooltip"
        style={{ 
          top: coords.top, 
          left: coords.left,
          position: 'absolute',
          zIndex: 9999
        }}
      >
        <div className="tooltip-header">
          <span>Passo {currentStep + 1} de {steps.length}</span>
          <button className="skip-link" onClick={skipOnboarding}>Pular</button>
        </div>
        
        <h3>{step.title}</h3>
        <p>{step.content}</p>
        
        <div className="tooltip-footer">
          {currentStep > 0 && (
            <button className="btn-back" onClick={prevStep}>Anterior</button>
          )}
          <button className="btn-next" onClick={nextStep}>
            {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
          </button>
        </div>
        
        <div className="tooltip-arrow" />
      </div>
    </>
  );
};

export default OnboardingTooltip;
