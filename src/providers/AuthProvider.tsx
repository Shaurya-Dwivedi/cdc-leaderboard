import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { supabase } from '../api/supabaseClient';

interface AuthContextValue {
  user: User;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST: User = { id: 'guest', name: 'Guest', avatarUrl: '', role: 'viewer' };

// Mock mode only (no Supabase env vars): any credentials work, backend is in-memory.
const MOCK_ADMIN: User = {
  id: 'm-1',
  name: 'Shaurya Dwivedi',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shaurya',
  role: 'admin',
};

type AdminRow = { id: string; name: string; avatar_url: string };

async function fetchAdmin(): Promise<User | null> {
  const { data, error } = await supabase!.rpc('current_admin');
  const row = (data as AdminRow[] | null)?.[0];
  if (error || !row) return null;
  return { id: row.id, name: row.name, avatarUrl: row.avatar_url, role: 'admin' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(GUEST);
  // undefined = session not checked yet, null = signed out
  const [authUid, setAuthUid] = useState<string | null | undefined>(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAuthUid(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setAuthUid(session?.user.id ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || authUid === undefined) return;
    if (authUid === null) {
      setUser(GUEST);
      return;
    }
    let live = true;
    fetchAdmin().then((admin) => live && setUser(admin ?? GUEST));
    return () => {
      live = false;
    };
  }, [authUid]);

  const login = async (email: string, password: string) => {
    if (!supabase) {
      setUser(MOCK_ADMIN);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!(await fetchAdmin())) {
      await supabase.auth.signOut();
      throw new Error('This account is not an admin.');
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(GUEST);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin: user.role === 'admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
