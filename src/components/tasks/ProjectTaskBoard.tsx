import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Scissors,
  FileCode,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { ItemPlanta, StatusItemObra } from '../../types';

interface ProjectTaskBoardProps {
  items: ItemPlanta[];
  onOpenTask: (item: ItemPlanta) => void;
  onAddTask: (data: Partial<ItemPlanta>) => void;
  onUpdateStatus: (itemId: string, newStatus: StatusItemObra) => void;
  ambientes?: string[];
  selectedAmbienteFilter?: string | null;
}

const COLUMNS: {
  id: StatusItemObra;
  title: string;
  dotColor: string;
}[] = [
  { id: 'layout', title: 'Layout & Medição', dotColor: 'bg-blue-500' },
  { id: 'corte_pendente', title: 'Corte CNC & Arquivos', dotColor: 'bg-purple-500' },
  { id: 'em_producao', title: 'Em Produção', dotColor: 'bg-amber-500' },
  { id: 'teste_eletrico', title: 'Acabamento & Elétrica', dotColor: 'bg-yellow-500' },
  { id: 'pronto_instalacao', title: 'Pronto / Instalado', dotColor: 'bg-emerald-500' },
];

const nextStatusMap: Record<StatusItemObra, StatusItemObra> = {
  layout: 'corte_pendente',
  corte_pendente: 'em_producao',
  em_producao: 'teste_eletrico',
  teste_eletrico: 'pronto_instalacao',
  pronto_instalacao: 'instalado',
  instalado: 'layout',
};

interface DragState {
  item: ItemPlanta;
  cardRect: DOMRect;
  offset: { x: number; y: number };
  currentPos: { x: number; y: number };
  targetColumn: StatusItemObra;
  targetIndex: number;
}

