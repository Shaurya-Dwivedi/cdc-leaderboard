import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextValue {
  user: User;
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USER: User = {
  id: 'm-1',
  name: 'Shaurya Dwivedi',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shaurya',
  role: 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(MOCK_USER);

  const toggleRole = () => {
    setUser((prev) => ({
      ...prev,
      role: prev.role === 'admin' ? 'viewer' : 'admin',
    }));
  };

  return (
    <AuthContext.Provider value={{ user, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
