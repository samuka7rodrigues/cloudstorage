'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { isAuthenticated, getUser, setUser, clearUser } from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const [user, setUserState] = useState(getUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    setUserState(user);
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.auth.login({ email, password });
      setUser(result.user);
      setUserState(result.user);
      router.push('/dashboard');
      return result;
    },
    [router],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await api.auth.register({ name, email, password });
      setUser(result.user);
      setUserState(result.user);
      router.push('/dashboard');
      return result;
    },
    [router],
  );

  const logout = useCallback(() => {
    api.auth.logout();
    clearUser();
    setUserState(null);
    router.push('/login');
  }, [router]);

  return { user, loading, login, register, logout, isAuthenticated: isAuthenticated() };
}
