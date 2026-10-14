import React, { useState } from 'react';
import { OrdemServico, OSStatus, TipoMaquinaCorte } from '../../types';
import { DeliveryCountdown } from '../common/DeliveryCountdown';
import { MaterialProgressBar } from '../materials/MaterialProgressBar';
import { StatusCorteBadge, TagBadge, AmbienteBadge } from '../common/Badge';
import { TagManagerModal } from '../tags/TagManagerModal';
import { areTagsEqual } from '../../lib/tags';
import {
  ChevronRight,
  ChevronLeft,
  Scissors,
  Package,
  Layers,
  GripVertical,
  ArrowRight,
  Zap,
  Check,
  ArrowRightLeft,
  Cpu,
  Sparkles,
  AlertTriangle,
  MapPin,
  Plus,
  Tag as TagIcon,
} from 'lucide-react';

interface OSKanbanProps {
  orders: OrdemServico[];
  onSelectOrder: (order: OrdemServico) => void;
  onChangeStatus: (osId: string, newStatus: OSStatus) => void;
  selectedTag?: string | null;
  onSelectTag?: (tag: string) => void;
  selectedAmbientes?: string[];
  onToggleAmbiente?: (ambiente: string) => void;
  allTags?: string[];
  onToggleTag?: (osId: string, tag: string) => void;
}

interface ColumnDef {
  status: OSStatus;
  title: string;
  description: string;
  accentColor: string;
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'layout_aprovado',
    title: 'Layout / Medição',
    description: 'Medição conferida e layout 3D aprovado',
    accentColor: 'border-neutral-400 dark:border-neutral-600',
  },
  {
    status: 'corte_pendente',
    title: 'Arquivos CNC / Router',
    description: 'Vetores DXF/EPS para Router, Laser e Plotter',
    accentColor: 'border-amber-500',
  },
  {
    status: 'separacao_pendente',
    title: 'Separação de Materiais',
    description: 'ACM, Acrílico, LEDs, Fontes e Serralheria',
    accentColor: 'border-neutral-500',
  },
  {
    status: 'em_producao',
    title: 'Usinagem & Produção',
    description: 'Dobra de bandejas, solda, montagem e teste LED',
    accentColor: 'border-black dark:border-white',
  },
  {
    status: 'pronto_entrega',
    title: 'Pronto / Instalação',
    description: 'Gabarito 1:1 pronto e equipe na obra',
    accentColor: 'border-neutral-400 dark:border-neutral-600',
  },
];

