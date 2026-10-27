import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  OrdemServico,
  OSStatus,
  TipoMaquinaCorte,
} from '../../types';
import {
  mapOSStatusToModern,
  mapPriorityStyle,
  getProjectHealth,
  calculateProjectProgress,
} from '../../types/project';
import { TagManagerModal } from '../tags/TagManagerModal';
import { areTagsEqual } from '../../lib/tags';
import {
  ChevronRight,
  Scissors,
  Layers,
  GripVertical,
  Calendar,
  CheckCircle2,
  MapPin,
  Tag as TagIcon,
  Plus,
  Zap,
  Sparkles,
  FileCode,
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
  dotColor: string;
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'layout_aprovado',
    title: 'Layout & Medição',
    description: 'Medição conferida e 3D aprovado',
    dotColor: 'bg-blue-500',
  },
  {
    status: 'corte_pendente',
    title: 'Arquivos CNC & Router',
    description: 'Vetores .DXF/.CDR e G-code',
    dotColor: 'bg-purple-500',
  },
  {
    status: 'separacao_pendente',
    title: 'Separação de Materiais',
    description: 'ACM, Acrílico, LEDs e Insumos',
    dotColor: 'bg-amber-500',
  },
  {
    status: 'em_producao',
    title: 'Usinagem & Produção',
    description: 'Corte, dobra, montagem e elétrica',
    dotColor: 'bg-orange-500',
  },
  {
    status: 'pronto_entrega',
    title: 'Pronto / Instalação',
    description: 'Concluído e pronto para montagem',
    dotColor: 'bg-emerald-500',
  },
];

const nextStatusMap: Record<OSStatus, OSStatus> = {
  medicao_visita: 'layout_aprovado',
  layout_aprovado: 'corte_pendente',
  corte_pendente: 'separacao_pendente',
  separacao_pendente: 'em_producao',
  em_producao: 'pronto_entrega',
  pronto_entrega: 'entregue',
  entregue: 'layout_aprovado',
  cancelado: 'layout_aprovado',
};

interface DragState {
  order: OrdemServico;
  cardRect: DOMRect;
  offset: { x: number; y: number };
  currentPos: { x: number; y: number };
  targetColumn: OSStatus;
  targetIndex: number;
}

