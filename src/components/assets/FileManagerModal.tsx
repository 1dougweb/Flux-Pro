import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileCode,
  FileText,
  Image,
  Link as LinkIcon,
  Scissors,
  Paperclip,
  Trash2,
  Download,
  ExternalLink,
  Search,
  Filter,
  Check,
  FolderOpen,
  Sparkles,
  Eye,
} from 'lucide-react';
import { TipoArquivoItem, ArquivoItem } from '../../types';
import {
  StoredFile,
  getAllStoredFiles,
  saveFileToStorage,
  deleteStoredFile,
  formatFileSize,
  downloadFile,
  previewFile,
} from '../../lib/fileStorage';

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile?: (file: ArquivoItem) => void;
  projectId?: string;
  pickerMode?: boolean;
}

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  projectId,
  pickerMode = false,
}) => {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const list = await getAllStoredFiles(projectId);
      setFiles(list);
    } catch (err) {
      console.error('Erro ao carregar arquivos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        await saveFileToStorage(file, { projectId });
      }
      await loadFiles();
    } catch (err) {
      console.error('Erro no upload de arquivos:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja excluir o arquivo "${name}" da biblioteca?`)) {
      await deleteStoredFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const getFileIcon = (cat: TipoArquivoItem) => {
    switch (cat) {
      case 'corte_cnc':
        return <Scissors className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'vetor_design':
        return <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'documento_pdf':
        return <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'imagem_render':
        return <Image className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'link_drive':
        return <LinkIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Paperclip className="w-5 h-5 text-zinc-500" />;
    }
  };

  const filteredFiles = files.filter((f) => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q || f.name.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header da Biblioteca */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Biblioteca de Arquivos & Vetores</span>
                <span className="font-mono-code text-[11px] px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {files.length} {files.length === 1 ? 'item' : 'itens'}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                {pickerMode
                  ? 'Selecione um arquivo da biblioteca ou faça upload para anexar à peça'
                  : 'Gerenciador central de vetores DXF, CDR, PDFs técnicos e imagens'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar arquivo por nome..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              <option value="corte_cnc">Corte CNC / Router (.DXF, .NC)</option>
              <option value="vetor_design">Vetor Design (.CDR, .AI, .EPS)</option>
              <option value="documento_pdf">Gabarito 1:1 / PDF</option>
              <option value="imagem_render">Imagens & Renders</option>
            </select>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Enviando...' : 'Fazer Upload'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
          </div>
        </div>

        {/* Zona de Drag & Drop no Topo */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleUploadFiles(e.dataTransfer.files);
          }}
          className={`mx-6 mt-4 p-4 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Arraste e solte arquivos aqui para enviar à biblioteca
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Suporta vetores .DXF, .CDR, .AI, .EPS, gabaritos .PDF, renders e fotos
          </p>
        </div>

        {/* Grade de Arquivos */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center text-zinc-400 text-xs">
              Carregando biblioteca de arquivos...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Nenhum arquivo encontrado</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Faça o upload do primeiro arquivo acima para começar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredFiles.map((file) => {
                const isImage = file.category === 'imagem_render' && file.dataUrl?.startsWith('data:image');

                return (
                  <div
                    key={file.id}
                    className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-xl p-3 flex flex-col justify-between shadow-2xs transition-all"
                  >
                    <div>
                      {/* Preview Visual */}
                      <div className="h-28 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/60 mb-2.5 overflow-hidden flex items-center justify-center relative">
                        {isImage ? (
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            {getFileIcon(file.category)}
                            <span className="font-mono-code text-[10px] uppercase font-bold text-zinc-400">
                              {file.name.split('.').pop() || 'ARQ'}
                            </span>
                          </div>
                        )}

                        <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-black/70 text-white backdrop-blur-xs">
                          {file.sizeFormatted}
                        </span>
                      </div>

                      {/* Nome do Arquivo */}
                      <div
                        className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate mb-1"
                        title={file.name}
                      >
                        {file.name}
                      </div>

                      <div className="text-[10px] text-zinc-400">
                        {new Date(file.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {/* Ações do Arquivo */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1">
                        {(file.url || file.dataUrl) && (
                          <button
                            type="button"
                            onClick={() => downloadFile(file.name, file.url || file.dataUrl)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            title="Baixar arquivo no computador"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {(file.url || file.dataUrl) && (
                          <button
                            type="button"
                            onClick={() => previewFile(file.url || file.dataUrl, file.name)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            title="Visualizar arquivo em nova aba"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(file.id, file.name)}
                          className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                          title="Excluir da biblioteca"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {pickerMode && onSelectFile && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectFile({
                              id: file.id,
                              nome: file.name,
                              url: file.url || file.dataUrl,
                              tipo: file.category,
                            });
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Selecionar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
          <span>Armazenamento local persistido e de alta capacidade</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
