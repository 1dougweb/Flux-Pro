import React, { useState, useMemo } from 'react';
import { ItemPlanta, StatusItemObra } from '../../types';
import {
  StatusItemObraBadge,
  StatusCorteItemBadge,
  MaquinaCorteBadge,
  StatusItemObraSelector,
  AmbienteBadge,
} from '../common/Badge';
import { PhotoViewerModal } from './PhotoViewerModal';
import { ItemPlantaFormModal } from './ItemPlantaFormModal';
import {
  Image as ImageIcon,
  FileCode,
  ExternalLink,
  Plus,
  MapPin,
  Search,
  Filter,
  Edit2,
  Trash2,
  Maximize2,
  Paperclip,
  Ruler,
  Layers,
  CheckCircle,
  Clock,
  Zap,
  Upload,
  Download,
  AlertTriangle,
} from 'lucide-react';

export interface ItemPlantaDisplay extends ItemPlanta {
  os_numero?: string;
  os_cliente?: string;
  os_projeto?: string;
}

interface ItemPlantaTableProps {
  osId?: string; // Se fornecido, opera no contexto daquela OS
  osAmbientes?: string[]; // Ambientes definidos na OS para correspondência
  itens: ItemPlantaDisplay[];
  onAddItem?: (
    osId: string,
    item: Omit<ItemPlanta, 'id' | 'os_id' | 'created_at'>
  ) => Promise<void>;
  onUpdateItem?: (
    osId: string,
    itemId: string,
    partial: Partial<ItemPlanta>
  ) => Promise<void>;
  onRemoveItem?: (osId: string, itemId: string) => Promise<void>;
  onCycleStatus?: (osId: string, itemId: string) => Promise<void>;
  onOpenOS?: (osId: string) => void;
  showOSColumn?: boolean;
}

