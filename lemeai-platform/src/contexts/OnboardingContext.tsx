import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingContextType {
  isActive: boolean;
  isModalOpen: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  setSteps: (steps: OnboardingStep[]) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [hasCompleted, setHasCompleted] = useState(() => {
    return localStorage.getItem('lemeai_onboarding_completed') === 'true';
  });

  useEffect(() => {
    // Simulando verificação inicial (Mock da API de ME futuramente)
    if (!hasCompleted) {
      setIsModalOpen(true);
    }
  }, [hasCompleted]);

  const startOnboarding = () => {
    setIsModalOpen(false);
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipOnboarding = () => {
    setIsActive(false);
    setIsModalOpen(false);
    // Mesmo pulando, marcamos como visto para não incomodar de novo (pode ser ajustado)
    completeOnboarding();
  };

  const completeOnboarding = () => {
    setIsActive(false);
    setIsModalOpen(false);
    setHasCompleted(true);
    localStorage.setItem('lemeai_onboarding_completed', 'true');
    console.log('Onboarding concluído!');
  };

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        isModalOpen,
        currentStep,
        steps,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        setSteps,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
