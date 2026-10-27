import React from 'react';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Package,
  Layers,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { OrdemServico } from '../../types';
import {
  mapOSStatusToModern,
  mapPriorityStyle,
  getProjectHealth,
  calculateProjectProgress,
} from '../../types/project';

interface ProjectCardProps {
  order: OrdemServico;
  onOpen: (id: string) => void;
  onEdit?: (order: OrdemServico) => void;
  onDelete?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  order,
  onOpen,
  onEdit,
  onDelete,
}) => {
  const statusInfo = mapOSStatusToModern(order.status);
  const priorityInfo = mapPriorityStyle(order.prioridade);
  const healthInfo = getProjectHealth(order);
  const progress = calculateProjectProgress(order);

  // Análise de cortes e materiais
  const totalItens = order.itens_planta?.length || 0;
  const itensCortados =
    order.itens_planta?.filter(
      (it) => it.status_corte === 'cortado' || it.status_corte === 'liberado'
    ).length || 0;
  const materiaisCount = order.materiais?.length || 0;
  const materiaisSeparados =
    order.materiais?.filter((m) => m.status_separacao === 'separado').length || 0;

  return (
    <div
      onClick={() => onOpen(order.id)}
      className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between"
    >
      {/* Topo do Card: Código, Status & Prioridade */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono-code text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {order.numero_os}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusInfo.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
              {statusInfo.label}
            </span>
          </div>

          <span
            className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${priorityInfo.badgeClass}`}
          >
            {priorityInfo.label}
          </span>
        </div>

        {/* Título do Projeto e Cliente */}
        <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
          {order.nome_projeto}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mb-3">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{order.cliente}</span>
        </p>

        {/* Tags */}
        {order.tags && order.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {order.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400"
              >
                #{tag}
              </span>
            ))}
            {order.tags.length > 3 && (
              <span className="text-[10px] text-zinc-400 px-1">
                +{order.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Meio e Base: Progresso & Indicadores Operacionais */}
      <div>
        {/* Barra de Progresso do Projeto */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium text-[11px]">
              Progresso Geral
            </span>
            <span className="font-mono-code text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              {progress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progress === 100
                  ? 'bg-emerald-500'
                  : progress >= 60
                  ? 'bg-blue-600'
                  : 'bg-zinc-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Badges de Entregáveis e Materiais */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 py-2 border-t border-zinc-100 dark:border-zinc-800/80 mb-2">
          <div className="flex items-center gap-1" title="Peças / Itens de corte">
            <Scissors className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono-code text-[11px]">
              {itensCortados}/{totalItens}
            </span>
          </div>
          {materiaisCount > 0 && (
            <div className="flex items-center gap-1" title="Separação de materiais">
              <Package className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-mono-code text-[11px]">
                {materiaisSeparados}/{materiaisCount}
              </span>
            </div>
          )}
        </div>

        {/* Rodapé: Prazo & Ação de Abertura */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span
              className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${healthInfo.badgeClass}`}
            >
              {healthInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <span>Ver projeto</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
