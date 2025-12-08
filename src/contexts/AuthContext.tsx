import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔐 AuthProvider estado:', { user: !!user, session: !!session, loading });

  useEffect(() => {
    console.log('🔵 AuthProvider: Verificando sessão...');
    // Defensive checks: if Supabase isn't configured (e.g. missing VITE_ envs)
    // the exported `supabase` may be a proxy that does not implement the
    // expected auth methods. Guarding prevents runtime TypeErrors in prod.
    const authObj: any = (supabase as any)?.auth;
    if (!authObj || typeof authObj.getSession !== 'function') {
      console.error('❌ Supabase auth não disponível. Verifique as variáveis de ambiente VITE_PUBLIC_SUPABASE_*');
      setLoading(false);
      return undefined;
    }

    // Verificar sessão atual
    authObj.getSession().then(({ data: { session } }: any) => {
      console.log('📊 Sessão obtida:', session ? 'Autenticado' : 'Não autenticado');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error: any) => {
      console.error('❌ Erro ao obter sessão:', error);
      setLoading(false);
    });

    // Escutar mudanças de autenticação se disponível
    let unsubscribe: (() => void) | undefined;
    if (typeof authObj.onAuthStateChange === 'function') {
      const { data }: any = authObj.onAuthStateChange((_event: any, session: any) => {
        console.log('🔄 Auth state changed:', _event, session ? 'Autenticado' : 'Não autenticado');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
      unsubscribe = data?.subscription?.unsubscribe?.bind(data.subscription);
    }

    return () => {
      console.log('🔴 AuthProvider: Limpando subscription');
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Tentando fazer login...');
    const auth: any = (supabase as any)?.auth;
    if (!auth || typeof auth.signInWithPassword !== 'function') {
      const msg = 'Supabase auth não disponível. Verifique VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente.';
      console.error('❌', msg);
      throw new Error(msg);
    }
    const { error } = await auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
    console.log('✅ Login realizado com sucesso');
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('📝 Tentando criar conta...');
    const auth: any = (supabase as any)?.auth;
    if (!auth || typeof auth.signUp !== 'function') {
      const msg = 'Supabase auth não disponível. Verifique VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente.';
      console.error('❌', msg);
      throw new Error(msg);
    }
    const { error } = await auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    if (error) {
      console.error('❌ Erro no cadastro:', error);
      throw error;
    }
    console.log('✅ Cadastro realizado com sucesso');
  };

  const signOut = async () => {
    console.log('🚪 Fazendo logout...');
    const auth: any = (supabase as any)?.auth;
    if (!auth || typeof auth.signOut !== 'function') {
      const msg = 'Supabase auth não disponível. Verifique VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente.';
      console.error('❌', msg);
      throw new Error(msg);
    }
    const { error } = await auth.signOut();
    if (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }
    console.log('✅ Logout realizado com sucesso');
  };

  const updateProfile = async (data: any) => {
    console.log('👤 Atualizando perfil...');
    const auth: any = (supabase as any)?.auth;
    if (!auth || typeof auth.updateUser !== 'function') {
      const msg = 'Supabase auth não disponível. Verifique VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente.';
      console.error('❌', msg);
      throw new Error(msg);
    }
    const { error } = await auth.updateUser({
      data,
    });
    if (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error;
    }
    console.log('✅ Perfil atualizado com sucesso');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
