'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  role: string;
  phoneNumber?: string;
  status?: string;
  createdAt?: string;
  profile?: { firstName: string; lastName: string; nationalId?: string };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Strict Guard Logic
  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/';
    const isDashboard = pathname.startsWith('/dashboard');

    if (!user && isDashboard) {
      router.replace('/'); // Redirect to home/login
    } else if (user && isAuthPage) {
      router.replace('/dashboard'); // Redirect to dashboard
    }
  }, [user, loading, pathname, router]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    router.replace('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.replace('/');
  };

  // BLOCK RENDERING until auth check is done or redirect happens
  if (loading) return null; // Or a spinner component
  if (!user && pathname.startsWith('/dashboard')) return null;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);