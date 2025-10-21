import { useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api.service';
import type { User } from '../types';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem('token');

    const checkAuthStatus = async () => {
      if (token) {
        try {
          const { user } = await authService.getMe();
          setUser(user);
        } catch (error) {
          // If token fails, remove it
          console.error(error);
          window.localStorage.removeItem('token');
        }
      }
      // Ensure loading state is set to false regardless of success/failure
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    window.localStorage.setItem('token', response.token);
    setUser(response.user);
  };

  const register = async (email: string, password: string) => {
    const response = await authService.register(email, password);
    window.localStorage.setItem('token', response.token);
    setUser(response.user);
  };

  const logout = () => {
    window.localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
