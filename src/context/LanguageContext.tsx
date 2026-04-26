import { createContext, useContext, useState, type ReactNode } from 'react';

interface LanguageContextType {
  isEnglish: boolean;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  isEnglish: false,
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [isEnglish, setIsEnglish] = useState(false);
  const toggle = () => setIsEnglish(p => !p);
  return (
    <LanguageContext.Provider value={{ isEnglish, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
