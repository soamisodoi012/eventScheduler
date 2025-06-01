import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, logoutUser } from '../api/events';
import { UserCredentials } from '../types/eventTypes';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: UserCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const login = async (credentials: UserCredentials) => {
    const token = await loginUser(credentials);
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await logoutUser();
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};