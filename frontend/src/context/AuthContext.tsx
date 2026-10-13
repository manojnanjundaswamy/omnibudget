import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse, OnboardingPayload } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  loginWithGoogle: (email: string, name?: string, avatarUrl?: string) => Promise<AuthResponse>;
  loginWithEmail: (email: string, password?: string, name?: string, isRegister?: boolean) => Promise<AuthResponse>;
  sendLoginOtp: (email: string, name?: string) => Promise<{ message: string; isNewUser: boolean }>;
  verifyLoginOtp: (email: string, code: string) => Promise<AuthResponse>;
  loginAsDemo: () => void;
  logout: () => void;
  completeOnboarding: (data: OnboardingPayload) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@omnibudget.app',
  name: 'Alex Chen (Demo)',
  currency: 'USD',
  provider: 'DEMO',
  hasCompletedOnboarding: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Initialize session from localStorage
  useEffect(() => {
    const savedUserJson = localStorage.getItem('omnibudget_user');
    const savedUserId = localStorage.getItem('omnibudget_user_id');

    if (savedUserJson && savedUserId) {
      try {
        const user: User = JSON.parse(savedUserJson);
        setCurrentUser(user);
        setIsDemoMode(user.provider === 'DEMO');
        if (!user.hasCompletedOnboarding && user.provider !== 'DEMO') {
          setIsOnboardingOpen(true);
        }
      } catch (e) {
        console.error('Error parsing stored user', e);
        // Fall back to demo user
        setCurrentUser(DEMO_USER);
        setIsDemoMode(true);
      }
    } else {
      // Default to Demo user for initial preview
      setCurrentUser(DEMO_USER);
      localStorage.setItem('omnibudget_user', JSON.stringify(DEMO_USER));
      localStorage.setItem('omnibudget_user_id', DEMO_USER.id);
      setIsDemoMode(true);
    }
  }, []);

  const loginWithGoogle = async (email: string, name?: string, avatarUrl?: string): Promise<AuthResponse> => {
    const res = await api.googleAuth({ email, name, avatarUrl });
    setCurrentUser(res.user);
    setIsDemoMode(false);
    localStorage.setItem('omnibudget_user', JSON.stringify(res.user));
    localStorage.setItem('omnibudget_user_id', res.user.id);
    localStorage.setItem('omnibudget_token', res.token);

    if (res.isNewUser || !res.user.hasCompletedOnboarding) {
      setIsOnboardingOpen(true);
    }
    setIsAuthModalOpen(false);
    return res;
  };

  const loginWithEmail = async (
    email: string,
    password?: string,
    name?: string,
    isRegister?: boolean
  ): Promise<AuthResponse> => {
    const res = await api.emailAuth({ email, password, name, isRegister });
    setCurrentUser(res.user);
    setIsDemoMode(false);
    localStorage.setItem('omnibudget_user', JSON.stringify(res.user));
    localStorage.setItem('omnibudget_user_id', res.user.id);
    localStorage.setItem('omnibudget_token', res.token);

    if (res.isNewUser || !res.user.hasCompletedOnboarding) {
      setIsOnboardingOpen(true);
    }
    setIsAuthModalOpen(false);
    return res;
  };

  const sendLoginOtp = async (email: string, name?: string): Promise<{ message: string; isNewUser: boolean }> => {
    return await api.sendOtp(email, name);
  };

  const verifyLoginOtp = async (email: string, code: string): Promise<AuthResponse> => {
    const res = await api.verifyOtp(email, code);
    setCurrentUser(res.user);
    setIsDemoMode(false);
    localStorage.setItem('omnibudget_user', JSON.stringify(res.user));
    localStorage.setItem('omnibudget_user_id', res.user.id);
    localStorage.setItem('omnibudget_token', res.token);

    if (res.isNewUser || !res.user.hasCompletedOnboarding) {
      setIsOnboardingOpen(true);
    }
    setIsAuthModalOpen(false);
    return res;
  };

  const loginAsDemo = () => {
    setCurrentUser(DEMO_USER);
    setIsDemoMode(true);
    localStorage.setItem('omnibudget_user', JSON.stringify(DEMO_USER));
    localStorage.setItem('omnibudget_user_id', DEMO_USER.id);
    setIsAuthModalOpen(false);
    setIsOnboardingOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('omnibudget_user');
    localStorage.removeItem('omnibudget_user_id');
    localStorage.removeItem('omnibudget_token');
    loginAsDemo();
  };

  const completeOnboarding = async (data: OnboardingPayload) => {
    const updatedUser = await api.completeOnboarding(data);
    setCurrentUser(updatedUser);
    localStorage.setItem('omnibudget_user', JSON.stringify(updatedUser));
    setIsOnboardingOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser && currentUser.provider !== 'DEMO',
        isDemoMode,
        loginWithGoogle,
        loginWithEmail,
        sendLoginOtp,
        verifyLoginOtp,
        loginAsDemo,
        logout,
        completeOnboarding,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
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
