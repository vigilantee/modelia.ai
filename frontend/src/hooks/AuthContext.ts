import { createContext } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// AuthContext is defined and exported for use in the separate hook file
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
