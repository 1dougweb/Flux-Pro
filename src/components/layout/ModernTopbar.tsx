import React from 'react';
import {
  Search,
  Moon,
  Sun,
  Database,
  Cloud,
  HardDrive,
  Plus,
  ChevronRight,
  FolderKanban,
} from 'lucide-react';
import { OrdemServico } from '../../types';

interface ModernTopbarProps {
  activeProject?: OrdemServico | null;
  onBackToProjects: () => void;
  onOpenCommandPalette: () => void;
  onOpenNewProject: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  dataSource: 'supabase' | 'local';
}

export const ModernTopbar: React.FC<ModernTopbarProps> = ({
  activeProject,
  onBackToProjects,
  onOpenCommandPalette,
  onOpenNewProject,
  theme,
  onToggleTheme,
  dataSource,
}) => {
  return (
    <header className="h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 select-none shrink-0">
      {/* Breadcrumbs de Navegação */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBackToProjects}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Projetos</span>
        </button>

        {activeProject && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono-code text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold shrink-0">
                {activeProject.numero_os}
              </span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {activeProject.nome_projeto}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Barra Central: Pesquisa Rápida (Atalho para Command Palette) */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-400 dark:text-zinc-500 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
            <span>Buscar projetos, tarefas ou clientes...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono-code bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-500 rounded">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Ações do Lado Direito */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Indicador de Conexão Supabase / Local */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-code border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
          title={
            dataSource === 'supabase'
              ? 'Sincronizado na Nuvem (Supabase)'
              : 'Armazenamento Local no Navegador'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dataSource === 'supabase' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="hidden sm:inline">
            {dataSource === 'supabase' ? 'Nuvem' : 'Local'}
          </span>
        </div>

        {/* Alternador de Tema */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Botão Novo Projeto no Topbar */}
        <button
          onClick={onOpenNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Novo</span>
        </button>
      </div>
    </header>
  );
};
