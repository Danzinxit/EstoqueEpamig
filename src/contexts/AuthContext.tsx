import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Primeiro, tentamos fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Se o erro for de email não confirmado, tentamos uma abordagem diferente
        if (error.message.includes('Email not confirmed')) {
          try {
            // Tentamos fazer login novamente com um pequeno delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (retryError) {
              // Se ainda falhar, tentamos uma última vez
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const { data: finalData, error: finalError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });

              if (finalError) {
                throw finalError;
              }

              // Atualiza o usuário com os dados da sessão
              setSession(finalData.session);
              setUser(finalData.user);

              // Busca o perfil do usuário para obter a role
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', finalData.user.id)
                .single();

              if (profileError) {
                console.error('Erro ao buscar perfil:', profileError);
                return;
              }

              if (profileData?.role) {
                // Atualiza os metadados do usuário com a role e full_name
                await supabase.auth.updateUser({
                  data: { 
                    role: profileData.role,
                    full_name: profileData.full_name
                  }
                });
              }

              return;
            }

            // Atualiza o usuário com os dados da sessão
            setSession(retryData.session);
            setUser(retryData.user);

            // Busca o perfil do usuário para obter a role
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', retryData.user.id)
              .single();

            if (profileError) {
              console.error('Erro ao buscar perfil:', profileError);
              return;
            }

            if (profileData?.role) {
              // Atualiza os metadados do usuário com a role e full_name
              await supabase.auth.updateUser({
                data: { 
                  role: profileData.role,
                  full_name: profileData.full_name
                }
              });
            }

            return;
          } catch (retryError) {
            console.error('Erro ao tentar fazer login novamente:', retryError);
            throw error; // Mantemos o erro original
          }
        }
        throw error;
      }

      // Atualiza o usuário com os dados da sessão
      setSession(data.session);
      setUser(data.user);

      // Busca o perfil do usuário para obter a role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        return;
      }

      if (profileData?.role) {
        // Atualiza os metadados do usuário com a role e full_name
        await supabase.auth.updateUser({
          data: { 
            role: profileData.role,
            full_name: profileData.full_name
          }
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};