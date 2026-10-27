import React from 'react';
import {
  FolderKanban,
  Kanban,
  AlertTriangle,
  Scissors,
  Package,
  Layers,
  Sparkles,
  ChevronRight,
  Plus,
  Settings,
  LogOut,
  Tag as TagIcon,
  X,
  Compass,
  FolderOpen,
} from 'lucide-react';
import { ViewFilter, OrdemServico } from '../../types';

interface ModernSidebarProps {
  currentFilter: ViewFilter;
  setFilter: (f: ViewFilter) => void;
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  orders: OrdemServico[];
  metrics: {
    totalAtivas: number;
    cortePendenteCount: number;
    separacaoPendenteCount: number;
    atrasadasCount: number;
    proximasCount: number;
  };
  onOpenNewProject: () => void;
  onOpenSettings: () => void;
  user: any;
  onSignOut: () => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  allTags: string[];
  onOpenFileManager?: () => void;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  currentFilter,
  setFilter,
  activeProjectId,
  onSelectProject,
  orders,
  metrics,
  onOpenNewProject,
  onOpenSettings,
  user,
  onSignOut,
  selectedTag,
  onSelectTag,
  allTags,
  onOpenFileManager,
}) => {
  const activeOrders = orders
    .filter((o) => o.status !== 'entregue' && o.status !== 'cancelado')
    .slice(0, 6);

  const mainNav = [
    {
      id: 'todas' as ViewFilter,
      label: 'Hub de Projetos',
      icon: FolderKanban,
      count: metrics.totalAtivas,
    },
    {
      id: 'kanban' as ViewFilter,
      label: 'Quadro Geral',
      icon: Kanban,
    },
    {
      id: 'urgentes_atrasadas' as ViewFilter,
      label: 'Prazos & Urgências',
      icon: AlertTriangle,
      count: metrics.atrasadasCount + metrics.proximasCount,
      alert: metrics.atrasadasCount > 0,
    },
    {
      id: 'corte_pendente' as ViewFilter,
      label: 'Cortes CNC & CAM',
      icon: Scissors,
      count: metrics.cortePendenteCount,
    },
    {
      id: 'separacao_pendente' as ViewFilter,
      label: 'Materiais & Insumos',
      icon: Package,
      count: metrics.separacaoPendenteCount,
    },
  ];

  return (
    <aside className="w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col shrink-0 select-none">
      {/* Cabeçalho do Workspace */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold font-mono-code text-sm shadow-sm">
              FP
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                FLUXPRO
                <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  2.0
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Gestão de Projetos
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Criação Rápida */}
        <button
          onClick={onOpenNewProject}
          className="mt-3.5 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 font-medium">
            Visualizações
          </div>
          <nav className="space-y-0.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeProjectId === null && currentFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectProject(null);
                    setFilter(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`font-mono-code text-[11px] px-1.5 py-0.5 rounded-full ${
                        item.alert
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-bold'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            {onOpenFileManager && (
              <button
                onClick={onOpenFileManager}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Biblioteca de Arquivos</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Projetos Ativos Recentes */}
        {activeOrders.length > 0 && (
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 font-medium">
              <span>Projetos em Andamento</span>
              <span className="text-[10px] font-normal">{activeOrders.length}</span>
            </div>
            <div className="space-y-0.5">
              {activeOrders.map((order) => {
                const isSelected = activeProjectId === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => onSelectProject(order.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors group ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="truncate">{order.nome_projeto}</span>
                    </div>
                    <span className="text-[10px] font-mono-code text-zinc-400 opacity-60 group-hover:opacity-100 shrink-0">
                      {order.numero_os.slice(-3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtros por Tags */}
        {allTags.length > 0 && (
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 font-medium">
              <span>Etiquetas</span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 px-1">
              {allTags.slice(0, 10).map((tag) => {
                const isTagActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(isTagActive ? null : tag)}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-mono-code transition-colors ${
                      isTagActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé: Usuário e Ajustes */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-medium text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-200 truncate">
                {user?.email?.split('@')[0] || 'Usuário'}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                {user?.email || 'Modo Local'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              title="Configurações de Banco"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onSignOut}
              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
