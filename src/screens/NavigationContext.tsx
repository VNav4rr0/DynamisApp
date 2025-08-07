// src/navigation/NavigationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Tipos de fluxo de navegação
type NavigationFlow = 'AuthFlow' | 'AppFlow';

interface NavigationContextType {
  navigationFlow: NavigationFlow;
  setNavigationFlow: (flow: NavigationFlow) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [navigationFlow, setNavigationFlow] = useState<NavigationFlow>('AuthFlow');

  return (
    <NavigationContext.Provider value={{ navigationFlow, setNavigationFlow }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationFlow = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationFlow must be used within a NavigationProvider');
  }
  return context;
};