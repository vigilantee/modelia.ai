import { useContext } from 'react';
import { AuthContext } from './AuthContext'; // Import AuthContext from the new context file

/**
 * Custom hook to consume the AuthContext.
 * Throws an error if used outside of AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
