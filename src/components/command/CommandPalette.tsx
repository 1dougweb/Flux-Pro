import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FolderKanban,
  FilePlus,
  Moon,
  Sun,
  Database,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Tag,
  X,
  FolderOpen,
} from 'lucide-react';
import { OrdemServico, ViewFilter } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrdemServico[];
  onSelectProject: (orderId: string) => void;
  onNewProject: () => void;
  onSelectFilter: (filter: ViewFilter) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenFileManager?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  orders,
  onSelectProject,
  onNewProject,
  onSelectFilter,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenFileManager,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Teclado: Escape fecha, setas navegam, Enter executa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Filtrar projetos
  const matchedProjects = orders
    .filter(
      (o) =>
        o.nome_projeto.toLowerCase().includes(normalizedQuery) ||
        o.cliente.toLowerCase().includes(normalizedQuery) ||
        o.numero_os.toLowerCase().includes(normalizedQuery) ||
        o.tags?.some((t) => t.toLowerCase().includes(normalizedQuery))
    )
    .slice(0, 5);

  // Ações de sistema
  const quickActions = [
    {
      id: 'action-new-project',
      title: 'Criar Novo Projeto',
      subtitle: 'Adicionar nova obra ou OS ao workspace',
      icon: FilePlus,
      action: () => {
        onNewProject();
        onClose();
      },
    },
    {
      id: 'action-kanban',
      title: 'Abrir Quadro Geral de Produção',
      subtitle: 'Visão Kanban global de todas as obras',
      icon: FolderKanban,
      action: () => {
        onSelectFilter('kanban');
        onClose();
      },
    },
    {
      id: 'action-urgencies',
      title: 'Ver Prazos & Entregas Críticas',
      subtitle: 'Filtrar obras que precisam de atenção imediata',
      icon: AlertTriangle,
      action: () => {
        onSelectFilter('urgentes_atrasadas');
        onClose();
      },
    },
    {
      id: 'action-files-library',
      title: 'Biblioteca de Arquivos & Vetores',
      subtitle: 'Gerenciar, fazer upload e organizar arquivos de corte e gabaritos',
      icon: FolderOpen,
      action: () => {
        if (onOpenFileManager) onOpenFileManager();
        onClose();
      },
    },
    {
      id: 'action-theme',
      title: theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro',
      subtitle: `Atualmente em modo ${theme === 'dark' ? 'escuro' : 'claro'}`,
      icon: theme === 'dark' ? Sun : Moon,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'action-settings',
      title: 'Configurações de Banco & Nuvem',
      subtitle: 'Conectar ou sincronizar com o Supabase',
      icon: Database,
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
  ].filter(
    (a) =>
      a.title.toLowerCase().includes(normalizedQuery) ||
      a.subtitle.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Caixa do Command Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Barra de Busca Superior */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite para buscar projetos, clientes ou comandos rápidos..."
            className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono-code font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {/* Seção: Projetos Encontrados */}
          {matchedProjects.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1 text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 font-semibold">
                Projetos & Obras
              </div>
              <div className="space-y-0.5">
                {matchedProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/80 group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center font-mono-code text-xs font-semibold shrink-0">
                        {p.numero_os.slice(-3)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {p.nome_projeto}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {p.cliente} • {p.previsao_entrega}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seção: Ações Rápidas */}
          {quickActions.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1 text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 font-semibold">
                Comandos & Ações Rápidas
              </div>
              <div className="space-y-0.5">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/80 group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {action.title}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {action.subtitle}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vazio */}
          {matchedProjects.length === 0 && quickActions.length === 0 && (
            <div className="py-12 text-center text-zinc-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum resultado encontrado para &quot;{query}&quot;</p>
              <p className="text-xs text-zinc-500 mt-1">
                Tente buscar pelo nome do cliente, código da OS ou projeto.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé com dicas de atalho */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 font-mono-code bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded mr-1">
                ↵
              </kbd>
              para selecionar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 font-mono-code bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded mr-1">
                esc
              </kbd>
              para fechar
            </span>
          </div>
          <span className="font-mono-code text-[11px]">FLUXPRO 2.0</span>
        </div>
      </div>
    </div>
  );
};
