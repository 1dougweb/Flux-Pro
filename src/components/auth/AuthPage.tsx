import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles,
  Scissors,
  Layers,
  FileCode,
  ArrowRight,
  Check,
} from 'lucide-react';

export type AuthMode = 'login' | 'register' | 'forgot_password' | 'reset_password';

interface AuthPageProps {
  initialMode?: AuthMode;
  onSignInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  onSignUpWithEmail: (
    email: string,
    pass: string,
    fullName?: string
  ) => Promise<{ error: Error | null }>;
  onSignInWithGoogle: () => Promise<{ error: Error | null }>;
  onSendPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  onUpdatePassword: (newPass: string) => Promise<{ error: Error | null }>;
  isSupabaseConfigured?: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isPasswordRecovery?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onSignInWithEmail,
  onSignUpWithEmail,
  onSignInWithGoogle,
  onSendPasswordReset,
  onUpdatePassword,
  theme,
  toggleTheme,
  isPasswordRecovery = false,
}) => {
  const [mode, setMode] = useState<AuthMode>(isPasswordRecovery ? 'reset_password' : initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('reset_password');
    }
  }, [isPasswordRecovery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMessage('Por favor, informe seu email e senha de acesso.');
        return;
      }
      setLoading(true);
      const res = await onSignInWithEmail(email, password);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error.message);
      }
    } else if (mode === 'register') {
      if (!email.trim() || !password) {
        setErrorMessage('Preencha todos os campos obrigatórios.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('As senhas digitadas não conferem.');
        return;
      }
      setLoading(true);
      const res = await onSignUpWithEmail(email, password, fullName);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error.message);
      } else {
        setSuccessMessage('Cadastro realizado com sucesso! Seja bem-vindo ao FLUXPRO.');
      }
    } else if (mode === 'forgot_password') {
      if (!email.trim()) {
        setErrorMessage('Informe seu email cadastrado para recuperação.');
        return;
      }
      setLoading(true);
      const res = await onSendPasswordReset(email);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error.message);
      } else {
        setSuccessMessage(
          'Enviamos as instruções de recuperação para seu email. Verifique sua caixa de entrada.'
        );
      }
    } else if (mode === 'reset_password') {
      if (!password) {
        setErrorMessage('Informe a nova senha desejada.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('As senhas não conferem.');
        return;
      }
      setLoading(true);
      const res = await onUpdatePassword(password);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error.message);
      } else {
        setSuccessMessage('Sua senha foi redefinida com sucesso! Redirecionando...');
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
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-purple-600 selection:text-white transition-colors duration-200">
      
      {/* 1. PAINEL ESQUERDO: SHOWCASE & BRANDING (DESKTOP) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative flex-col justify-between p-12 bg-zinc-900 text-white overflow-hidden border-r border-zinc-800">
        
        {/* Glows de Fundo & Grade Blueprint */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.18),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

        {/* Topo do Showcase: Logo & Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-lg shadow-purple-500/25 flex items-center justify-center font-black text-white text-base tracking-wider font-mono-code ring-1 ring-white/20">
              FP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  FLUXPRO
                </span>
                <span className="text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Workspace v2.0
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gestão de Obras & Engenharia CNC para Comunicação Visual
              </p>
            </div>
          </div>
        </div>

        {/* Centro do Showcase: Título de Impacto & Cards Interativos */}
        <div className="relative z-10 my-auto py-8 max-w-xl space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Plataforma moderna inspirada nas melhores ferramentas globais</span>
            </div>
            
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Do arquivo vetorial à{' '}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
                bancada de corte CNC
              </span>{' '}
              sem falhas de produção.
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed">
              Elimine o caos de arquivos espalhados em pastas e WhatsApp. Tenha controle completo de peças, medições, especificações de chapas e arquivos de corte (.DXF, .CDR, .AI, .PDF) com um fluxo Kanban integrado.
            </p>
          </div>

          {/* Mini Cards de Demonstração de Recursos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            
            {/* Card 1: Kanban & Trello */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2 hover:bg-white/[0.07] transition-all">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                <Layers className="w-4 h-4" />
                <span>Quadro Kanban Interativo</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Drag-and-drop estilo Trello com slot dinâmico, sem cartões transparentes e com filtros por ambiente.
              </p>
              <div className="flex gap-1 pt-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono-code">Layout</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono-code">Router CNC</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-code">Instalação</span>
              </div>
            </div>

            {/* Card 2: Repeater & Arquivos */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2 hover:bg-white/[0.07] transition-all">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                <FileCode className="w-4 h-4" />
                <span>Repeater de Arquivos Técnicos</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Biblioteca centralizada de vetores, gabaritos 1:1 e links em nuvem com download e preview direto.
              </p>
              <div className="flex gap-1 pt-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono-code">.DXF</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono-code">.CDR</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono-code">.PDF</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono-code">G-code</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Showcase */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronização Nuvem + Modo Offline Nativo</span>
          </div>
          <span className="font-mono-code text-[11px] text-zinc-400">
            ACM • Acrílico • Lona • Inox • LED
          </span>
        </div>
      </div>

      {/* 2. PAINEL DIREITO: FORMULÁRIO DE LOGIN / CADASTRO */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 md:p-14 relative overflow-y-auto">
        
        {/* Barra de Ações Superior: Status do Banco & Tema */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          {/* Logo compacta visível no Mobile */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs font-mono-code">
              FP
            </div>
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              FLUXPRO
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Alternador de Tema Claro / Escuro */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
              title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>
          </div>
        </div>

        {/* Container Central do Formulário */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          
          {/* Título e Subtítulo do Form */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {mode === 'login' && 'Bem-vindo de volta'}
              {mode === 'register' && 'Crie sua conta no FLUXPRO'}
              {mode === 'forgot_password' && 'Recuperar acesso'}
              {mode === 'reset_password' && 'Nova senha de acesso'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {mode === 'login' && 'Digite suas credenciais para gerenciar suas ordens e cortes.'}
              {mode === 'register' && 'Cadastre-se para criar projetos, peças e planos de usinagem.'}
              {mode === 'forgot_password' && 'Informe seu email para receber o link seguro de redefinição.'}
              {mode === 'reset_password' && 'Escolha uma nova senha segura para a sua conta.'}
            </p>
          </div>

          {/* Seletor Segmentado (Abas Entrar / Criar Conta) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 grid grid-cols-2 gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Fazer Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('register');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Cadastrar-se
              </button>
            </div>
          )}

          {/* Feedback de Erro */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Feedback de Sucesso */}
          {successMessage && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* Formulário Principal */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nome Completo (Apenas Cadastro) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            {mode !== 'reset_password' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Endereço de Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com.br"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono-code"
                  />
                </div>
              </div>
            )}

            {/* Senha */}
            {mode !== 'forgot_password' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {mode === 'reset_password' ? 'Nova Senha' : 'Senha de Acesso'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setMode('forgot_password');
                      }}
                      className="text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'reset_password' ? 'No mínimo 6 caracteres' : '••••••••'}
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmação de Senha (Cadastro e Redefinição) */}
            {(mode === 'register' || mode === 'reset_password') && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Botão Primário de Ação */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Aguarde...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'register' ? (
                <>
                  <span>Finalizar Cadastro</span>
                  <Check className="w-4 h-4" />
                </>
              ) : mode === 'forgot_password' ? (
                <span>Enviar Instruções por Email</span>
              ) : (
                <span>Salvar Nova Senha</span>
              )}
            </button>

            {/* Divisor "ou continue com" */}
            {(mode === 'login' || mode === 'register') && (
              <>
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                  <span className="bg-zinc-50 dark:bg-zinc-950 px-3 text-[10px] font-mono-code uppercase text-zinc-400">
                    ou continue com
                  </span>
                </div>

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
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
                  <span>Google Account</span>
                </button>
              </>
            )}

            {/* Botão de Retorno para o Login */}
            {(mode === 'forgot_password' || mode === 'reset_password') && (
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('login');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Rodapé Direito */}
        <div className="mt-8 text-center text-[11px] text-zinc-400 font-mono-code">
          FLUXPRO • Sistema Profissional para Comunicação Visual e Usinagem CNC
        </div>
      </div>

    </div>
  );
};
