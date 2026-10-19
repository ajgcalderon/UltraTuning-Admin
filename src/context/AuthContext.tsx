import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Si Supabase no está configurado aún en .env, revisamos sesión mock en localStorage
      const mockAuth = localStorage.getItem('mock_admin_session');
      if (mockAuth) {
        try {
          const parsed = JSON.parse(mockAuth);
          setUser(parsed.user);
          setSession(parsed.session);
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Suscripción a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      // Modo local / demo cuando .env aún no tiene credenciales reales
      if (email.trim() && password.length >= 6) {
        const mockUser: User = {
          id: 'admin-mock-1',
          email: email.trim(),
          app_metadata: { role: 'admin' },
          user_metadata: { name: 'Dueño del Sitio' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as unknown as User;

        const mockSession: Session = {
          access_token: 'mock-jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: mockUser,
        } as unknown as Session;

        localStorage.setItem('mock_admin_session', JSON.stringify({ user: mockUser, session: mockSession }));
        setUser(mockUser);
        setSession(mockSession);
        return { success: true };
      }
      return { success: false, error: 'Credenciales inválidas (mínimo 6 caracteres)' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    }
  };

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('mock_admin_session');
      setUser(null);
      setSession(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
