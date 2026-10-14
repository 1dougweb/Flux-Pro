import React, { useState, useRef, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { LocalUser } from '../../hooks/useAuth';
import {
  User as UserIcon,
  LogOut,
  KeyRound,
  Database,
  ChevronDown,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';

interface UserMenuProps {
  user: SupabaseUser | LocalUser | null;
  onOpenAuthModal: () => void;
  onOpenResetPasswordModal: () => void;
  onOpenSettingsModal: () => void;
  onSignOut: () => Promise<void>;
  isSupabaseConfigured: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onOpenAuthModal,
  onOpenResetPasswordModal,
  onOpenSettingsModal,
  onSignOut,
  isSupabaseConfigured,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Se o usuario nao estiver logado, exibe botao de "Entrar"
  if (!user) {
    return (
      <button
        onClick={onOpenAuthModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text transition-colors shadow-sm"
        title="Entrar ou criar conta"
      >
        <UserIcon className="w-3.5 h-3.5" />
        <span>Entrar</span>
      </button>
    );
  }

  // Dados do usuario
  const email = user.email || 'usuario@fluxpro.com';
  const metadata = user.user_metadata as Record<string, any> | undefined;
  const name =
    metadata?.full_name ||
    metadata?.name ||
    email.split('@')[0];
  const avatarUrl = metadata?.avatar_url || '';
  const initials = (name as string)
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isLocal = Boolean((user as LocalUser).is_local) || !isSupabaseConfigured;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botao de Perfil no Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        title={`Conectado como ${name}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-6 h-6 rounded-full object-cover border border-light-border dark:border-dark-border"
          />
        ) : (
          <div className="w-6 h-6 rounded bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-[10px] font-mono-code">
            {initials || 'U'}
          </div>
        )}

        <span className="text-xs font-semibold max-w-[120px] truncate hidden md:inline text-light-text dark:text-dark-text">
          {name}
        </span>

        <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
      </button>

      {/* Menu Suspenso (Dropdown) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-2xl z-50 py-1.5 animate-in fade-in duration-100">
          
          {/* Cabecalho do Menu */}
          <div className="px-3 py-2.5 border-b border-light-border dark:border-dark-border">
            <p className="text-xs font-bold text-light-text dark:text-dark-text truncate">
              {name}
            </p>
            <p className="text-[11px] font-mono-code text-light-muted dark:text-dark-muted truncate">
              {email}
            </p>

            <div className="mt-2 flex items-center gap-1.5">
              {isLocal ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono-code border border-neutral-300 dark:border-neutral-700 bg-light-surface dark:bg-dark-surface text-neutral-600 dark:text-neutral-400">
                  <HardDrive className="w-3 h-3" />
                  <span>Modo Local</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono-code border border-neutral-400 bg-black text-white dark:bg-white dark:text-black font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Supabase Autenticado</span>
                </span>
              )}
            </div>
          </div>

          {/* Opcoes do Menu */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenResetPasswordModal();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-light-surface dark:hover:bg-dark-surface hover:text-black dark:hover:text-white transition-colors text-left"
            >
              <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
              <span>Alterar Senha</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettingsModal();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-light-surface dark:hover:bg-dark-surface hover:text-black dark:hover:text-white transition-colors text-left"
            >
              <Database className="w-3.5 h-3.5 text-neutral-500" />
              <span>Configuracoes do Banco</span>
            </button>
          </div>

          <div className="border-t border-light-border dark:border-dark-border pt-1">
            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await onSignOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da Conta</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
