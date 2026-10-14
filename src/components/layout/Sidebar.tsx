import React from 'react';
import {
  FileText,
  Scissors,
  Package,
  Wrench,
  AlertOctagon,
  Kanban,
  Tag,
  X,
} from 'lucide-react';
import { ViewFilter } from '../../types';
import { TagBadge } from '../common/Badge';
import { areTagsEqual } from '../../lib/tags';

interface SidebarProps {
  currentFilter: ViewFilter;
  setFilter: (f: ViewFilter) => void;
  metrics: {
    totalAtivas: number;
    cortePendenteCount: number;
    separacaoPendenteCount: number;
    atrasadasCount: number;
    proximasCount: number;
    totalItensPlanta?: number;
  };
  allTags?: string[];
  selectedTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  setFilter,
  metrics,
  allTags = [],
  selectedTag,
  onSelectTag,
}) => {
  const navItems = [
    {
      id: 'todas' as ViewFilter,
      label: 'Todas as Obras (OS)',
      icon: FileText,
      count: metrics.totalAtivas,
      badgeColor: 'neutral',
    },
    {
      id: 'kanban' as ViewFilter,
      label: 'Quadro Kanban',
      icon: Kanban,
      count: undefined,
      badgeColor: 'neutral',
    },
    {
      id: 'corte_pendente' as ViewFilter,
      label: 'Cortes Pendentes',
      icon: Scissors,
      count: metrics.cortePendenteCount,
      badgeColor: metrics.cortePendenteCount > 0 ? 'warning' : 'neutral',
      hint: 'Antiesquecimento',
    },
    {
      id: 'separacao_pendente' as ViewFilter,
      label: 'Separação de Materiais',
      icon: Package,
      count: metrics.separacaoPendenteCount,
      badgeColor: metrics.separacaoPendenteCount > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'urgentes_atrasadas' as ViewFilter,
      label: 'Prazos & Urgências',
      icon: AlertOctagon,
      count: metrics.atrasadasCount,
      badgeColor: metrics.atrasadasCount > 0 ? 'danger' : 'neutral',
    },
    {
      id: 'em_producao' as ViewFilter,
      label: 'Em Produção',
      icon: Wrench,
      count: undefined,
      badgeColor: 'neutral',
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-3">
      {/* Bloco de Filtros da Produção */}
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded p-3">
        <div className="px-2 pb-2 mb-2 border-b border-light-border dark:border-dark-border">
          <p className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Filtros da Produção
          </p>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentFilter === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 lg:shrink w-full text-left ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-light-surface dark:hover:bg-dark-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[11px] font-mono-code border ${
                      isActive
                        ? 'border-white/30 text-white dark:border-black/30 dark:text-black'
                        : item.badgeColor === 'danger'
                        ? 'border-red-200 bg-red-100 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                        : item.badgeColor === 'warning'
                        ? 'border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>


      {/* Bloco de Tags do Projeto (Comunicação Visual) */}
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded p-3">
        <div className="px-2 pb-2 mb-2.5 border-b border-light-border dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-neutral-500" />
            <p className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Tags do Projeto
            </p>
          </div>

          {selectedTag && onSelectTag && (
            <button
              type="button"
              onClick={() => onSelectTag(null)}
              className="inline-flex items-center gap-1 text-[10px] text-neutral-500 hover:text-black dark:hover:text-white underline underline-offset-2"
              title="Limpar filtro de tag"
            >
              <X className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {allTags.length === 0 ? (
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 px-2 py-1 italic">
            Nenhuma tag cadastrada ainda.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 px-1">
            {allTags.map((tag) => {
              const isSelected = Boolean(selectedTag && areTagsEqual(selectedTag, tag));
              return (
                <TagBadge
                  key={tag}
                  tag={tag}
                  selected={isSelected}
                  onClick={onSelectTag ? () => onSelectTag(isSelected ? null : tag) : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
