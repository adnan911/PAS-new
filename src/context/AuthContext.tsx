import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const ADMIN_STORAGE_KEY = 'pas_admin_auth_v1';
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'paspassword';

interface AuthContextType {
  isAdmin: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  requireAdmin: (action: () => void, actionName?: string) => void;
  isLoginModalOpen: boolean;
  openLoginModal: (pendingActionName?: string, onSuccess?: () => void) => void;
  closeLoginModal: () => void;
  pendingActionName: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [pendingActionName, setPendingActionName] = useState<string | null>(null);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    try {
      if (isAdmin) {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save admin state:', e);
    }
  }, [isAdmin]);

  const login = (user: string, pass: string): boolean => {
    if (user.trim() === VALID_USERNAME && pass === VALID_PASSWORD) {
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      if (pendingCallback) {
        const cb = pendingCallback;
        setPendingCallback(null);
        setPendingActionName(null);
        cb();
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setPendingCallback(null);
    setPendingActionName(null);
  };

  const openLoginModal = (actionDescription?: string, onSuccess?: () => void) => {
    setPendingActionName(actionDescription || null);
    setPendingCallback(onSuccess ? () => onSuccess : null);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setPendingCallback(null);
    setPendingActionName(null);
  };

  const requireAdmin = (action: () => void, actionName?: string) => {
    if (isAdmin) {
      action();
    } else {
      openLoginModal(actionName, action);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        login,
        logout,
        requireAdmin,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        pendingActionName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
