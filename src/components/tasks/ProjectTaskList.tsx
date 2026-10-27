import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Scissors,
  FileCode,
  Layers,
  ChevronRight,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { ItemPlanta, StatusItemObra, TipoMaquinaCorte } from '../../types';

interface ProjectTaskListProps {
  items: ItemPlanta[];
  onOpenTask: (item: ItemPlanta) => void;
  onAddTask: (data: Partial<ItemPlanta>) => void;
  onUpdateStatus: (itemId: string, newStatus: StatusItemObra) => void;
  onDeleteTask: (itemId: string) => void;
  ambientes?: string[];
}

export const ProjectTaskList: React.FC<ProjectTaskListProps> = ({
  items,
  onOpenTask,
  onAddTask,
  onUpdateStatus,
  onDeleteTask,
  ambientes = [],
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAmbiente, setQuickAmbiente] = useState(ambientes[0] || 'Geral');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const count = items.length + 1;
    const codigo = `PC-${count < 10 ? '0' + count : count}`;

    onAddTask({
      codigo,
      nome: quickTitle.trim(),
      ambiente: quickAmbiente,
      status_item: 'layout',
      status_corte: 'pendente',
      quantidade: 1,
      maquina_corte: 'router_cnc',
    });

    setQuickTitle('');
  };

  const getStatusBadge = (status: StatusItemObra) => {
    switch (status) {
      case 'layout':
        return {
          label: 'Layout & Medição',
          cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        };
      case 'corte_pendente':
        return {
          label: 'Corte Pendente',
          cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        };
      case 'em_producao':
        return {
          label: 'Em Produção',
          cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        };
      case 'teste_eletrico':
        return {
          label: 'Acabamento / Elétrica',
          cls: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
        };
      case 'pronto_instalacao':
        return {
          label: 'Pronto p/ Instalação',
          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'instalado':
        return {
          label: 'Instalado',
          cls: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        };
      default:
        return {
          label: status,
          cls: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        };
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      {/* Formulário Rápido de Adição no Topo da Lista */}
      <form
        onSubmit={handleAdd}
        className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex flex-wrap items-center gap-2"
      >
        <Plus className="w-4 h-4 text-zinc-400 shrink-0" />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Adicionar nova peça ou tarefa ao projeto... (Pressione Enter)"
          className="flex-1 min-w-[200px] text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {ambientes.length > 0 && (
          <select
            value={quickAmbiente}
            onChange={(e) => setQuickAmbiente(e.target.value)}
            className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            {ambientes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
        >
          Adicionar
        </button>
      </form>

      {/* Tabela de Tarefas */}
      {items.length === 0 ? (
        <div className="p-8 text-center text-zinc-400 text-xs">
          Nenhuma tarefa cadastrada neste projeto. Adicione acima para iniciar o fluxo.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-mono-code uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4 font-semibold w-12 text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold w-24">Código</th>
                <th className="py-2.5 px-4 font-semibold">Peça / Tarefa</th>
                <th className="py-2.5 px-4 font-semibold">Ambiente</th>
                <th className="py-2.5 px-4 font-semibold">Máquina</th>
                <th className="py-2.5 px-4 font-semibold">Arquivo Vetorial</th>
                <th className="py-2.5 px-4 font-semibold">Etapa de Produção</th>
                <th className="py-2.5 px-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {items.map((item) => {
                const isDone =
                  item.status_item === 'instalado' || item.status_item === 'pronto_instalacao';
                const statusBadge = getStatusBadge(item.status_item);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onOpenTask(item)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-850/60 cursor-pointer transition-colors"
                  >
                    {/* Checkbox de conclusão */}
                    <td
                      className="py-2.5 px-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(
                          item.id,
                          isDone ? 'layout' : 'pronto_instalacao'
                        );
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 mx-auto" />
                      )}
                    </td>

                    {/* Código */}
                    <td className="py-2.5 px-4 font-mono-code font-bold text-zinc-900 dark:text-zinc-100">
                      {item.codigo}
                    </td>

                    {/* Nome da Tarefa */}
                    <td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <div className={isDone ? 'line-through text-zinc-400' : ''}>
                        {item.nome}
                      </div>
                      {item.material_principal && (
                        <div className="text-[10px] text-zinc-400 font-normal">
                          {item.material_principal}
                        </div>
                      )}
                    </td>

                    {/* Ambiente */}
                    <td className="py-2.5 px-4 text-zinc-500 dark:text-zinc-400">
                      {item.ambiente || '—'}
                    </td>

                    {/* Máquina */}
                    <td className="py-2.5 px-4 text-zinc-500 dark:text-zinc-400 font-mono-code text-[11px]">
                      {item.maquina_corte === 'router_cnc'
                        ? 'Router CNC'
                        : item.maquina_corte === 'laser'
                        ? 'Laser'
                        : item.maquina_corte === 'plotter_recorte'
                        ? 'Plotter'
                        : item.maquina_corte || '—'}
                    </td>

                    {/* Arquivos do Item (Repeater) */}
                    <td className="py-2.5 px-4">
                      {(() => {
                        const totalFiles =
                          (item.arquivos && item.arquivos.length) ||
                          (item.arquivo_corte_nome ? 1 : 0);
                        const firstName = item.arquivos?.[0]?.nome || item.arquivo_corte_nome;

                        if (totalFiles > 0) {
                          return (
                            <div
                              className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400"
                              title={
                                item.arquivos?.map((f) => f.nome).filter(Boolean).join('\n') ||
                                firstName
                              }
                            >
                              <FileCode className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-mono-code text-[11px] truncate max-w-[130px]">
                                {firstName || 'Arquivo'}
                              </span>
                              {totalFiles > 1 && (
                                <span className="font-mono-code text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold shrink-0">
                                  +{totalFiles - 1}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return <span className="text-zinc-400 text-[11px]">Sem arquivo</span>;
                      })()}
                    </td>

                    {/* Etapa */}
                    <td className="py-2.5 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusBadge.cls}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir peça ${item.codigo}?`)) {
                            onDeleteTask(item.id);
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