export const ItemPlantaTable: React.FC<ItemPlantaTableProps> = ({
  osId,
  osAmbientes = [],
  itens,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onCycleStatus,
  onOpenOS,
  showOSColumn = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmbiente, setSelectedAmbiente] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState('todos');

  // Modais
  const [photoViewer, setPhotoViewer] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemPlanta | null>(null);

  // Upload inline rápido de arquivo de corte (.dxf, .cdr, etc.)
  const handleInlineCutUpload = (item: ItemPlanta, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateItem) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateItem(item.os_id, item.id, {
          arquivo_corte_nome: file.name,
          arquivo_corte_url: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Ambientes únicos para o filtro (da OS e dos itens)
  const uniqueAmbientes = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(osAmbientes)) {
      osAmbientes.forEach((a) => {
        if (a && a.trim()) set.add(a.trim());
      });
    }
    itens.forEach((it) => {
      if (it.ambiente && it.ambiente.trim()) set.add(it.ambiente.trim());
    });
    return Array.from(set);
  }, [itens, osAmbientes]);

  // Itens filtrados
  const filteredItens = useMemo(() => {
    return itens.filter((it) => {
      // Busca
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const matchCode = it.codigo.toLowerCase().includes(q);
        const matchNome = it.nome.toLowerCase().includes(q);
        const matchAmb = it.ambiente.toLowerCase().includes(q);
        const matchMat = it.material_principal?.toLowerCase().includes(q) || false;
        const matchOS = it.os_numero?.toLowerCase().includes(q) || false;
        const matchCli = it.os_cliente?.toLowerCase().includes(q) || false;
        if (!matchCode && !matchNome && !matchAmb && !matchMat && !matchOS && !matchCli) {
          return false;
        }
      }

      // Filtro ambiente
      if (selectedAmbiente !== 'todos' && it.ambiente !== selectedAmbiente) {
        return false;
      }

      // Filtro status
      if (selectedStatus !== 'todos' && it.status_item !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [itens, searchTerm, selectedAmbiente, selectedStatus]);

  // Resumo / Métricas dos itens
  const metrics = useMemo(() => {
    const total = itens.length;
    const cortePendente = itens.filter((it) => it.status_corte === 'pendente').length;
    const cortados = itens.filter((it) => it.status_corte === 'cortado' || it.status_corte === 'liberado').length;
    const instalados = itens.filter((it) => it.status_item === 'instalado').length;
    return { total, cortePendente, cortados, instalados };
  }, [itens]);

  // Salvar novo item ou edição
  const handleSaveItem = async (
    data: Omit<ItemPlanta, 'id' | 'os_id' | 'created_at'>
  ) => {
    const targetOS = osId || editingItem?.os_id;
    if (!targetOS) return;

    if (editingItem && onUpdateItem) {
      await onUpdateItem(targetOS, editingItem.id, data);
    } else if (onAddItem) {
      await onAddItem(targetOS, data);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Resumo no Topo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">Total de Itens</span>
          <div className="text-xl font-bold font-mono-code text-light-text dark:text-dark-text">{metrics.total}</div>
        </div>

        <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">Cortes Pendentes</span>
          <div className="text-xl font-bold font-mono-code text-amber-700 dark:text-amber-400">{metrics.cortePendente}</div>
        </div>

        <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">Chapas Cortadas</span>
          <div className="text-xl font-bold font-mono-code text-neutral-900 dark:text-neutral-100">{metrics.cortados}</div>
        </div>

        <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">Instalados na Obra</span>
          <div className="text-xl font-bold font-mono-code text-neutral-900 dark:text-neutral-100">{metrics.instalados}</div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-light-surface dark:bg-dark-surface p-2.5 rounded border border-light-border dark:border-dark-border">
        
        {/* Campo de Busca */}
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, nome, medidas ou material..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
          />
        </div>

        {/* Filtros Dropdown */}
        <div className="flex items-center gap-2">
          {uniqueAmbientes.length > 0 && (
            <select
              value={selectedAmbiente}
              onChange={(e) => setSelectedAmbiente(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
            >
              <option value="todos">Todos Ambientes</option>
              {uniqueAmbientes.map((amb) => (
                <option key={amb} value={amb}>{amb}</option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
          >
            <option value="todos">Todos Status</option>
            <option value="projeto">Em Projeto</option>
            <option value="corte_pendente">Corte Pendente</option>
            <option value="em_producao">Em Produção</option>
            <option value="montado">Montado</option>
            <option value="instalado">Instalado</option>
          </select>

          {/* Botão Adicionar Item */}
          {onAddItem && osId && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Item</span>
            </button>
          )}
        </div>

      </div>

      {/* Tabela de Itens da Planta */}
      {filteredItens.length === 0 ? (
        <div className="p-10 border border-dashed border-light-border dark:border-dark-border rounded text-center text-xs text-light-muted dark:text-dark-muted">
          Nenhum item da planta encontrado com os filtros aplicados.
        </div>
      ) : (
        <div className="border border-light-border dark:border-dark-border rounded overflow-x-auto bg-light-card dark:bg-dark-card">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border font-semibold text-light-text dark:text-dark-text">
              <tr>
                <th className="p-3 w-16 text-center">Foto</th>
                <th className="p-3">Código</th>
                {showOSColumn && <th className="p-3">OS / Obra</th>}
                <th className="p-3">Elemento & Máquina</th>
                <th className="p-3">Peça / Descrição</th>
                <th className="p-3">Localização</th>
                <th className="p-3 text-center">Medidas (L x A x P)</th>
                <th className="p-3">Material / ACM</th>
                <th className="p-3">Arquivo de Corte (.DXF/.CDR)</th>
                <th className="p-3 text-center">Marcador de Estado no Projeto</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {filteredItens.map((item) => {
                const hasDimensions = item.largura_mm || item.altura_mm || item.profundidade_mm;
                const dimStr = `${item.largura_mm || '-'} x ${item.altura_mm || '-'} x ${item.profundidade_mm || '-'} mm`;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-light-surface/60 dark:hover:bg-dark-surface/60 transition-colors group"
                  >
                    
                    {/* Foto / Miniatura */}
                    <td className="p-2.5 text-center">
                      {item.foto_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoViewer({
                              url: item.foto_url!,
                              title: `${item.codigo} - ${item.nome}`,
                              subtitle: `${item.ambiente} • ${dimStr}`,
                            })
                          }
                          className="relative w-11 h-11 rounded border border-light-border dark:border-dark-border overflow-hidden group/img inline-block bg-black/40 focus:outline-none"
                          title="Clique para ampliar a foto"
                        >
                          <img
                            src={item.foto_url}
                            alt={item.nome}
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </button>
                      ) : (
                        <div
                          className="w-11 h-11 mx-auto rounded border border-dashed border-light-border dark:border-dark-border flex items-center justify-center text-neutral-400 dark:text-neutral-600"
                          title="Sem foto anexada"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </td>

                    {/* Código da Planta */}
                    <td className="p-3">
                      <span className="font-mono-code font-bold px-2 py-0.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text">
                        {item.codigo}
                      </span>
                    </td>

                    {/* Coluna de OS (quando exibido em visão global) */}
                    {showOSColumn && (
                      <td className="p-3">
                        {item.os_id && onOpenOS ? (
                          <button
                            onClick={() => onOpenOS(item.os_id)}
                            className="text-left group/os"
                          >
                            <span className="font-mono-code text-[11px] font-bold text-light-text dark:text-dark-text group-hover/os:underline">
                              {item.os_numero}
                            </span>
                            <div className="text-[10px] text-light-muted dark:text-dark-muted truncate max-w-[140px]">
                              {item.os_cliente}
                            </div>
                          </button>
                        ) : (
                          <span className="font-mono-code text-[11px]">{item.os_numero || '-'}</span>
                        )}
                      </td>
                    )}

                    {/* Elemento & Máquina */}
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-light-text dark:text-dark-text text-[11px]">
                          {item.tipo_elemento || 'Elemento'}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <MaquinaCorteBadge maquina={item.maquina_corte} />
                          {item.iluminado && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800" title="Iluminado com LED">
                              <Zap className="w-2.5 h-2.5" /> LED
                            </span>
                          )}
                          {item.gabarito_gerado && (
                            <span className="text-[10px] px-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              Gab. 1:1
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Nome / Peça */}
                    <td className="p-3">
                      <div className="font-bold text-light-text dark:text-dark-text max-w-xs truncate">
                        {item.nome}
                      </div>
                      {item.observacoes && (
                        <p className="text-[10px] text-light-muted dark:text-dark-muted max-w-xs truncate mt-0.5">
                          {item.observacoes}
                        </p>
                      )}
                    </td>

                    {/* Localização na Fachada / Obra */}
                    <td className="p-3">
                      {item.ambiente ? (
                        <AmbienteBadge
                          ambiente={item.ambiente}
                          size="sm"
                          selected={selectedAmbiente === item.ambiente}
                          onClick={() =>
                            setSelectedAmbiente(
                              item.ambiente === selectedAmbiente ? 'todos' : item.ambiente
                            )
                          }
                        />
                      ) : (
                        <span className="text-neutral-400 font-mono-code text-xs">-</span>
                      )}
                    </td>

                    {/* Medidas (L x A x P) */}
                    <td className="p-3 text-center font-mono-code text-[11px]">
                      {hasDimensions ? (
                        <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                          {dimStr}
                        </span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>

                    {/* Material Principal */}
                    <td className="p-3 text-light-muted dark:text-dark-muted max-w-[180px] truncate">
                      {item.material_principal || '-'}
                    </td>

                    {/* Arquivo de Corte */}
                    <td className="p-3">
                      {item.arquivo_corte_url || item.arquivo_corte_nome ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={item.arquivo_corte_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            download={item.arquivo_corte_nome || 'corte.dxf'}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono-code font-bold border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text transition-colors max-w-[170px]"
                            title={`Baixar arquivo de corte: ${item.arquivo_corte_nome || 'Arquivo de Corte'}`}
                          >
                            <Paperclip className="w-3 h-3 shrink-0 text-neutral-500" />
                            <span className="truncate">{item.arquivo_corte_nome || 'Arquivo de Corte'}</span>
                            <Download className="w-3 h-3 shrink-0 text-neutral-400 ml-0.5" />
                          </a>

                          {onUpdateItem && (
                            <label
                              className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                              title="Substituir arquivo de corte (.dxf, .cdr, .eps, etc.)"
                            >
                              <Upload className="w-3 h-3" />
                              <input
                                type="file"
                                accept=".dxf,.dwg,.cdr,.ai,.eps,.pdf,.nc,.plt"
                                className="hidden"
                                onChange={(e) => handleInlineCutUpload(item, e)}
                              />
                            </label>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Sem arquivo</span>
                          </span>

                          {onUpdateItem && (
                            <label
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-dashed border-neutral-300 dark:border-neutral-700 bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text cursor-pointer transition-colors"
                              title="Anexar arquivo de corte do computador"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>Anexar</span>
                              <input
                                type="file"
                                accept=".dxf,.dwg,.cdr,.ai,.eps,.pdf,.nc,.plt"
                                className="hidden"
                                onChange={(e) => handleInlineCutUpload(item, e)}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Marcador de Estado da Peça no Projeto (Interativo) */}
                    <td className="p-3 text-center">
                      {onUpdateItem ? (
                        <StatusItemObraSelector
                          currentStatus={item.status_item}
                          onChangeStatus={(newStatus) => {
                            onUpdateItem(item.os_id, item.id, { status_item: newStatus });
                          }}
                        />
                      ) : (
                        <StatusItemObraBadge status={item.status_item} />
                      )}
                    </td>

                    {/* Ações */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onUpdateItem && (
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsFormOpen(true);
                            }}
                            title="Editar item da planta"
                            className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onRemoveItem && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja remover o item "${item.codigo} - ${item.nome}"?`)) {
                                onRemoveItem(item.os_id, item.id);
                              }
                            }}
                            title="Excluir item"
                            className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Visualizador de Foto */}
      {photoViewer && (
        <PhotoViewerModal
          photoUrl={photoViewer.url}
          title={photoViewer.title}
          subtitle={photoViewer.subtitle}
          onClose={() => setPhotoViewer(null)}
        />
      )}

      {/* Modal de Formulário de Item */}
      {isFormOpen && (
        <ItemPlantaFormModal
          osId={osId || editingItem?.os_id || ''}
          osAmbientes={osAmbientes}
          itemToEdit={editingItem}
          nextSuggestedCode={`IT-${String(itens.length + 1).padStart(2, '0')}`}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
        />
      )}

    </div>
  );
};
