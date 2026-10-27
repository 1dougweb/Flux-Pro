import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  Calendar,
  Layers,
  Scissors,
  FileCode,
  Tag,
  Trash2,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  CheckSquare,
  Paperclip,
  Image,
  FileText,
  Link as LinkIcon,
  UploadCloud,
  FolderOpen,
  Download,
  Eye,
  FileCheck,
} from 'lucide-react';
import { ItemPlanta, StatusItemObra, TipoMaquinaCorte, ArquivoItem, TipoArquivoItem } from '../../types';
import { FileManagerModal } from '../assets/FileManagerModal';
import { saveFileToStorage, detectFileType, downloadFile, previewFile } from '../../lib/fileStorage';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface TaskDrawerProps {
  item: ItemPlanta | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ItemPlanta>) => void;
  onDelete: (id: string) => void;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [nome, setNome] = useState('');
  const [statusItem, setStatusItem] = useState<StatusItemObra>('corte_pendente');
  const [maquina, setMaquina] = useState<TipoMaquinaCorte>('router_cnc');
  const [statusCorte, setStatusCorte] = useState<'pendente' | 'cortado' | 'liberado'>('pendente');
  const [ambiente, setAmbiente] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [largura, setLargura] = useState('');
  const [altura, setAltura] = useState('');
  const [material, setMaterial] = useState('');
  
  // Checklist interativo
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Repeater de Arquivos do Item
  const [arquivos, setArquivos] = useState<ArquivoItem[]>([]);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega e sincroniza dados do item
  useEffect(() => {
    if (item) {
      setNome(item.nome || '');
      setStatusItem(item.status_item || 'corte_pendente');
      setMaquina(item.maquina_corte || 'router_cnc');
      setStatusCorte(item.status_corte || 'pendente');
      setAmbiente(item.ambiente || '');
      setLargura(item.largura_mm ? String(item.largura_mm) : '');
      setAltura(item.altura_mm ? String(item.altura_mm) : '');
      setMaterial(item.material_principal || '');

      // Inicializa repeater de arquivos
      let initialArquivos: ArquivoItem[] = [];
      if (Array.isArray(item.arquivos) && item.arquivos.length > 0) {
        initialArquivos = [...item.arquivos];
      } else if (item.arquivo_corte_nome || item.arquivo_corte_url) {
        initialArquivos = [
          {
            id: `f-${Date.now()}`,
            nome: item.arquivo_corte_nome || 'arquivo_corte.dxf',
            url: item.arquivo_corte_url || '',
            tipo: 'corte_cnc',
          },
        ];
      }
      setArquivos(initialArquivos);

      // Parse markdown-style checklist: "- [ ] text" or "- [x] text"
      const rawNotes = item.observacoes || '';
      const lines = rawNotes.split('\n');
      const parsedChecklist: ChecklistItem[] = [];
      const nonChecklistLines: string[] = [];

      lines.forEach((line, index) => {
        const match = line.match(/^-\s*\[([ xX])\]\s*(.*)$/);
        if (match) {
          parsedChecklist.push({
            id: `chk-${index}-${Date.now()}`,
            done: match[1].toLowerCase() === 'x',
            text: match[2].trim(),
          });
        } else {
          nonChecklistLines.push(line);
        }
      });

      setChecklist(parsedChecklist);
      setObservacoes(nonChecklistLines.join('\n').trim());
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Monta texto final combinando anotações gerais e checklist
  const serializeNotes = (customChecklist?: ChecklistItem[], customNotes?: string) => {
    const listToUse = customChecklist !== undefined ? customChecklist : checklist;
    const notesToUse = customNotes !== undefined ? customNotes : observacoes;

    const checklistMarkdown = listToUse
      .map((chk) => `- [${chk.done ? 'x' : ' '}] ${chk.text}`)
      .join('\n');

    if (checklistMarkdown && notesToUse) {
      return `${notesToUse}\n\n${checklistMarkdown}`;
    }
    return checklistMarkdown || notesToUse || '';
  };

  const handleSave = () => {
    const primaryFile = arquivos[0];
    onUpdate(item.id, {
      nome: nome.trim(),
      status_item: statusItem,
      maquina_corte: maquina,
      status_corte: statusCorte,
      ambiente: ambiente.trim(),
      arquivos,
      arquivo_corte_nome: primaryFile?.nome || undefined,
      arquivo_corte_url: primaryFile?.url || undefined,
      observacoes: serializeNotes() || undefined,
      largura_mm: largura ? parseInt(largura) : undefined,
      altura_mm: altura ? parseInt(altura) : undefined,
      material_principal: material.trim() || undefined,
    });
  };

  // Funções do Repeater de Arquivos
  const handleAddArquivo = () => {
    const novoArquivo: ArquivoItem = {
      id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nome: '',
      url: '',
      tipo: 'corte_cnc',
      created_at: new Date().toISOString(),
    };
    const updated = [...arquivos, novoArquivo];
    setArquivos(updated);
    onUpdate(item.id, {
      arquivos: updated,
      arquivo_corte_nome: updated[0]?.nome || undefined,
      arquivo_corte_url: updated[0]?.url || undefined,
    });
  };

  const handleUpdateArquivo = (id: string, updates: Partial<ArquivoItem>) => {
    const updated = arquivos.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setArquivos(updated);
    onUpdate(item.id, {
      arquivos: updated,
      arquivo_corte_nome: updated[0]?.nome || undefined,
      arquivo_corte_url: updated[0]?.url || undefined,
    });
  };

  const handleRemoveArquivo = (id: string) => {
    const updated = arquivos.filter((f) => f.id !== id);
    setArquivos(updated);
    onUpdate(item.id, {
      arquivos: updated,
      arquivo_corte_nome: updated[0]?.nome || undefined,
      arquivo_corte_url: updated[0]?.url || undefined,
    });
  };

  // Upload direto para o repeater com salvamento no IndexedDB
  const handleDirectUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      const novos: ArquivoItem[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const stored = await saveFileToStorage(file, {
          projectId: item.os_id,
          itemId: item.id,
          category: detectFileType(file.name),
        });
        novos.push({
          id: stored.id,
          nome: stored.name,
          url: stored.url || stored.dataUrl,
          tipo: stored.category,
          observacao: stored.sizeFormatted,
          created_at: stored.createdAt,
        });
      }
      const updated = [...arquivos, ...novos];
      setArquivos(updated);
      onUpdate(item.id, {
        arquivos: updated,
        arquivo_corte_nome: updated[0]?.nome || undefined,
        arquivo_corte_url: updated[0]?.url || undefined,
        status_corte: 'liberado',
      });
    } catch (err) {
      console.error('Erro no upload direto para o repeater:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectFromLibrary = (libFile: ArquivoItem) => {
    const updated = [...arquivos, libFile];
    setArquivos(updated);
    onUpdate(item.id, {
      arquivos: updated,
      arquivo_corte_nome: updated[0]?.nome || undefined,
      arquivo_corte_url: updated[0]?.url || undefined,
      status_corte: 'liberado',
    });
  };

  const getArquivoIcon = (tipo?: TipoArquivoItem) => {
    switch (tipo) {
      case 'corte_cnc':
        return <Scissors className="w-3.5 h-3.5 text-purple-500" />;
      case 'vetor_design':
        return <FileCode className="w-3.5 h-3.5 text-blue-500" />;
      case 'documento_pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-500" />;
      case 'imagem_render':
        return <Image className="w-3.5 h-3.5 text-emerald-500" />;
      case 'link_drive':
        return <LinkIcon className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Paperclip className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  // Funções do Checklist
  const toggleChecklist = (id: string) => {
    const updated = checklist.map((chk) =>
      chk.id === id ? { ...chk, done: !chk.done } : chk
    );
    setChecklist(updated);
    onUpdate(item.id, {
      observacoes: serializeNotes(updated),
    });
  };

  const removeChecklistItem = (id: string) => {
    const updated = checklist.filter((chk) => chk.id !== id);
    setChecklist(updated);
    onUpdate(item.id, {
      observacoes: serializeNotes(updated),
    });
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newChecklistText.trim(),
      done: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistText('');
    onUpdate(item.id, {
      observacoes: serializeNotes(updated),
    });
  };

  const completedChecklistCount = checklist.filter((c) => c.done).length;
  const checklistPercent =
    checklist.length > 0
      ? Math.round((completedChecklistCount / checklist.length) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => {
          handleSave();
          onClose();
        }}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-from-right duration-200">
          {/* Header do Drawer */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {item.codigo}
              </span>
              <span className="text-xs text-zinc-400">Detalhes da Tarefa & Arquivos</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (confirm('Deseja excluir esta tarefa/peça?')) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                title="Excluir Tarefa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  handleSave();
                  onClose();
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Corpo do Drawer */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Título da Tarefa / Peça */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Título do Item
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onBlur={handleSave}
                className="w-full px-3 py-2 text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* REPEATER DE ARQUIVOS COM UPLOAD & BIBLIOTECA */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Arquivos da Peça (Repeater com Upload)
                </span>
                <span className="font-mono-code text-[10px] text-zinc-500 px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  {arquivos.length} {arquivos.length === 1 ? 'arquivo' : 'arquivos'}
                </span>
              </div>

              {/* Botões de Ação do Repeater */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-2xs transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Enviando...' : 'Fazer Upload'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleDirectUpload(e.target.files)}
                />

                <button
                  type="button"
                  onClick={() => setIsFileManagerOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Escolher da Biblioteca</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddArquivo}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg transition-colors ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Link / URL</span>
                </button>
              </div>

              {/* Zona de Drop direto no Drawer */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  handleDirectUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`py-3 px-3 rounded-lg border border-dashed text-center cursor-pointer transition-all ${
                  isDraggingFile
                    ? 'border-purple-500 bg-purple-100/50 dark:bg-purple-950/40 text-purple-700'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 bg-white/60 dark:bg-zinc-900/60 text-zinc-500'
                }`}
              >
                <span className="text-[11px]">
                  Arraste arquivos aqui (.dxf, .cdr, .ai, .pdf, renders) ou clique para upload
                </span>
              </div>

              {/* Lista dos arquivos cadastrados no repeater */}
              {arquivos.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  {arquivos.map((arq, idx) => (
                    <div
                      key={arq.id}
                      className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-lg space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {getArquivoIcon(arq.tipo)}
                          <span className="font-mono-code text-[10px] font-bold text-zinc-500">
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Seletor do Tipo de Arquivo */}
                        <select
                          value={arq.tipo || 'corte_cnc'}
                          onChange={(e) =>
                            handleUpdateArquivo(arq.id, {
                              tipo: e.target.value as TipoArquivoItem,
                            })
                          }
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none"
                        >
                          <option value="corte_cnc">Corte CNC / Router (.DXF, .NC)</option>
                          <option value="vetor_design">Vetor Design (.CDR, .AI, .EPS)</option>
                          <option value="documento_pdf">Gabarito 1:1 / PDF Técnico</option>
                          <option value="imagem_render">Render 3D / Foto Obra</option>
                          <option value="link_drive">Link Drive / Nuvem</option>
                          <option value="outro">Outro Arquivo</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveArquivo(arq.id)}
                          className="p-1 text-zinc-400 hover:text-red-500 rounded transition-colors"
                          title="Remover arquivo do repeater"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Nome do Arquivo */}
                      <div>
                        <label className="text-[10px] font-medium text-zinc-400 block mb-0.5">
                          Nome do arquivo / Identificador
                        </label>
                        <input
                          type="text"
                          value={arq.nome}
                          onChange={(e) =>
                            handleUpdateArquivo(arq.id, { nome: e.target.value })
                          }
                          placeholder="Nome do arquivo (ex: corte_chapas_router.dxf)"
                          className="w-full px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono-code"
                        />
                      </div>

                      {/* Exibição Inteligente: Arquivo com Upload Salvo vs Link Externo */}
                      {arq.url && arq.url.startsWith('data:') ? (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/70 dark:bg-purple-950/25 border border-purple-200/70 dark:border-purple-900/40 text-xs">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <FileCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-purple-950 dark:text-purple-200 text-[11px] block truncate">
                                Arquivo carregado para produção
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono-code">
                                {arq.observacao || 'Armazenado no cache local'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => downloadFile(arq.nome, arq.url)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors cursor-pointer"
                              title="Baixar arquivo no computador"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Baixar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => previewFile(arq.url, arq.nome)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                              title="Visualizar arquivo em nova aba"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Visualizar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-zinc-400 block">
                            Link Externo (Google Drive, Dropbox, Nuvem)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={arq.url || ''}
                              onChange={(e) =>
                                handleUpdateArquivo(arq.id, { url: e.target.value })
                              }
                              placeholder="https://drive.google.com/... ou link de download"
                              className="flex-1 px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono-code text-[11px]"
                            />
                            {arq.url && (
                              <button
                                type="button"
                                onClick={() => previewFile(arq.url, arq.nome)}
                                className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded flex items-center gap-1 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                                title="Abrir Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Abrir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtarefas / Checklist Interativo */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                  Subtarefas / Checklist
                </span>
                {checklist.length > 0 && (
                  <span className="font-mono-code text-[10px] text-zinc-500">
                    {completedChecklistCount}/{checklist.length} ({checklistPercent}%)
                  </span>
                )}
              </div>

              {checklist.length > 0 && (
                <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>
              )}

              {/* Lista de itens do checklist */}
              <div className="space-y-1.5 pt-1">
                {checklist.map((chk) => (
                  <div
                    key={chk.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 group transition-colors"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={chk.done}
                        onChange={() => toggleChecklist(chk.id)}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span
                        className={`text-xs ${
                          chk.done
                            ? 'line-through text-zinc-400'
                            : 'text-zinc-800 dark:text-zinc-200'
                        } truncate`}
                      >
                        {chk.text}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeChecklistItem(chk.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Adicionar novo item no checklist */}
              <form onSubmit={addChecklistItem} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Adicionar subitem... (ex: Testar fonte 12V)"
                  className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Máquina e Ambiente */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Máquina Destino
                </label>
                <select
                  value={maquina}
                  onChange={(e) => {
                    const val = e.target.value as TipoMaquinaCorte;
                    setMaquina(val);
                    onUpdate(item.id, { maquina_corte: val });
                  }}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="router_cnc">Router CNC</option>
                  <option value="laser">Laser CO2 / Fibra</option>
                  <option value="plotter_recorte">Plotter de Recorte</option>
                  <option value="impressao">Impressão Digital</option>
                  <option value="manual">Manual / Bancada</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Ambiente
                </label>
                <input
                  type="text"
                  value={ambiente}
                  onChange={(e) => setAmbiente(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Ex: Fachada Externa"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Medidas e Material */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Especificações Técnicas
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400">Largura (mm)</label>
                  <input
                    type="number"
                    value={largura}
                    onChange={(e) => setLargura(e.target.value)}
                    onBlur={handleSave}
                    placeholder="ex: 1500"
                    className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400">Altura (mm)</label>
                  <input
                    type="number"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    onBlur={handleSave}
                    placeholder="ex: 800"
                    className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400">Material Principal</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Ex: ACM 3mm Azul, Acrílico 3mm Leitoso"
                  className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Anotações Gerais da Peça */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Anotações Gerais
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                onBlur={handleSave}
                placeholder="Observações de acabamento, detalhes da instalação..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Rodapé do Drawer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Alterações salvas automaticamente</span>
            <button
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>

      {/* Modal da Biblioteca de Arquivos (Modo Seletor) */}
      <FileManagerModal
        isOpen={isFileManagerOpen}
        onClose={() => setIsFileManagerOpen(false)}
        onSelectFile={handleSelectFromLibrary}
        projectId={item.os_id}
        pickerMode={true}
      />
    </div>
  );
};
