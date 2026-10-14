import React from 'react';
import { OrdemServico, ItemPlanta } from '../../types';
import { OSStatusBadge, OSPrioridadeBadge, TagBadge } from '../common/Badge';
import { areTagsEqual } from '../../lib/tags';
import { DeliveryCountdown } from '../common/DeliveryCountdown';
import {
  Scissors,
  Package,
  Layers,
  Trash2,
  AlertTriangle,
  FolderOpen,
  ChevronRight,
  MapPin,
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
}) => {
  if (orders.length === 0) {
    return (
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-12 text-center shadow-sm">
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
            ? order.ambiente.split(/[,;/+]+/).map((s) => s.trim()).filter(Boolean)
            : [];

        const materiais = order.materiais || [];
        const totalMateriais = materiais.length;
        const materiaisSeparados = materiais.filter((m) => m.status_separacao === 'separado').length;
        const separacaoPercent = totalMateriais > 0 ? Math.round((materiaisSeparados / totalMateriais) * 100) : 0;

        return (
          <div
            key={order.id}
            onClick={() => onSelectOrder(order)}
            className="group cursor-pointer bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-black dark:hover:border-white rounded-lg p-4 sm:p-5 transition-all shadow-sm hover:shadow-md"
          >
            {/* Linha Superior: Identificação, Projeto, Status e Prazos */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
              
              {/* Esquerda: OS + Título do Projeto + Cliente + Tags */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-code font-bold text-xs tracking-tight text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface px-2 py-0.5 rounded border border-light-border dark:border-dark-border">
                    {order.numero_os}
                  </span>

                  <h3 className="text-sm sm:text-base font-bold text-light-text dark:text-dark-text group-hover:text-black dark:group-hover:text-white transition-colors truncate">
                    {order.nome_projeto}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-light-muted dark:text-dark-muted">
                  <span>
                    Cliente: <strong className="font-semibold text-light-text dark:text-dark-text">{order.cliente}</strong>
                  </span>

                  {order.telefone_cliente && (
                    <>
                      <span>•</span>
                      <span>{order.telefone_cliente}</span>
                    </>
                  )}

                  {orderAmbientesList.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-mono-code text-[11px]">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {orderAmbientesList.length} {orderAmbientesList.length === 1 ? 'ambiente' : 'ambientes'}
                      </span>
                    </>
                  )}
                </div>

                {/* Etiquetas / Tags do Projeto (Estilo Trello) */}
                {order.tags && order.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {order.tags.map((t) => (
                      <TagBadge
                        key={t}
                        tag={t}
                        selected={Boolean(selectedTag && areTagsEqual(selectedTag, t))}
                        onClick={
                          onSelectTag
                            ? () => onSelectTag(selectedTag && areTagsEqual(selectedTag, t) ? '' : t)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Direita: Status, Prioridade, Previsão e Ações */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 lg:pt-0">
                <OSStatusBadge status={order.status} />
                <OSPrioridadeBadge prioridade={order.prioridade} />

                <div className="text-xs">
                  <DeliveryCountdown
                    dateStr={order.previsao_entrega}
                    isDelivered={order.status === 'entregue'}
                  />
                </div>

                <div className="flex items-center gap-1 pl-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Deseja realmente excluir a OS "${order.numero_os}"?`)) {
                        onDeleteOrder(order.id);
                      }
                    }}
                    title="Excluir OS"
                    className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="p-1 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </div>

            {/* Linha Inferior: Faixa de Produção Limpa (Peças, Corte CNC, Insumos) */}
            <div className="mt-3.5 pt-3 border-t border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-light-muted dark:text-dark-muted">
                
                {/* Peças da Obra */}
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="font-mono-code font-semibold text-light-text dark:text-dark-text">
                    {totalItens} {totalItens === 1 ? 'peça' : 'peças'}
                  </span>
                  {itensSemArquivo > 0 ? (
                    <span className="text-[11px] font-mono-code text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      {itensSemArquivo} sem arquivo CNC
                    </span>
                  ) : totalItens > 0 ? (
                    <span className="text-[11px] text-neutral-500 font-mono-code">
                      ({itensProntos}/{totalItens} prontos)
                    </span>
                  ) : null}
                </div>

                <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">•</span>

                {/* Status do Corte CNC */}
                <div className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>Corte:</span>
                  {isCutApproved ? (
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      Liberado ({cutChapasCount} {cutChapasCount === 1 ? 'chapa' : 'chapas'})
                    </span>
                  ) : (
                    <span className="text-amber-800 dark:text-amber-400 font-medium">
                      Pendente de validação
                    </span>
                  )}
                </div>

                <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">•</span>

                {/* Status de Insumos / Almoxarifado */}
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>Insumos:</span>
                  {totalMateriais === 0 ? (
                    <span className="text-neutral-400">Sem materiais</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-code font-semibold text-light-text dark:text-dark-text">
                        {materiaisSeparados}/{totalMateriais}
                      </span>
                      <div className="w-12 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-black dark:bg-white transition-all"
                          style={{ width: `${separacaoPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono-code">
                        {separacaoPercent}%
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Dica sutil de clique para abrir a obra completa */}
              <div className="text-[11px] text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors flex items-center gap-1 font-medium ml-auto">
                <span>Abrir obra</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};
