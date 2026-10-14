import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_USER_KEY = 'fluxpro_local_user';

export interface LocalUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
  is_local?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | LocalUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Inicializacao da Sessao
  useEffect(() => {
    let isMounted = true;
    const client = getSupabaseClient();

    // Verifica se a URL contem parametros de recuperacao de senha
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      setIsPasswordRecovery(true);
    }

    if (!client || !isSupabaseConfigured()) {
      // Modo Local / Convidado
      const savedLocalUser = localStorage.getItem(LOCAL_USER_KEY);
      if (savedLocalUser) {
        try {
          setUser(JSON.parse(savedLocalUser));
        } catch {
          localStorage.removeItem(LOCAL_USER_KEY);
        }
      }
      setLoading(false);
      return;
    }

    // Carrega sessao do Supabase
    client.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('Erro ao carregar sessao Supabase:', error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudancas no estado de autenticacao
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login com Email e Senha
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const client = getSupabaseClient();

    if (!client || !isSupabaseConfigured()) {
      // Login em Modo Local
      const localUser: LocalUser = {
        id: 'local-user-id',
        email: email.trim().toLowerCase(),
        user_metadata: {
          full_name: email.split('@')[0],
        },
        is_local: true,
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
      setUser(localUser);
      return { error: null };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Email ou senha incorretos.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Email ainda nao confirmado. Verifique sua caixa de entrada.';
        }
        setAuthError(msg);
        return { error: new Error(msg) };
      }

      setUser(data.user);
      setSession(data.session);
      return { error: null };
    } catch (err: any) {
      const msg = err?.message || 'Falha ao autenticar.';
      setAuthError(msg);
      return { error: new Error(msg) };
    }
  }, []);

  // Cadastro de Novo Usuario
  const signUpWithEmail = useCallback(async (email: string, password: string, fullName?: string) => {
    setAuthError(null);
    const client = getSupabaseClient();

    if (!client || !isSupabaseConfigured()) {
      // Cadastro em Modo Local
      const localUser: LocalUser = {
        id: 'local-user-id',
        email: email.trim().toLowerCase(),
        user_metadata: {
          full_name: fullName?.trim() || email.split('@')[0],
        },
        is_local: true,
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
      setUser(localUser);
      return { error: null, user: localUser as any };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || email.split('@')[0],
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('User already registered')) {
          msg = 'Este email ja esta cadastrado. Tente fazer login ou recuperar a senha.';
        } else if (msg.includes('Password should be at least')) {
          msg = 'A senha deve conter no minimo 6 caracteres.';
        }
        setAuthError(msg);
        return { error: new Error(msg), user: null };
      }

      if (data.session) {
        setUser(data.user);
        setSession(data.session);
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      const msg = err?.message || 'Falha ao realizar cadastro.';
      setAuthError(msg);
      return { error: new Error(msg), user: null };
    }
  }, []);

  // Login com Google OAuth
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const client = getSupabaseClient();

    if (!client || !isSupabaseConfigured()) {
      // Simula login rapido caso Supabase nao esteja conectado
      const localGoogleUser: LocalUser = {
        id: 'google-demo-user',
        email: 'projetista.cv@gmail.com',
        user_metadata: {
          full_name: 'Projetista CV (Conta Google)',
          avatar_url: '',
        },
        is_local: true,
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localGoogleUser));
      setUser(localGoogleUser);
      return { error: null };
    }

    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        return { error };
      }

      return { error: null };
    } catch (err: any) {
      const msg = err?.message || 'Erro ao iniciar autenticacao com Google.';
      setAuthError(msg);
      return { error: new Error(msg) };
    }
  }, []);


  // Enviar Email de Recuperacao de Senha
  const sendPasswordResetEmail = useCallback(async (email: string) => {
    setAuthError(null);
    const client = getSupabaseClient();

    if (!client || !isSupabaseConfigured()) {
      // No modo local, notifica sucesso simulado
      return { error: null };
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}#type=recovery`,
      });

      if (error) {
        setAuthError(error.message);
        return { error };
      }

      return { error: null };
    } catch (err: any) {
      const msg = err?.message || 'Erro ao enviar email de recuperacao.';
      setAuthError(msg);
      return { error: new Error(msg) };
    }
  }, []);

  // Atualizar Nova Senha (pos-recuperacao ou no perfil)
  const updatePassword = useCallback(async (newPassword: string) => {
    setAuthError(null);
    const client = getSupabaseClient();

    if (!client || !isSupabaseConfigured()) {
      setIsPasswordRecovery(false);
      return { error: null };
    }

    try {
      const { error } = await client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setAuthError(error.message);
        return { error };
      }

      setIsPasswordRecovery(false);
      return { error: null };
    } catch (err: any) {
      const msg = err?.message || 'Erro ao atualizar senha.';
      setAuthError(msg);
      return { error: new Error(msg) };
    }
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    setAuthError(null);
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
    setSession(null);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      await client.auth.signOut().catch(() => {});
    }
  }, []);

  return {
    user,
    session,
    loading,
    isPasswordRecovery,
    setIsPasswordRecovery,
    authError,
    setAuthError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordResetEmail,
    updatePassword,
    signOut,
    isSupabaseConfigured: isSupabaseConfigured(),
  };
}
