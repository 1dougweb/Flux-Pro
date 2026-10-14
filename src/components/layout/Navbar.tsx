import React from 'react';
import {
  Search,
  Plus,
  Sun,
  Moon,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

import { User as SupabaseUser } from '@supabase/supabase-js';
import { LocalUser } from '../../hooks/useAuth';
import { UserMenu } from '../auth/UserMenu';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenNewOSModal: () => void;
  onOpenSettingsModal: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  dataSource: 'supabase' | 'local';
  user: SupabaseUser | LocalUser | null;
  onOpenAuthModal: () => void;
  onOpenResetPasswordModal: () => void;
  onSignOut: () => Promise<void>;
  isSupabaseConfigured: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenNewOSModal,
  onOpenSettingsModal,
  theme,
  toggleTheme,
  dataSource,
  user,
  onOpenAuthModal,
  onOpenResetPasswordModal,
  onSignOut,
  isSupabaseConfigured,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-light-card border-b border-light-border dark:bg-dark-card dark:border-dark-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo e Identificação */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-base tracking-wider font-mono-code">
              FP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-light-text dark:text-dark-text">
                  FLUXPRO
                </span>
                <span className="text-[10px] uppercase font-mono-code px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                  Projetista OS
                </span>
              </div>
              <p className="text-[11px] text-light-muted dark:text-dark-muted hidden sm:block">
                Cortes, Materiais e Produção
              </p>
            </div>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por OS, cliente, projeto ou ambiente..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded text-light-text dark:text-dark-text placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Ações do Topo */}
          <div className="flex items-center gap-2">
            
            {/* Status do Banco de Dados / Supabase */}
            <button
              onClick={onOpenSettingsModal}
              title={dataSource === 'supabase' ? 'Conectado ao Supabase' : 'Modo Local Ativo (Clique para configurar Supabase)'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span className="hidden lg:inline">
                {dataSource === 'supabase' ? 'Supabase Online' : 'Banco Local'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  dataSource === 'supabase' ? 'bg-neutral-900 dark:bg-neutral-100' : 'bg-amber-500'
                }`}
              />
            </button>

            {/* Alternador de Tema Light / Dark (Tons de Preto) */}
            <button
              onClick={toggleTheme}
              aria-label="Alternar tema de cores"
              className="p-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text transition-colors"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-neutral-200" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-700" />
              )}
            </button>

            {/* Menu de Perfil / Autenticação */}
            <UserMenu
              user={user}
              onOpenAuthModal={onOpenAuthModal}
              onOpenResetPasswordModal={onOpenResetPasswordModal}
              onOpenSettingsModal={onOpenSettingsModal}
              onSignOut={onSignOut}
              isSupabaseConfigured={isSupabaseConfigured}
            />

            {/* Botão Principal: Nova OS */}
            <button
              onClick={onOpenNewOSModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nova OS</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
