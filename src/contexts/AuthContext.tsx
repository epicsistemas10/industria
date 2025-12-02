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
    
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📊 Sessão obtida:', session ? 'Autenticado' : 'Não autenticado');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('❌ Erro ao obter sessão:', error);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event, session ? 'Autenticado' : 'Não autenticado');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('🔴 AuthProvider: Limpando subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Tentando fazer login...');
    const { error } = await supabase.auth.signInWithPassword({
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
    const { error } = await supabase.auth.signUp({
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }
    console.log('✅ Logout realizado com sucesso');
  };

  const updateProfile = async (data: any) => {
    console.log('👤 Atualizando perfil...');
    const { error } = await supabase.auth.updateUser({
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
