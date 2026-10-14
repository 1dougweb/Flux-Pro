import React from 'react';
import { Scissors, Package, AlertCircle, Layers } from 'lucide-react';
import { ViewFilter } from '../../types';

interface DashboardMetricsProps {
  metrics: {
    totalAtivas: number;
    cortePendenteCount: number;
    separacaoPendenteCount: number;
    atrasadasCount: number;
    proximasCount: number;
  };
  currentFilter: ViewFilter;
  setFilter: (f: ViewFilter) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  metrics,
  currentFilter,
  setFilter,
}) => {
  const cards = [
    {
      id: 'corte_pendente' as ViewFilter,
      label: 'Planos de Corte Pendentes',
      value: metrics.cortePendenteCount,
      subtext: 'Projetos sem corte liberado para fábrica',
      icon: Scissors,
      alert: metrics.cortePendenteCount > 0,
      alertType: 'warning',
    },
    {
      id: 'separacao_pendente' as ViewFilter,
      label: 'Separação de Materiais',
      value: metrics.separacaoPendenteCount,
      subtext: 'OS com chapas ou ferragens pendentes',
      icon: Package,
      alert: metrics.separacaoPendenteCount > 0,
      alertType: 'warning',
    },
    {
      id: 'urgentes_atrasadas' as ViewFilter,
      label: 'Entregas Atrasadas',
      value: metrics.atrasadasCount,
      subtext: `${metrics.proximasCount} entregas nos próximos 3 dias`,
      icon: AlertCircle,
      alert: metrics.atrasadasCount > 0,
      alertType: 'danger',
    },
    {
      id: 'todas' as ViewFilter,
      label: 'Ordens de Serviço Ativas',
      value: metrics.totalAtivas,
      subtext: 'Total de projetos em andamento',
      icon: Layers,
      alert: false,
      alertType: 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = currentFilter === card.id;

        return (
          <button
            key={card.label}
            onClick={() => setFilter(card.id)}
            className={`text-left p-4 rounded border transition-all ${
              isSelected
                ? 'border-black dark:border-white bg-light-surface dark:bg-dark-surface'
                : 'border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card hover:border-neutral-400 dark:hover:border-neutral-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-light-muted dark:text-dark-muted">
                {card.label}
              </span>
              <div
                className={`p-1.5 rounded ${
                  card.alert && card.alertType === 'danger'
                    ? 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200'
                    : card.alert && card.alertType === 'warning'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono-code text-light-text dark:text-dark-text tracking-tight">
                {card.value}
              </span>
              {card.alert && (
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  ação requerida
                </span>
              )}
            </div>

            <p className="text-[11px] text-light-muted dark:text-dark-muted mt-1 truncate">
              {card.subtext}
            </p>
          </button>
        );
      })}
    </div>
  );
};
