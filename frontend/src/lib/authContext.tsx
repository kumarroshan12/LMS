'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from './api';

export type UserRole =
  | 'admin'
  | 'sales'
  | 'sanction'
  | 'disbursement'
  | 'collection'
  | 'borrower';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string, role?: UserRole, phone?: string) => Promise<User>;
  logout: () => void;
  quickLoginAsRole: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiRequest<User>('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          removeAuthToken();
          setUser(null);
        }
      } catch {
        removeAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole = 'borrower',
    phone?: string
  ): Promise<User> => {
    const res = await apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, role, phone }),
    });

    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed.');
  };

  const quickLoginAsRole = async (role: UserRole): Promise<User> => {
    const roleEmailMap: Record<UserRole, string> = {
      admin: 'admin@lms.com',
      sales: 'sales@lms.com',
      sanction: 'sanction@lms.com',
      disbursement: 'disbursement@lms.com',
      collection: 'collection@lms.com',
      borrower: 'borrower@lms.com',
    };
    return login(roleEmailMap[role], 'Password@123');
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        quickLoginAsRole,
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
