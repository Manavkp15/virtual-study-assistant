import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ParentModeContextType {
  isParentMode: boolean;
  enterParentMode: () => void;
  exitParentMode: () => void;
  toggleParentMode: () => void;
  isPinModalOpen: boolean;
  pinModalMode: 'enter' | 'change';
  openPinModal: (onSuccess?: () => void, mode?: 'enter' | 'change') => void;
  closePinModal: () => void;
  verifyPin: (pin: string) => boolean;
  updatePin: (newPin: string) => void;
  hasCustomPin: boolean;
  resetPinToDefault: () => void;
}

const ParentModeContext = createContext<ParentModeContextType | undefined>(undefined);

const STORAGE_KEY_ACTIVE = 'vsa_parent_mode_active';

export const ParentModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isParentMode, setIsParentMode] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE, String(isParentMode));
  }, [isParentMode]);

  const enterParentMode = useCallback(() => {
    setIsParentMode(true);
    localStorage.setItem(STORAGE_KEY_ACTIVE, 'true');
  }, []);

  const exitParentMode = useCallback(() => {
    setIsParentMode(false);
    localStorage.setItem(STORAGE_KEY_ACTIVE, 'false');
  }, []);

  // Directly enter parent mode without PIN prompt
  const openPinModal = useCallback((onSuccess?: () => void) => {
    setIsParentMode(true);
    localStorage.setItem(STORAGE_KEY_ACTIVE, 'true');
    if (onSuccess) onSuccess();
  }, []);

  const closePinModal = useCallback(() => {
    // No-op since PIN modal is disabled
  }, []);

  const toggleParentMode = useCallback(() => {
    setIsParentMode(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_ACTIVE, String(next));
      return next;
    });
  }, []);

  const verifyPin = useCallback(() => true, []);
  const updatePin = useCallback(() => {}, []);
  const resetPinToDefault = useCallback(() => {}, []);

  return (
    <ParentModeContext.Provider
      value={{
        isParentMode,
        enterParentMode,
        exitParentMode,
        toggleParentMode,
        isPinModalOpen: false,
        pinModalMode: 'enter',
        openPinModal,
        closePinModal,
        verifyPin,
        updatePin,
        hasCustomPin: false,
        resetPinToDefault
      }}
    >
      {children}
    </ParentModeContext.Provider>
  );
};

export const useParentMode = () => {
  const context = useContext(ParentModeContext);
  if (!context) {
    throw new Error('useParentMode must be used within a ParentModeProvider');
  }
  return context;
};
