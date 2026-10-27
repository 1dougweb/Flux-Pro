import React, { useState } from 'react';
import {
  FileCode,
  FileText,
  Image,
  ExternalLink,
  Plus,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  X,
  Link as LinkIcon,
  Paperclip,
  Eye,
} from 'lucide-react';
import { ItemPlanta, PlanoCorte, ArquivoItem, TipoArquivoItem } from '../../types';
import { downloadFile, previewFile } from '../../lib/fileStorage';

interface ProjectFilesHubProps {
  items: ItemPlanta[];
  planoCorte?: PlanoCorte;
  onUpdatePlanoCorte: (plan: Partial<PlanoCorte>) => void;
  onUpdateItem: (id: string, updates: Partial<ItemPlanta>) => void;
}

export const ProjectFilesHub: React.FC<ProjectFilesHubProps> = ({
  items,
  planoCorte,
  onUpdatePlanoCorte,
  onUpdateItem,
}) => {
  const [softwareCAM, setSoftwareCAM] = useState(planoCorte?.software_origem || 'ArtCAM');
  const [maquina, setMaquina] = useState(planoCorte?.maquina_principal || 'Router CNC');
  const [camLink, setCamLink] = useState(planoCorte?.arquivo_ou_link || '');
  const [totalChapas, setTotalChapas] = useState(planoCorte?.total_chapas ? String(planoCorte.total_chapas) : '0');
  const [especChapas, setEspecChapas] = useState(planoCorte?.especificacao_chapas || '');

  // Modal para anexar novo arquivo a uma peça
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileType, setNewFileType] = useState<TipoArquivoItem>('corte_cnc');

  // Conta total de arquivos no repeater de todas as peças
  const totalFilesInProject = items.reduce((acc, it) => {
    const count = (it.arquivos && it.arquivos.length) || (it.arquivo_corte_nome ? 1 : 0);
    return acc + count;
  }, 0);

  const handleSaveCAM = () => {
    onUpdatePlanoCorte({
      software_origem: softwareCAM,
      maquina_principal: maquina,
      arquivo_ou_link: camLink.trim() || undefined,
      total_chapas: parseInt(totalChapas) || 0,
      especificacao_chapas: especChapas.trim() || undefined,
    });
  };

  const handleAttachFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !newFileName.trim()) return;

    const targetItem = items.find((it) => it.id === selectedItemId);
    if (!targetItem) return;

    const existingArquivos = targetItem.arquivos ? [...targetItem.arquivos] : [];
    if (existingArquivos.length === 0 && (targetItem.arquivo_corte_nome || targetItem.arquivo_corte_url)) {
      existingArquivos.push({
        id: `f-legacy-${Date.now()}`,
        nome: targetItem.arquivo_corte_nome || 'arquivo_corte.dxf',
        url: targetItem.arquivo_corte_url || '',
        tipo: 'corte_cnc',
      });
    }

    const novoArquivo: ArquivoItem = {
      id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nome: newFileName.trim(),
      url: newFileUrl.trim() || undefined,
      tipo: newFileType,
      created_at: new Date().toISOString(),
    };

    const updatedArquivos = [...existingArquivos, novoArquivo];

    onUpdateItem(selectedItemId, {
      arquivos: updatedArquivos,
      arquivo_corte_nome: updatedArquivos[0]?.nome || undefined,
      arquivo_corte_url: updatedArquivos[0]?.url || undefined,
      status_corte: 'liberado',
    });

    setNewFileName('');
    setNewFileUrl('');
    setIsAttachModalOpen(false);
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

  return (
    <div className="space-y-6">
      {/* 1. Card de Liberação Central do Plano de Corte CAM */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Plano Central de Otimização e Corte CNC (CAM)</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Diretrizes de nesting, chapas e link de corte para os operadores de máquinas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const novoStatus = planoCorte?.aprovado_producao ? false : true;
                onUpdatePlanoCorte({
                  aprovado_producao: novoStatus,
                  status_corte: novoStatus ? 'enviado_producao' : 'em_otimizacao',
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                planoCorte?.aprovado_producao
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {planoCorte?.aprovado_producao
                  ? 'Liberado para Fábrica'
                  : 'Liberar para Fábrica'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Software CAM / Vetor
            </label>
            <input
              type="text"
              value={softwareCAM}
              onChange={(e) => setSoftwareCAM(e.target.value)}
              onBlur={handleSaveCAM}
              placeholder="ArtCAM, Aspire, CorelDRAW, AutoCAD"
              className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Máquina Principal
            </label>
            <input
              type="text"
              value={maquina}
              onChange={(e) => setMaquina(e.target.value)}
              onBlur={handleSaveCAM}
              placeholder="Router CNC, Laser CO2, Plotter"
              className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Total Estimado de Chapas
            </label>
            <input
              type="number"
              value={totalChapas}
              onChange={(e) => setTotalChapas(e.target.value)}
              onBlur={handleSaveCAM}
              className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Link de Armazenamento do Pacote de Corte (.NC, .DXF, G-code)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={camLink}
                onChange={(e) => setCamLink(e.target.value)}
                onBlur={handleSaveCAM}
                placeholder="https://drive.google.com/drive/folders/... ou caminho na rede"
                className="flex-1 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
              />
              {camLink && (
                <a
                  href={camLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg flex items-center gap-1 shrink-0 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Especificação das Chapas
            </label>
            <input
              type="text"
              value={especChapas}
              onChange={(e) => setEspecChapas(e.target.value)}
              onBlur={handleSaveCAM}
              placeholder="Ex: 4x ACM 3mm Azul 5.00x1.22m, 2x Acrílico 3mm Leitoso"
              className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>
      </div>

      {/* 2. Arquivos Individuais de Corte vinculados às peças (Repeater Suportado) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Arquivos & Vetores das Peças (Repeater)</span>
            </h3>
            <p className="text-xs text-zinc-500">
              {totalFilesInProject} arquivo(s) anexados em {items.length} peças da obra
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={() => {
                setSelectedItemId(items[0]?.id || '');
                setNewFileName('');
                setNewFileUrl('');
                setIsAttachModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Anexar Arquivo / Link</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Nenhuma peça cadastrada no projeto ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => {
              const fileList: ArquivoItem[] =
                item.arquivos && item.arquivos.length > 0
                  ? item.arquivos
                  : item.arquivo_corte_nome || item.arquivo_corte_url
                  ? [
                      {
                        id: 'legacy-1',
                        nome: item.arquivo_corte_nome || 'Arquivo de Corte',
                        url: item.arquivo_corte_url,
                        tipo: 'corte_cnc',
                      },
                    ]
                  : [];

              const hasFiles = fileList.length > 0;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    hasFiles
                      ? 'bg-zinc-50 dark:bg-zinc-850/60 border-zinc-200 dark:border-zinc-800'
                      : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-dashed border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-code text-[11px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {item.codigo}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">
                          {item.ambiente || 'Geral'}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          item.status_corte === 'liberado'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : item.status_corte === 'cortado'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {item.status_corte === 'liberado'
                          ? 'Liberado'
                          : item.status_corte === 'cortado'
                          ? 'Cortado'
                          : 'Pendente'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate mb-1">
                      {item.nome}
                    </div>

                    <div className="text-[11px] text-zinc-500 mb-3">
                      {item.material_principal || 'Material não especificado'}
                    </div>
                  </div>

                  {/* Lista de Arquivos do Repeater da Peça */}
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    {hasFiles ? (
                      <div className="space-y-1">
                        {fileList.map((f, idx) => (
                          <div
                            key={f.id || idx}
                            className="flex items-center justify-between gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-mono-code bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {getArquivoIcon(f.tipo)}
                              <span className="truncate text-[11px]">
                                {f.nome || 'Arquivo sem nome'}
                              </span>
                            </div>
                            {f.url && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => downloadFile(f.nome, f.url)}
                                  className="text-zinc-400 hover:text-purple-600 dark:hover:text-purple-300 p-0.5 rounded cursor-pointer"
                                  title="Baixar arquivo"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => previewFile(f.url, f.nome)}
                                  className="text-zinc-400 hover:text-blue-600 dark:hover:text-blue-300 p-0.5 rounded cursor-pointer"
                                  title="Visualizar ou abrir link"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 py-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Nenhum arquivo anexado</span>
                      </div>
                    )}

                    {/* Botão rápido para adicionar outro arquivo a esta peça */}
                    <button
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setNewFileName('');
                        setNewFileUrl('');
                        setIsAttachModalOpen(true);
                      }}
                      className="w-full text-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                    >
                      + Anexar outro arquivo a {item.codigo}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Anexar Arquivo ao Repeater de uma Peça */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAttachModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600" />
                <span>Anexar Arquivo à Peça (Repeater)</span>
              </h3>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachFile} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Selecione a Peça / Item da Obra *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.codigo} - {it.nome} ({it.ambiente || 'Geral'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Tipo de Arquivo *
                </label>
                <select
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value as TipoArquivoItem)}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="corte_cnc">Corte CNC / Router (.DXF, .NC, .GCODE)</option>
                  <option value="vetor_design">Vetor Design (.CDR, .AI, .EPS, .SVG)</option>
                  <option value="documento_pdf">Gabarito 1:1 / PDF Técnico</option>
                  <option value="imagem_render">Render 3D / Foto Obra</option>
                  <option value="link_drive">Link Drive / Nuvem</option>
                  <option value="outro">Outro Arquivo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Nome do Arquivo *
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Ex: fachada_principal_router.dxf ou gabarito_1_1.pdf"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono-code"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Link / URL do Arquivo
                </label>
                <input
                  type="text"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  placeholder="Link Google Drive, Dropbox, ou pasta de rede"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAttachModalOpen(false)}
                  className="px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:opacity-90 shadow-xs"
                >
                  Adicionar Arquivo ao Repeater
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
