import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export type AuthMode = 'login' | 'register' | 'forgot_password' | 'reset_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSignInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  onSignUpWithEmail: (
    email: string,
    pass: string,
    fullName?: string
  ) => Promise<{ error: Error | null }>;
  onSignInWithGoogle: () => Promise<{ error: Error | null }>;
  onSignInWithGithub?: () => Promise<{ error: Error | null }>;
  onSendPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  onUpdatePassword: (newPass: string) => Promise<{ error: Error | null }>;
  isSupabaseConfigured: boolean;
  onOpenSettingsModal?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSignInWithEmail,
  onSignUpWithEmail,
  onSignInWithGoogle,
  onSignInWithGithub,
  onSendPasswordReset,
  onUpdatePassword,
  isSupabaseConfigured,
  onOpenSettingsModal,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMessage('Preencha seu email e senha.');
        return;
      }
      setLoading(true);
      const res = await onSignInWithEmail(email, password);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error.message);
      } else {
        onClose();
      }
    } else if (mode === 'register') {
      if (!email.trim() || !password) {
        setErrorMessage('Preencha todos os campos obrigatorios.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A senha deve ter no minimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('As senhas nao conferem.');
        return;
      }
      setLoading(true);
      const res = await onSignUpWithEmail(email, password, fullName);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error.message);
      } else {
        setSuccessMessage(
          isSupabaseConfigured
            ? 'Cadastro realizado! Se o seu projeto exigir confirmacao, verifique seu email.'
            : 'Conta local criada com sucesso!'
        );
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } else if (mode === 'forgot_password') {
      if (!email.trim()) {
        setErrorMessage('Informe seu email cadastrado.');
        return;
      }
      setLoading(true);
      const res = await onSendPasswordReset(email);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error.message);
      } else {
        setSuccessMessage(
          'Email de recuperacao enviado com sucesso! Verifique sua caixa de entrada e spam.'
        );
      }
    } else if (mode === 'reset_password') {
      if (!password) {
        setErrorMessage('Informe a nova senha.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A nova senha deve ter no minimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('As senhas nao conferem.');
        return;
      }
      setLoading(true);
      const res = await onUpdatePassword(password);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error.message);
      } else {
        setSuccessMessage('Senha atualizada com sucesso!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setLoading(true);
    const res = await onSignInWithGoogle();
    setLoading(false);
    if (res.error) {
      setErrorMessage(res.error.message);
    } else {
      if (!isSupabaseConfigured) {
        onClose();
      }
    }
  };

  const handleGithubAuth = async () => {
    if (!onSignInWithGithub) return;
    setErrorMessage(null);
    setLoading(true);
    const res = await onSignInWithGithub();
    setLoading(false);
    if (res.error) {
      setErrorMessage(res.error.message);
    } else {
      if (!isSupabaseConfigured) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Cabecalho */}
        <div className="p-4 sm:p-5 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs font-mono-code">
              FP
            </div>
            <div>
              <h3 className="text-sm font-bold text-light-text dark:text-dark-text tracking-tight">
                {mode === 'login' && 'Entrar no FLUXPRO'}
                {mode === 'register' && 'Criar Nova Conta'}
                {mode === 'forgot_password' && 'Recuperar Senha'}
                {mode === 'reset_password' && 'Definir Nova Senha'}
              </h3>
              <p className="text-[11px] text-light-muted dark:text-dark-muted">
                {mode === 'login' && 'Acesse seus projetos e cortes CNC'}
                {mode === 'register' && 'Cadastro rapido para projetistas de CV'}
                {mode === 'forgot_password' && 'Enviaremos um link de acesso seguro'}
                {mode === 'reset_password' && 'Crie uma nova senha para sua conta'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notificacao de Modo Local vs Supabase */}
        {!isSupabaseConfigured && (
          <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-light-border dark:border-dark-border px-4 py-2 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
            <span>Modo Local Ativo. Conecte o Supabase para salvar na nuvem.</span>
            {onOpenSettingsModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettingsModal();
                }}
                className="underline hover:text-black dark:hover:text-white font-medium"
              >
                Configurar
              </button>
            )}
          </div>
        )}

        {/* Mensagens de Erro ou Sucesso */}
        {errorMessage && (
          <div className="m-4 mb-0 p-3 rounded border border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="m-4 mb-0 p-3 rounded border border-neutral-300 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-neutral-800 dark:text-neutral-200" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          
          {/* Campo Nome Completo (Apenas no Cadastro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Nome Completo
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Carlos Projetista"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>
          )}

          {/* Campo Email (No Login, Cadastro e Recuperacao) */}
          {mode !== 'reset_password' && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com.br"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>
          )}

          {/* Campo Senha (No Login, Cadastro e Redefinicao) */}
          {mode !== 'forgot_password' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-light-text dark:text-dark-text">
                  {mode === 'reset_password' ? 'Nova Senha' : 'Senha'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setMode('forgot_password');
                    }}
                    className="text-[11px] text-neutral-500 hover:text-black dark:hover:text-white underline underline-offset-2"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'reset_password' ? 'No minimo 6 caracteres' : '••••••••'}
                  className="w-full pl-9 pr-10 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Campo Confirmar Senha (No Cadastro e Redefinicao) */}
          {(mode === 'register' || mode === 'reset_password') && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>
          )}

          {/* Botao de Acao Primario */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-semibold text-xs transition-opacity shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <span>Processando...</span>
            ) : mode === 'login' ? (
              <span>Entrar com Email</span>
            ) : mode === 'register' ? (
              <span>Criar Conta</span>
            ) : mode === 'forgot_password' ? (
              <span>Enviar Link de Recuperacao</span>
            ) : (
              <span>Salvar Nova Senha</span>
            )}
          </button>

          {/* Divisor "ou" (Apenas Login e Cadastro) */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-light-border dark:border-dark-border w-full" />
                <span className="bg-light-card dark:bg-dark-card px-2 text-[11px] font-mono-code text-neutral-400 dark:text-neutral-500 uppercase">
                  ou
                </span>
              </div>

              {/* Botao de Autenticacao com Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                  />
                </svg>
                <span>
                  {mode === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'}
                </span>
              </button>

              {/* Botao de Autenticacao com GitHub */}
              {onSignInWithGithub && (
                <button
                  type="button"
                  onClick={handleGithubAuth}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>
                    {mode === 'login' ? 'Entrar com GitHub' : 'Cadastrar com GitHub'}
                  </span>
                </button>
              )}
            </>
          )}

          {/* Links de Alternancia de Modo */}
          <div className="pt-2 border-t border-light-border dark:border-dark-border text-center text-xs text-light-muted dark:text-dark-muted">
            {mode === 'login' && (
              <p>
                Nao possui conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('register');
                  }}
                  className="font-bold text-light-text dark:text-dark-text underline underline-offset-2 ml-1"
                >
                  Cadastre-se gratuitamente
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p>
                Ja possui conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('login');
                  }}
                  className="font-bold text-light-text dark:text-dark-text underline underline-offset-2 ml-1"
                >
                  Fazer login
                </button>
              </p>
            )}

            {(mode === 'forgot_password' || mode === 'reset_password') && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="inline-flex items-center gap-1.5 font-semibold text-light-text dark:text-dark-text hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para o Login</span>
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
