import React, { useState } from 'react';
import { OrdemServico, ItemPlanta } from '../../types';
import { OSStatusBadge, OSPrioridadeBadge, StatusCorteBadge, TagBadge, AmbienteBadge } from '../common/Badge';
import { DeliveryCountdown } from '../common/DeliveryCountdown';
import { MaterialProgressBar } from '../materials/MaterialProgressBar';
import { ItemPlantaTable } from '../planta/ItemPlantaTable';
import {
  Scissors,
  Package,
  Calendar,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Trash2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

interface OSListProps {
  orders: OrdemServico[];
  onSelectOrder: (order: OrdemServico) => void;
  onDeleteOrder: (orderId: string) => void;
  selectedTag?: string | null;
  onSelectTag?: (tag: string) => void;
  selectedAmbientes?: string[];
  onToggleAmbiente?: (ambiente: string) => void;
  onAddItemPlanta?: (
    osId: string,
    item: Omit<ItemPlanta, 'id' | 'os_id' | 'created_at'>
  ) => Promise<void>;
  onUpdateItemPlanta?: (
    osId: string,
    itemId: string,
    partial: Partial<ItemPlanta>
  ) => Promise<void>;
  onRemoveItemPlanta?: (osId: string, itemId: string) => Promise<void>;
  onCycleItemPlantaStatus?: (osId: string, itemId: string) => Promise<void>;
}

export const OSList: React.FC<OSListProps> = ({
  orders,
  onSelectOrder,
  onDeleteOrder,
  selectedTag,
  onSelectTag,
  selectedAmbientes = [],
  onToggleAmbiente,
  onAddItemPlanta,
  onUpdateItemPlanta,
  onRemoveItemPlanta,
  onCycleItemPlantaStatus,
}) => {
  const [expandedOsIds, setExpandedOsIds] = useState<Set<string>>(new Set());

  const toggleExpand = (osId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOsIds((prev) => {
      const next = new Set(prev);
      if (next.has(osId)) {
        next.delete(osId);
      } else {
        next.add(osId);
      }
      return next;
    });
  };

  if (orders.length === 0) {
    return (
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded p-12 text-center">
        <FolderOpen className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-600 mb-3" />
        <h3 className="text-base font-semibold text-light-text dark:text-dark-text mb-1">
          Nenhuma Ordem de Serviço encontrada
        </h3>
        <p className="text-xs text-light-muted dark:text-dark-muted max-w-sm mx-auto">
          Tente ajustar os filtros ou a busca no topo da página para visualizar outros projetos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const isCutApproved = Boolean(order.plano_corte?.aprovado_producao);
        const cutChapasCount = order.plano_corte?.total_chapas || 0;
        const isExpanded = expandedOsIds.has(order.id);
        const totalItens = order.itens_planta?.length || 0;
        const itensSemArquivo = (order.itens_planta || []).filter(
          (it) => !it.arquivo_corte_url && !it.arquivo_corte_nome
        ).length;
        const itensProntos = (order.itens_planta || []).filter(
          (it) => it.status_item === 'pronto_instalacao' || it.status_item === 'instalado'
        ).length;
        const orderAmbientesList =
          order.ambientes && order.ambientes.length > 0
            ? order.ambientes
            : order.ambiente
            ? [order.ambiente]
            : [];

        return (
          <div
            key={order.id}
            onClick={() => onSelectOrder(order)}
            className="group cursor-pointer bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-black dark:hover:border-white rounded p-4 transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Identificação e Projeto */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono-code font-bold text-sm tracking-tight text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface px-2 py-0.5 rounded border border-light-border dark:border-dark-border">
                    {order.numero_os}
                  </span>
                  <OSStatusBadge status={order.status} />
                  <OSPrioridadeBadge prioridade={order.prioridade} />
                  
                  {/* Badges de Ambientes da Obra (Interativos) */}
                  {orderAmbientesList.map((amb) => (
                    <AmbienteBadge
                      key={amb}
                      ambiente={amb}
                      selected={selectedAmbientes.includes(amb)}
                      onClick={
                        onToggleAmbiente
                          ? () => onToggleAmbiente(amb)
                          : undefined
                      }
                    />
                  ))}
                </div>

                <h3 className="text-base font-bold text-light-text dark:text-dark-text group-hover:underline underline-offset-2 truncate">
                  {order.nome_projeto}
                </h3>

                <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                  Cliente: <span className="font-medium text-light-text dark:text-dark-text">{order.cliente}</span>
                  {order.telefone_cliente && ` • ${order.telefone_cliente}`}
                </p>

                {order.tags && order.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {order.tags.map((t) => (
                      <TagBadge
                        key={t}
                        tag={t}
                        selected={selectedTag === t}
                        onClick={
                          onSelectTag
                            ? () => onSelectTag(selectedTag === t ? '' : t)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Status do Plano de Corte (Destaque Antiesquecimento) */}
              <div className="lg:w-56 shrink-0 p-2.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                <div className="flex items-center justify-between text-xs mb-1 font-medium">
                  <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                    <Scissors className="w-3.5 h-3.5" />
                    Plano de Corte
                  </span>
                  <StatusCorteBadge
                    status={order.plano_corte?.status_corte || 'nao_iniciado'}
                    aprovado={isCutApproved}
                  />
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {isCutApproved ? (
                    <span className="text-neutral-800 dark:text-neutral-200 font-mono-code">
                      {cutChapasCount} {cutChapasCount === 1 ? 'chapa especificada' : 'chapas especificadas'}
                    </span>
                  ) : (
                    <span className="text-amber-800 dark:text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Pendente de validação
                    </span>
                  )}
                </div>
              </div>

              {/* Status de Materiais */}
              <div className="lg:w-48 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>Separação</span>
                </div>
                <MaterialProgressBar materiais={order.materiais} compact />
              </div>

              {/* Previsão de Entrega e Ações */}
              <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-light-border dark:border-dark-border">
                <div className="text-right">
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-0.5">
                    Previsão de Entrega
                  </div>
                  <DeliveryCountdown
                    dateStr={order.previsao_entrega}
                    isDelivered={order.status === 'entregue'}
                  />
                </div>

                <div className="flex items-center gap-1 pl-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Deseja realmente excluir a OS "${order.numero_os}"?`)) {
                        onDeleteOrder(order.id);
                      }
                    }}
                    title="Excluir OS"
                    className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-1.5 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </div>

            {/* Barra de Expansão dos Itens da Obra */}
            <div className="mt-3 pt-2.5 border-t border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => toggleExpand(order.id, e)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded border transition-colors ${
                  isExpanded
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold'
                    : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
                title="Expandir ou recolher os itens desta obra"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {isExpanded ? 'Ocultar Itens da Obra' : `Ver Itens da Obra (${totalItens})`}
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Resumo de Peças, Prontos e Arquivos de Corte */}
              <div className="flex items-center gap-2 text-[11px] font-mono-code text-light-muted dark:text-dark-muted">
                <span>
                  {totalItens} {totalItens === 1 ? 'peça' : 'peças'}
                </span>
                {itensProntos > 0 && (
                  <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
                    • {itensProntos}/{totalItens} prontos
                  </span>
                )}
                {itensSemArquivo > 0 ? (
                  <span className="text-amber-800 dark:text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {itensSemArquivo} sem arquivo de corte
                  </span>
                ) : totalItens > 0 ? (
                  <span className="text-neutral-600 dark:text-neutral-400">
                    • Arquivos de corte OK
                  </span>
                ) : null}
              </div>
            </div>

            {/* Tabela de Itens Expandida Exclusiva desta OS */}
            {isExpanded && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-3 pt-3 border-t border-light-border dark:border-dark-border space-y-2 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-light-text dark:text-dark-text flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Peças da Obra: {order.numero_os} - {order.nome_projeto}</span>
                  </h4>
                  <span className="text-[10px] text-light-muted dark:text-dark-muted">
                    Alteração de etapas e arquivos de corte salvos automaticamente
                  </span>
                </div>

                <ItemPlantaTable
                  osId={order.id}
                  osAmbientes={orderAmbientesList}
                  itens={order.itens_planta || []}
                  showOSColumn={false}
                  onAddItem={onAddItemPlanta}
                  onUpdateItem={onUpdateItemPlanta}
                  onRemoveItem={onRemoveItemPlanta}
                  onCycleStatus={onCycleItemPlantaStatus}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