export const OSKanban: React.FC<OSKanbanProps> = ({
  orders,
  onSelectOrder,
  onChangeStatus,
  selectedTag,
  onSelectTag,
  selectedAmbientes = [],
  onToggleAmbiente,
  allTags = [],
  onToggleTag,
}) => {
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<OSStatus | null>(null);
  const [quickMoveOpenId, setQuickMoveOpenId] = useState<string | null>(null);
  const [tagModalOrder, setTagModalOrder] = useState<OrdemServico | null>(null);

  const draggedOrder = orders.find((o) => o.id === draggedOrderId);

  const getOrdersForStatus = (status: OSStatus) => {
    if (status === 'layout_aprovado') {
      return orders.filter((o) => o.status === 'layout_aprovado' || o.status === 'medicao_visita');
    }
    if (status === 'pronto_entrega') {
      return orders.filter((o) => o.status === 'pronto_entrega' || o.status === 'entregue');
    }
    return orders.filter((o) => o.status === status);
  };

  const getNextStatus = (current: OSStatus): OSStatus | null => {
    switch (current) {
      case 'medicao_visita':
      case 'layout_aprovado':
        return 'corte_pendente';
      case 'corte_pendente':
        return 'separacao_pendente';
      case 'separacao_pendente':
        return 'em_producao';
      case 'em_producao':
        return 'pronto_entrega';
      case 'pronto_entrega':
        return 'entregue';
      default:
        return null;
    }
  };

  const getPrevStatus = (current: OSStatus): OSStatus | null => {
    switch (current) {
      case 'corte_pendente':
        return 'layout_aprovado';
      case 'separacao_pendente':
        return 'corte_pendente';
      case 'em_producao':
        return 'separacao_pendente';
      case 'pronto_entrega':
        return 'em_producao';
      case 'entregue':
        return 'pronto_entrega';
      default:
        return null;
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    setQuickMoveOpenId(null);
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: OSStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colStatus) {
      setDragOverColumn(colStatus);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colStatus: OSStatus) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === colStatus) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, colStatus: OSStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (orderId) {
      onChangeStatus(orderId, colStatus);
    }
    setDraggedOrderId(null);
    setDragOverColumn(null);
  };

  // Helper para identificar as máquinas de uma OS
  const getMachinesSummary = (order: OrdemServico) => {
    const set = new Set<string>();
    if (order.plano_corte?.maquina_principal) {
      set.add(order.plano_corte.maquina_principal);
    }
    (order.itens_planta || []).forEach((it) => {
      if (it.maquina_corte === 'router_cnc') set.add('Router CNC');
      if (it.maquina_corte === 'laser') set.add('Laser');
      if (it.maquina_corte === 'plotter_recorte') set.add('Plotter');
    });
    return Array.from(set);
  };

  // Helper para verificar se possui LED
  const hasLED = (order: OrdemServico) => {
    return (
      (order.itens_planta || []).some((i) => i.iluminado) ||
      (order.materiais || []).some((m) => m.categoria === 'iluminacao')
    );
  };

  return (
    <div className="w-full select-none" onClick={() => setQuickMoveOpenId(null)}>
      {/* Guia visual do Drag and Drop */}
      {draggedOrderId && (
        <div className="mb-3 px-3 py-2 rounded border border-dashed border-black dark:border-white bg-light-surface dark:bg-dark-surface flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-black dark:bg-white animate-ping" />
            <span className="font-semibold text-light-text dark:text-dark-text">
              Modo de Arraste Ativo:
            </span>
            <span className="font-mono-code font-bold">
              {draggedOrder?.numero_os} - {draggedOrder?.cliente}
            </span>
          </div>
          <span className="text-light-muted dark:text-dark-muted hidden sm:inline">
            Solte o card sobre a coluna da etapa de destino
          </span>
        </div>
      )}

      {/* Container fluido com rolagem horizontal livre e espaçamento amplo */}
      <div className="flex gap-5 overflow-x-auto pb-6 pt-1 px-1 scroll-smooth">
        {COLUMNS.map((col) => {
          const colOrders = getOrdersForStatus(col.status);
          const isOver = dragOverColumn === col.status;
          const isSourceColumn = draggedOrder && (draggedOrder.status === col.status || (col.status === 'layout_aprovado' && draggedOrder.status === 'medicao_visita') || (col.status === 'pronto_entrega' && draggedOrder.status === 'entregue'));
          const showDropTarget = isOver && draggedOrder && !isSourceColumn;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={(e) => handleDragLeave(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex flex-col w-[320px] min-w-[320px] max-w-[320px] shrink-0 rounded-lg border transition-all duration-200 ${
                isOver
                  ? 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 ring-2 ring-black/30 dark:ring-white/30 scale-[1.01]'
                  : draggedOrderId
                  ? 'border-light-border dark:border-dark-border bg-light-surface/60 dark:bg-dark-surface/60 opacity-90'
                  : 'border-light-border dark:border-dark-border bg-light-surface/40 dark:bg-dark-surface/40'
              }`}
            >
              
              {/* Cabeçalho da Coluna com Feedback de Drop */}
              <div className={`p-3.5 border-b rounded-t-lg transition-colors ${
                isOver
                  ? 'border-black dark:border-white bg-light-surface dark:bg-dark-surface'
                  : 'border-light-border dark:border-dark-border bg-light-card/80 dark:bg-dark-card/80'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full border ${col.accentColor} bg-current`} />
                    <h4 className="text-xs font-bold text-light-text dark:text-dark-text uppercase tracking-wider">
                      {col.title}
                    </h4>
                  </div>
                  
                  {isOver && !isSourceColumn ? (
                    <span className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black animate-pulse">
                      Soltar Aqui
                    </span>
                  ) : (
                    <span className="font-mono-code text-xs px-2 py-0.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-bold text-light-text dark:text-dark-text">
                      {colOrders.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                  {col.description}
                </p>
              </div>

              {/* Área de Cartões (Dropzone) */}
              <div className="p-3 space-y-3 flex-1 min-h-[480px] flex flex-col">
                
                {/* Slot Animado de Destino (Drop Placeholder) no Topo da Coluna */}
                {showDropTarget && (
                  <div className="border-2 border-dashed border-black dark:border-white bg-neutral-200/60 dark:bg-neutral-800/60 rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 text-center animate-pulse transition-all">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-light-text dark:text-dark-text">
                      <ArrowRight className="w-4 h-4 text-black dark:text-white" />
                      <span>Mover {draggedOrder?.numero_os}</span>
                    </div>
                    <span className="text-[11px] text-light-muted dark:text-dark-muted">
                      para {col.title}
                    </span>
                  </div>
                )}

                {/* Lista de Cards da Coluna */}
                {colOrders.map((order) => {
                  const isCutApproved = Boolean(order.plano_corte?.aprovado_producao);
                  const isDragging = draggedOrderId === order.id;
                  const next = getNextStatus(order.status);
                  const prev = getPrevStatus(order.status);
                  const itensCount = order.itens_planta?.length || 0;
                  const machines = getMachinesSummary(order);
                  const withLED = hasLED(order);
                  const withGabarito = Boolean(order.plano_corte?.gabarito_pronto);
                  const isQuickMoveOpen = quickMoveOpenId === order.id;

                  // Se o card está sendo arrastado, renderiza o slot de silhueta no lugar de origem
                  if (isDragging) {
                    return (
                      <div
                        key={order.id}
                        className="border-2 border-dashed border-neutral-400 dark:border-neutral-600 bg-neutral-100/50 dark:bg-neutral-900/50 rounded-lg p-4 flex flex-col items-center justify-center gap-1 text-center min-h-[140px] opacity-60"
                      >
                        <span className="font-mono-code font-bold text-xs text-light-muted dark:text-dark-muted">
                          {order.numero_os}
                        </span>
                        <span className="text-[11px] text-light-muted dark:text-dark-muted">
                          Movendo pela esteira...
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelectOrder(order)}
                      className="relative cursor-pointer bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-black dark:hover:border-white rounded-lg p-3.5 transition-all duration-150 group shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                      {/* Topo do Card: Alça de Arraste, OS e Previsão */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {/* Alça tátil de arraste com visualizador interativo */}
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors"
                            title="Clique e arraste este card para mover de etapa"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <span className="font-mono-code text-[11px] font-bold px-1.5 py-0.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text">
                            {order.numero_os}
                          </span>
                        </div>

                        <DeliveryCountdown
                          dateStr={order.previsao_entrega}
                          isDelivered={order.status === 'entregue'}
                        />
                      </div>

                      {/* Nome do Projeto e Cliente */}
                      <h5 className="text-xs font-bold text-light-text dark:text-dark-text group-hover:underline underline-offset-2 mb-1 line-clamp-2">
                        {order.nome_projeto}
                      </h5>
                      <p className="text-[11px] text-light-muted dark:text-dark-muted mb-2.5 truncate">
                        Cliente: <span className="text-light-text dark:text-dark-text font-medium">{order.cliente}</span>
                      </p>

                      {/* Chips Rápidos de Comunicação Visual (Máquinas, LED e Gabarito) */}
                      {(machines.length > 0 || withLED || withGabarito) && (
                        <div className="flex flex-wrap items-center gap-1 mb-2.5">
                          {machines.map((m) => (
                            <span
                              key={m}
                              className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
                            >
                              {m}
                            </span>
                          ))}
                          {withLED && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text">
                              <Zap className="w-2.5 h-2.5 text-neutral-700 dark:text-neutral-300" />
                              LED 12V
                            </span>
                          )}
                          {withGabarito && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text">
                              <Sparkles className="w-2.5 h-2.5 text-neutral-600 dark:text-neutral-400" />
                              Gabarito 1:1
                            </span>
                          )}
                        </div>
                      )}

                      {/* Ambientes da Obra (Ambientação da Comunicação Visual) */}
                      {((order.ambientes && order.ambientes.length > 0) || order.ambiente) && (
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          {(order.ambientes && order.ambientes.length > 0
                            ? order.ambientes
                            : [order.ambiente!]
                          ).map((amb) => (
                            <AmbienteBadge
                              key={amb}
                              ambiente={amb}
                              selected={selectedAmbientes.includes(amb)}
                              onClick={
                                onToggleAmbiente
                                  ? (e?: any) => {
                                      onToggleAmbiente(amb);
                                    }
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      )}

                      {/* Tags do Projeto (Estilo Trello com Cores Vivas) */}
                      <div className="flex flex-wrap items-center gap-1 mb-2.5">
                        {order.tags &&
                          order.tags.map((t) => (
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

                        {/* Botão de Adicionar/Gerenciar Etiquetas no Card */}
                        {onToggleTag && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTagModalOrder(order);
                            }}
                            className="inline-flex items-center justify-center h-4 px-1 rounded border border-dashed border-light-border dark:border-dark-border hover:border-black dark:hover:border-white text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                            title="Gerenciar etiquetas desta OS"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {/* Itens da Planta e Status de Corte */}
                      <div className="grid grid-cols-2 gap-1.5 mb-2.5 text-[10px]">
                        <div className="flex items-center gap-1 p-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                          <Scissors className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span className="truncate">
                            {isCutApproved ? 'Corte OK' : 'Corte Pend.'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 p-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                          <Layers className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span className="truncate font-mono-code">
                            {itensCount} {itensCount === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                      </div>

                      {/* Progresso de Separação de Materiais */}
                      <div className="mb-3">
                        <MaterialProgressBar materiais={order.materiais} compact />
                      </div>

                      {/* Rodapé do Card com Ações em 1 Clique e Botão Mover */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-light-border dark:border-dark-border">
                        {/* Botão Voltar Etapa */}
                        {prev ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChangeStatus(order.id, prev);
                            }}
                            title="Voltar etapa anterior"
                            className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white hover:bg-light-surface dark:hover:bg-dark-surface transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}

                        {/* Botão Mover Etapa em 1 Clique (Menu Rápido) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickMoveOpenId(isQuickMoveOpen ? null : order.id);
                            }}
                            title="Mover para qualquer etapa"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text transition-colors"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-neutral-500" />
                            <span>Mover</span>
                          </button>

                          {/* Menu Flutuante de Seleção Direta de Etapa */}
                          {isQuickMoveOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 w-52 bg-light-card dark:bg-dark-card border border-black dark:border-white rounded-lg shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                            >
                              <div className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-2 py-1 border-b border-light-border dark:border-dark-border">
                                Mover para Etapa:
                              </div>
                              {COLUMNS.map((c) => {
                                const isCurrent = order.status === c.status || (c.status === 'layout_aprovado' && order.status === 'medicao_visita') || (c.status === 'pronto_entrega' && order.status === 'entregue');
                                return (
                                  <button
                                    key={c.status}
                                    type="button"
                                    onClick={() => {
                                      onChangeStatus(order.id, c.status);
                                      setQuickMoveOpenId(null);
                                    }}
                                    className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                                      isCurrent
                                        ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                                        : 'hover:bg-light-surface dark:hover:bg-dark-surface text-light-text dark:text-dark-text'
                                    }`}
                                  >
                                    <span className="truncate">{c.title}</span>
                                    {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Botão Avançar Próxima Etapa */}
                        {next ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChangeStatus(order.id, next);
                            }}
                            title="Avançar para próxima etapa"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                          >
                            <span>Avançar</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}
                      </div>

                    </div>
                  );
                })}

                {/* Dropzone Quando a Coluna está Vazia */}
                {colOrders.length === 0 && !showDropTarget && (
                  <div
                    className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-center text-xs transition-colors min-h-[220px] ${
                      isOver
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5 text-black dark:text-white'
                        : 'border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted'
                    }`}
                  >
                    <p className="text-[11px] font-medium">Nenhuma OS nesta etapa</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Arraste um card para cá</p>
                  </div>
                )}

              </div>

            </div>
          );
        })}
      </div>

      {/* Modal de Gestão de Etiquetas Trello */}
      {tagModalOrder && onToggleTag && (
        <TagManagerModal
          isOpen={Boolean(tagModalOrder)}
          onClose={() => setTagModalOrder(null)}
          selectedTags={
            orders.find((o) => o.id === tagModalOrder.id)?.tags || tagModalOrder.tags || []
          }
          allExistingTags={allTags}
          projectTitle={`${tagModalOrder.numero_os} - ${tagModalOrder.cliente}`}
          onToggleTag={(tag) => onToggleTag(tagModalOrder.id, tag)}
        />
      )}
    </div>
  );
};