// Subcomponente com o design moderno de cada card de Projeto/OS
const OSKanbanCardContent: React.FC<{
  order: OrdemServico;
  onAdvance?: () => void;
  onManageTags?: () => void;
  selectedTag?: string | null;
  onSelectTag?: (tag: string) => void;
}> = ({ order, onAdvance, onManageTags, selectedTag, onSelectTag }) => {
  const priorityInfo = mapPriorityStyle(order.prioridade);
  const healthInfo = getProjectHealth(order);
  const progress = calculateProjectProgress(order);

  const itemsCount = order.itens_planta?.length || 0;
  const filesCount =
    order.itens_planta?.reduce(
      (acc, it) => acc + ((it.arquivos && it.arquivos.length) || (it.arquivo_corte_nome ? 1 : 0)),
      0
    ) || (order.plano_corte?.arquivo_ou_link ? 1 : 0);

  const isFinalColumn = order.status === 'pronto_entrega' || order.status === 'entregue';

  return (
    <div className="space-y-2.5">
      {/* 1. Topo: Código da OS, Prioridade e Saúde de Entrega */}
      <div className="flex items-center justify-between gap-1.5 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 transition-colors shrink-0" />
          <span className="font-mono-code text-[11px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 truncate">
            {order.numero_os}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${priorityInfo.badgeClass}`}>
            {priorityInfo.label}
          </span>
        </div>

        {/* Badge de prazo */}
        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border shrink-0 ${healthInfo.badgeClass}`}>
          {healthInfo.label}
        </span>
      </div>

      {/* 2. Nome do Projeto e Cliente */}
      <div>
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
          {order.nome_projeto}
        </h4>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
          Cliente: <span className="font-medium text-zinc-700 dark:text-zinc-300">{order.cliente}</span>
        </p>
      </div>

      {/* 3. Barra de Progresso Real */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-zinc-400">Progresso</span>
          <span className="font-mono-code font-bold text-zinc-700 dark:text-zinc-300">
            {progress}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progress === 100
                ? 'bg-emerald-500'
                : progress >= 60
                ? 'bg-blue-600'
                : 'bg-zinc-400 dark:bg-zinc-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 4. Badges de Produção (Peças, Arquivos e Ambientes) */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          {/* Contador de Peças */}
          <span
            className="flex items-center gap-1 font-mono-code text-[10px] text-zinc-600 dark:text-zinc-400"
            title={`${itemsCount} peça(s) no plano da obra`}
          >
            <Layers className="w-3 h-3 text-zinc-400" />
            <span>{itemsCount} {itemsCount === 1 ? 'peça' : 'peças'}</span>
          </span>

          {/* Contador de Arquivos / CNC */}
          {filesCount > 0 && (
            <span
              className="flex items-center gap-1 font-mono-code text-[10px] text-purple-600 dark:text-purple-400"
              title={`${filesCount} arquivo(s) de corte ou gabaritos vinculados`}
            >
              <FileCode className="w-3 h-3" />
              <span>{filesCount}</span>
            </span>
          )}

          {/* Ambientes */}
          {order.ambientes && order.ambientes.length > 0 && (
            <span
              className="flex items-center gap-0.5 text-[10px] text-zinc-400 truncate max-w-[85px]"
              title={order.ambientes.join(', ')}
            >
              <MapPin className="w-2.5 h-2.5" />
              <span className="truncate">{order.ambientes[0]}</span>
            </span>
          )}
        </div>

        {/* Ação de Avançar ou Selo Concluído */}
        <div>
          {isFinalColumn ? (
            <span
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]"
              title="Obra concluída e pronta para entrega / instalação"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pronto</span>
            </span>
          ) : onAdvance ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdvance();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Avançar para próxima etapa de produção"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* 5. Etiquetas do Projeto */}
      {order.tags && order.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {order.tags.map((tag) => (
            <span
              key={tag}
              onClick={(e) => {
                if (onSelectTag) {
                  e.stopPropagation();
                  onSelectTag(selectedTag === tag ? '' : tag);
                }
              }}
              className={`text-[9px] font-mono-code px-1.5 py-0.2 rounded border cursor-pointer transition-colors ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
              }`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

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
  // Drag and Drop estilo Trello para o Quadro Geral de Obras
  const [activeDrag, setActiveDrag] = useState<DragState | null>(null);
  const activeDragRef = useRef<DragState | null>(null);
  activeDragRef.current = activeDrag;

  const pendingDragRef = useRef<{
    order: OrdemServico;
    startX: number;
    startY: number;
    cardRect: DOMRect;
    offset: { x: number; y: number };
  } | null>(null);

  const [tagModalOrder, setTagModalOrder] = useState<OrdemServico | null>(null);

  // Mapeia ordens pertencentes a cada coluna do fluxo geral
  const getOrdersForStatus = (status: OSStatus) => {
    if (status === 'layout_aprovado') {
      return orders.filter((o) => o.status === 'layout_aprovado' || o.status === 'medicao_visita');
    }
    if (status === 'pronto_entrega') {
      return orders.filter((o) => o.status === 'pronto_entrega' || o.status === 'entregue');
    }
    return orders.filter((o) => o.status === status);
  };

  // Gerencia eventos globais de ponteiro
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // 1. Inicia arraste se ultrapassar 5px
      if (pendingDragRef.current && !activeDragRef.current) {
        const { startX, startY, order, cardRect, offset } = pendingDragRef.current;
        const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (dist > 5) {
          const initialCol =
            order.status === 'medicao_visita'
              ? 'layout_aprovado'
              : order.status === 'entregue'
              ? 'pronto_entrega'
              : order.status;

          const initialDrag: DragState = {
            order,
            cardRect,
            offset,
            currentPos: { x: e.clientX, y: e.clientY },
            targetColumn: initialCol,
            targetIndex: 0,
          };
          setActiveDrag(initialDrag);
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
          window.getSelection()?.removeAllRanges();
        }
      }

      // 2. Acompanha arraste e calcula coluna de destino sob o mouse
      if (activeDragRef.current) {
        const currentPos = { x: e.clientX, y: e.clientY };

        const colEl = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest('[data-global-column-id]') as HTMLElement | null;

        let targetColumn = activeDragRef.current.targetColumn;
        let targetIndex = activeDragRef.current.targetIndex;

        if (colEl) {
          const colId = colEl.getAttribute('data-global-column-id') as OSStatus;
          if (colId) {
            targetColumn = colId;

            const cardEls = Array.from(
              colEl.querySelectorAll('[data-global-card-id]')
            ) as HTMLElement[];

            let idx = cardEls.length;
            for (let i = 0; i < cardEls.length; i++) {
              const rect = cardEls[i].getBoundingClientRect();
              const midY = rect.top + rect.height / 2;
              if (e.clientY < midY) {
                idx = i;
                break;
              }
            }
            targetIndex = idx;
          }
        }

        setActiveDrag((prev) =>
          prev
            ? {
                ...prev,
                currentPos,
                targetColumn,
                targetIndex,
              }
            : null
        );
      }
    };

    const handlePointerUp = () => {
      if (activeDragRef.current) {
        const { order, targetColumn } = activeDragRef.current;
        const currentCol =
          order.status === 'medicao_visita'
            ? 'layout_aprovado'
            : order.status === 'entregue'
            ? 'pronto_entrega'
            : order.status;

        if (targetColumn && targetColumn !== currentCol) {
          onChangeStatus(order.id, targetColumn);
        }

        setActiveDrag(null);
        pendingDragRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        return;
      }

      if (pendingDragRef.current) {
        const clickedOrder = pendingDragRef.current.order;
        pendingDragRef.current = null;
        onSelectOrder(clickedOrder);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [onChangeStatus, onSelectOrder]);

  const handleCardPointerDown = (e: React.PointerEvent, order: OrdemServico) => {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select')
    ) {
      return;
    }

    const cardEl = e.currentTarget as HTMLElement;
    const cardRect = cardEl.getBoundingClientRect();
    const offset = {
      x: e.clientX - cardRect.left,
      y: e.clientY - cardRect.top,
    };

    pendingDragRef.current = {
      order,
      startX: e.clientX,
      startY: e.clientY,
      cardRect,
      offset,
    };
  };

  return (
    <div className="w-full">
      {/* Colunas do Quadro Geral (Scroll Horizontal Suave) */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[520px]">
        {COLUMNS.map((col) => {
          const rawColOrders = getOrdersForStatus(col.status);

          const isDragging = activeDrag !== null;
          const colOrders = isDragging
            ? rawColOrders.filter((o) => o.id !== activeDrag.order.id)
            : rawColOrders;

          const isTargetCol = activeDrag?.targetColumn === col.status;

          type ColItem = { type: 'card'; order: OrdemServico } | { type: 'placeholder' };
          const itemsToRender: ColItem[] = colOrders.map((o) => ({ type: 'card', order: o }));

          if (isTargetCol && activeDrag) {
            const insertIdx = Math.min(Math.max(activeDrag.targetIndex, 0), itemsToRender.length);
            itemsToRender.splice(insertIdx, 0, { type: 'placeholder' });
          }

          return (
            <div
              key={col.status}
              data-global-column-id={col.status}
              className={`w-80 shrink-0 bg-zinc-100/70 dark:bg-zinc-900/60 border rounded-xl flex flex-col max-h-[80vh] transition-all duration-150 ${
                isTargetCol
                  ? 'border-blue-500/80 dark:border-blue-500/80 bg-blue-50/30 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {/* Header da Coluna */}
              <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      {col.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-normal">
                      {col.description}
                    </p>
                  </div>
                </div>

                <span className="font-mono-code text-[11px] font-bold text-zinc-500 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200/80 dark:border-zinc-750">
                  {rawColOrders.length}
                </span>
              </div>

              {/* Área de Cards com Suporte a Drag & Drop do Trello */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 min-h-[160px]">
                {itemsToRender.map((item) => {
                  if (item.type === 'placeholder') {
                    return (
                      <div
                        key="trello-global-drop-placeholder"
                        style={{
                          minHeight: activeDrag ? `${activeDrag.cardRect.height || 140}px` : '140px',
                        }}
                        className="w-full rounded-xl border-2 border-dashed border-zinc-400 dark:border-zinc-600 bg-zinc-200/60 dark:bg-zinc-800/60 transition-all duration-150"
                      />
                    );
                  }

                  const order = item.order;
                  const next = nextStatusMap[order.status];

                  return (
                    <div
                      key={order.id}
                      data-global-card-id={order.id}
                      onPointerDown={(e) => handleCardPointerDown(e, order)}
                      style={{ touchAction: 'none' }}
                      className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 transition-all cursor-grab active:cursor-grabbing hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-xs select-none"
                    >
                      <OSKanbanCardContent
                        order={order}
                        selectedTag={selectedTag}
                        onSelectTag={onSelectTag}
                        onAdvance={() => {
                          if (next) onChangeStatus(order.id, next);
                        }}
                        onManageTags={() => setTagModalOrder(order)}
                      />
                    </div>
                  );
                })}

                {/* Dropzone Vazia */}
                {rawColOrders.length === 0 && !isTargetCol && (
                  <div className="py-12 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-lg">
                    <span>Nenhuma obra nesta etapa</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Flutuante 100% Sólido estilo Trello (renderizado via Portal no body) */}
      {typeof document !== 'undefined' &&
        activeDrag &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: activeDrag.currentPos.x - activeDrag.offset.x,
              top: activeDrag.currentPos.y - activeDrag.offset.y,
              width: activeDrag.cardRect.width,
              pointerEvents: 'none',
              zIndex: 99999,
              transform: 'rotate(2.5deg) scale(1.02)',
              transformOrigin: `${activeDrag.offset.x}px ${activeDrag.offset.y}px`,
              boxShadow:
                '0 25px 35px -5px rgba(0, 0, 0, 0.35), 0 12px 15px -5px rgba(0, 0, 0, 0.2)',
            }}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3.5 cursor-grabbing opacity-100 ring-2 ring-blue-500/40 select-none shadow-2xl"
          >
            <OSKanbanCardContent
              order={activeDrag.order}
              selectedTag={selectedTag}
            />
          </div>,
          document.body
        )}

      {/* Modal de Gestão de Etiquetas */}
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