// Subcomponente com o conteúdo visual de cada card do Kanban
const KanbanCardContent: React.FC<{
  item: ItemPlanta;
  onAdvance?: () => void;
}> = ({ item, onAdvance }) => {
  const fileCount =
    (item.arquivos && item.arquivos.length) || (item.arquivo_corte_nome ? 1 : 0);

  return (
    <>
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 transition-colors" />
          <span className="font-mono-code text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {item.codigo}
          </span>
        </div>

        {item.maquina_corte && (
          <span className="text-[10px] font-mono-code text-zinc-400">
            {item.maquina_corte === 'router_cnc'
              ? 'Router'
              : item.maquina_corte === 'laser'
              ? 'Laser'
              : item.maquina_corte === 'plotter_recorte'
              ? 'Plotter'
              : 'Manual'}
          </span>
        )}
      </div>

      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2 select-none">
        {item.nome}
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          {fileCount > 0 ? (
            <span
              className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-mono-code text-[10px]"
              title={
                item.arquivos?.map((f) => f.nome).filter(Boolean).join('\n') ||
                item.arquivo_corte_nome
              }
            >
              <FileCode className="w-3 h-3" />
              <span>{fileCount > 1 ? `${fileCount} arqs` : 'Vetor'}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-zinc-400" title="Sem arquivos anexados">
              <Scissors className="w-3 h-3" />
            </span>
          )}

          {item.ambiente && (
            <span className="text-[10px] text-zinc-400 truncate max-w-[90px]">
              {item.ambiente}
            </span>
          )}
        </div>

        {onAdvance && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            title="Avançar para próxima etapa"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </>
  );
};

export const ProjectTaskBoard: React.FC<ProjectTaskBoardProps> = ({
  items,
  onOpenTask,
  onAddTask,
  onUpdateStatus,
  ambientes = [],
  selectedAmbienteFilter,
}) => {
  const [addingColumn, setAddingColumn] = useState<StatusItemObra | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  // Estado do Drag-and-Drop estilo Trello
  const [activeDrag, setActiveDrag] = useState<DragState | null>(null);
  const activeDragRef = useRef<DragState | null>(null);
  activeDragRef.current = activeDrag;

  const pendingDragRef = useRef<{
    item: ItemPlanta;
    startX: number;
    startY: number;
    cardRect: DOMRect;
    offset: { x: number; y: number };
  } | null>(null);

  // Filtra por ambiente se houver filtro selecionado
  const filteredItems = selectedAmbienteFilter
    ? items.filter((it) => it.ambiente === selectedAmbienteFilter)
    : items;

  const handleQuickAdd = (status: StatusItemObra) => {
    if (!quickTitle.trim()) {
      setAddingColumn(null);
      return;
    }

    const count = items.length + 1;
    const codigo = `PC-${count < 10 ? '0' + count : count}`;

    onAddTask({
      codigo,
      nome: quickTitle.trim(),
      status_item: status,
      status_corte: status === 'corte_pendente' ? 'pendente' : 'liberado',
      ambiente: selectedAmbienteFilter || ambientes[0] || 'Geral',
      quantidade: 1,
      maquina_corte: 'router_cnc',
    });

    setQuickTitle('');
    setAddingColumn(null);
  };

  // Gerenciamento dos eventos globais de Pointer para o Drag & Drop do Trello
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // 1. Se houver um clique pendente, checa se ultrapassou a distância mínima para iniciar o arraste (5px)
      if (pendingDragRef.current && !activeDragRef.current) {
        const { startX, startY, item, cardRect, offset } = pendingDragRef.current;
        const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (dist > 5) {
          const initialCol =
            item.status_item === 'instalado' ? 'pronto_instalacao' : item.status_item;
          const initialDrag: DragState = {
            item,
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

      // 2. Se já estiver arrastando ativamente, rastreia mouse e calcula coluna e slot de inserção
      if (activeDragRef.current) {
        const currentPos = { x: e.clientX, y: e.clientY };

        // Procura a coluna do Kanban sob o cursor
        const colEl = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest('[data-column-id]') as HTMLElement | null;

        let targetColumn = activeDragRef.current.targetColumn;
        let targetIndex = activeDragRef.current.targetIndex;

        if (colEl) {
          const colId = colEl.getAttribute('data-column-id') as StatusItemObra;
          if (colId) {
            targetColumn = colId;

            // Calcula o índice vertical correto dentro da coluna para colocar o placeholder
            const cardEls = Array.from(
              colEl.querySelectorAll('[data-card-item-id]')
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
      // Se estava em arrasto ativo: finaliza e move o card para a nova coluna
      if (activeDragRef.current) {
        const { item, targetColumn } = activeDragRef.current;
        const currentCol =
          item.status_item === 'instalado' ? 'pronto_instalacao' : item.status_item;

        if (targetColumn && targetColumn !== currentCol) {
          onUpdateStatus(item.id, targetColumn);
        }

        setActiveDrag(null);
        pendingDragRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        return;
      }

      // Se não moveu mais de 5px, foi um clique normal do usuário: abre a tarefa!
      if (pendingDragRef.current) {
        const clickedItem = pendingDragRef.current.item;
        pendingDragRef.current = null;
        onOpenTask(clickedItem);
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
  }, [onUpdateStatus, onOpenTask]);

  const handleCardPointerDown = (e: React.PointerEvent, item: ItemPlanta) => {
    // Apenas botão primário (esquerdo)
    if (e.button !== 0) return;

    // Se clicou em botão ou elemento interativo, não inicia arraste
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
      item,
      startX: e.clientX,
      startY: e.clientY,
      cardRect,
      offset,
    };
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[480px]">
      {COLUMNS.map((col) => {
        const rawColumnItems = filteredItems.filter((item) => {
          if (col.id === 'pronto_instalacao') {
            return item.status_item === 'pronto_instalacao' || item.status_item === 'instalado';
          }
          return item.status_item === col.id;
        });

        // Se este card estiver sendo arrastado, remove da posição original na coluna
        const isDraggingThisCard = activeDrag !== null;
        const columnCards = isDraggingThisCard
          ? rawColumnItems.filter((it) => it.id !== activeDrag.item.id)
          : rawColumnItems;

        const isAdding = addingColumn === col.id;
        const isTargetCol = activeDrag?.targetColumn === col.id;

        // Monta a lista de itens da coluna inserindo o slot/placeholder do Trello
        type ColEntry = { type: 'card'; item: ItemPlanta } | { type: 'placeholder' };
        const entries: ColEntry[] = columnCards.map((it) => ({ type: 'card', item: it }));

        if (isTargetCol && activeDrag) {
          const insertIdx = Math.min(Math.max(activeDrag.targetIndex, 0), entries.length);
          entries.splice(insertIdx, 0, { type: 'placeholder' });
        }

        return (
          <div
            key={col.id}
            data-column-id={col.id}
            className={`w-72 shrink-0 bg-zinc-100/70 dark:bg-zinc-900/60 border rounded-xl flex flex-col max-h-[75vh] transition-all duration-150 ${
              isTargetCol
                ? 'border-blue-500/80 dark:border-blue-500/80 bg-blue-50/30 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {/* Header da Coluna */}
            <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {col.title}
                </h4>
                <span className="font-mono-code text-[11px] text-zinc-400 bg-white dark:bg-zinc-800 px-1.5 py-0.2 rounded-md">
                  {rawColumnItems.length}
                </span>
              </div>
              <button
                onClick={() => {
                  setAddingColumn(col.id);
                  setQuickTitle('');
                }}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                title="Adicionar tarefa rápida"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lista de Cards da Coluna com Slot do Trello */}
            <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[140px]">
              {entries.map((entry) => {
                if (entry.type === 'placeholder') {
                  // O placeholder exato onde o card vai pousar (estilo Trello)
                  return (
                    <div
                      key="trello-drop-placeholder"
                      style={{
                        minHeight: activeDrag ? `${activeDrag.cardRect.height || 82}px` : '82px',
                      }}
                      className="w-full rounded-lg border-2 border-dashed border-zinc-400 dark:border-zinc-600 bg-zinc-200/60 dark:bg-zinc-800/60 transition-all duration-150"
                    />
                  );
                }

                const item = entry.item;
                return (
                  <div
                    key={item.id}
                    data-card-item-id={item.id}
                    onPointerDown={(e) => handleCardPointerDown(e, item)}
                    style={{ touchAction: 'none' }}
                    className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 transition-all cursor-grab active:cursor-grabbing hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-xs select-none"
                  >
                    <KanbanCardContent
                      item={item}
                      onAdvance={() => {
                        const next = nextStatusMap[item.status_item] || 'layout';
                        onUpdateStatus(item.id, next);
                      }}
                    />
                  </div>
                );
              })}

              {/* Caixa Inline de Adição Rápida */}
              {isAdding ? (
                <div className="p-2 bg-white dark:bg-zinc-900 border border-blue-500 rounded-lg shadow-xs">
                  <input
                    type="text"
                    autoFocus
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(col.id);
                      if (e.key === 'Escape') setAddingColumn(null);
                    }}
                    placeholder="Título da peça/tarefa... (Enter)"
                    className="w-full text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none mb-2"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddingColumn(null)}
                      className="px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(col.id)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAddingColumn(col.id);
                    setQuickTitle('');
                  }}
                  className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 rounded-lg transition-colors border border-dashed border-zinc-200 dark:border-zinc-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar tarefa</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

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
              transform: 'rotate(2.5deg) scale(1.03)',
              transformOrigin: `${activeDrag.offset.x}px ${activeDrag.offset.y}px`,
              boxShadow:
                '0 25px 35px -5px rgba(0, 0, 0, 0.35), 0 12px 15px -5px rgba(0, 0, 0, 0.2)',
            }}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 cursor-grabbing opacity-100 ring-2 ring-blue-500/40 select-none"
          >
            <KanbanCardContent item={activeDrag.item} />
          </div>,
          document.body
        )}
    </div>
  );
};
