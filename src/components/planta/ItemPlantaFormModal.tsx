import React, { useState, useRef } from 'react';
import { ItemPlanta, StatusItemObra, TipoMaquinaCorte } from '../../types';
import {
  X,
  Upload,
  Image as ImageIcon,
  FileCode,
  Link,
  Trash2,
  Check,
  AlertCircle,
  Zap,
  MapPin,
} from 'lucide-react';

interface ItemPlantaFormModalProps {
  osId: string;
  osAmbientes?: string[];
  itemToEdit?: ItemPlanta | null;
  onClose: () => void;
  onSave: (
    itemData: Omit<ItemPlanta, 'id' | 'os_id' | 'created_at'>
  ) => Promise<void>;
  nextSuggestedCode?: string;
}

export const ItemPlantaFormModal: React.FC<ItemPlantaFormModalProps> = ({
  osId,
  osAmbientes = [],
  itemToEdit,
  onClose,
  onSave,
  nextSuggestedCode = 'FCH-01',
}) => {
  const defaultAmbiente = itemToEdit?.ambiente || (osAmbientes.length > 0 ? osAmbientes[0] : '');
  const [codigo, setCodigo] = useState(itemToEdit?.codigo || nextSuggestedCode);
  const [nome, setNome] = useState(itemToEdit?.nome || '');
  const [ambiente, setAmbiente] = useState(defaultAmbiente);
  const [tipoElemento, setTipoElemento] = useState(itemToEdit?.tipo_elemento || 'Fachada ACM');
  const [maquinaCorte, setMaquinaCorte] = useState<TipoMaquinaCorte>(itemToEdit?.maquina_corte || 'router_cnc');
  const [largura, setLargura] = useState<number | ''>(itemToEdit?.largura_mm || '');
  const [altura, setAltura] = useState<number | ''>(itemToEdit?.altura_mm || '');
  const [profundidade, setProfundidade] = useState<number | ''>(itemToEdit?.profundidade_mm || '');
  const [quantidade, setQuantidade] = useState<number>(itemToEdit?.quantidade || 1);
  const [material, setMaterial] = useState(itemToEdit?.material_principal || 'ACM 3mm');
  const [iluminado, setIluminado] = useState<boolean>(itemToEdit?.iluminado || false);
  const [gabaritoGerado, setGabaritoGerado] = useState<boolean>(itemToEdit?.gabarito_gerado || false);
  const [statusItem, setStatusItem] = useState<StatusItemObra>(itemToEdit?.status_item || 'layout');
  const [statusCorte, setStatusCorte] = useState<'pendente' | 'cortado' | 'liberado'>(
    itemToEdit?.status_corte || 'pendente'
  );
  const [fotoUrl, setFotoUrl] = useState(itemToEdit?.foto_url || '');
  const [arquivoCorteNome, setArquivoCorteNome] = useState(itemToEdit?.arquivo_corte_nome || '');
  const [arquivoCorteUrl, setArquivoCorteUrl] = useState(itemToEdit?.arquivo_corte_url || '');
  const [observacoes, setObservacoes] = useState(itemToEdit?.observacoes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const cutFileInputRef = useRef<HTMLInputElement>(null);

  // Manipular upload de foto do computador (converte para Base64 Data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto de até 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Manipular upload de arquivo de corte (DXF, EPS, CDR, AI, PDF, NC, PLT)
  const handleCutFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArquivoCorteNome(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setArquivoCorteUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nome.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        codigo: codigo.trim().toUpperCase(),
        nome: nome.trim(),
        ambiente: ambiente.trim(),
        tipo_elemento: tipoElemento,
        maquina_corte: maquinaCorte,
        largura_mm: largura ? Number(largura) : undefined,
        altura_mm: altura ? Number(altura) : undefined,
        profundidade_mm: profundidade ? Number(profundidade) : undefined,
        quantidade: Number(quantidade) || 1,
        material_principal: material.trim() || undefined,
        iluminado,
        gabarito_gerado: gabaritoGerado,
        foto_url: fotoUrl.trim() || undefined,
        arquivo_corte_nome: arquivoCorteNome.trim() || undefined,
        arquivo_corte_url: arquivoCorteUrl.trim() || undefined,
        status_corte: statusCorte,
        status_item: statusItem,
        observacoes: observacoes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-3 animate-in fade-in duration-150 backdrop-blur-sm">
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="p-4 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white" />
            <h3 className="text-sm font-bold text-light-text dark:text-dark-text">
              {itemToEdit ? `Editar Peça: ${itemToEdit.codigo}` : 'Cadastrar Peça de Comunicação Visual'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Código do Item */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Código na Planta *
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: FCH-01, LET-01, TTM-01"
                className="w-full px-3 py-2 font-mono-code font-bold rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Tipo de Elemento */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Tipo de Elemento
              </label>
              <select
                value={tipoElemento}
                onChange={(e) => setTipoElemento(e.target.value)}
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
              >
                <option value="Fachada ACM">Fachada ACM (Bandejas)</option>
                <option value="Letra Caixa">Letra Caixa (Bloco / LED)</option>
                <option value="Logo em Relevo">Logo / Emblema em Relevo</option>
                <option value="Totem Externo">Totem Externo / Dupla Face</option>
                <option value="Sinalização Interna">Sinalização Interna / Placas</option>
                <option value="Adesivagem">Adesivagem / Envelopamento</option>
                <option value="Neon LED">Neon LED Flex em Silicone</option>
                <option value="Estrutura Metálica">Estrutura / Serralheria</option>
                <option value="Gabarito">Gabarito de Furação 1:1</option>
              </select>
            </div>

            {/* Máquina de Corte Destino */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Máquina de Corte
              </label>
              <select
                value={maquinaCorte}
                onChange={(e) => setMaquinaCorte(e.target.value as TipoMaquinaCorte)}
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none font-medium"
              >
                <option value="router_cnc">Router CNC (ACM / PVC / Acrílico)</option>
                <option value="laser">Laser CO2 / Fibra (Acrílico / Inox)</option>
                <option value="plotter_recorte">Plotter de Recorte (Vinil Adesivo)</option>
                <option value="impressao">Mesa / Plotter Impressão (Lona)</option>
                <option value="manual">Corte Manual / Serralheria</option>
              </select>
            </div>

            {/* Nome da Peça */}
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Descrição da Peça / Letreiro *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Fachada em Bandejas ACM Azul ou Letras Acrílico LED"
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Ambiente / Local na Obra (Correspondente à OS) */}
            <div className="sm:col-span-3 p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label className="block font-semibold text-light-text dark:text-dark-text flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Ambiente da Obra *</span>
                </label>
                <span className="text-[10px] text-neutral-400">
                  Cada peça deve corresponder à ambientação definida na OS
                </span>
              </div>

              {/* Sugestões diretas dos ambientes cadastrados na OS */}
              {osAmbientes.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono-code uppercase tracking-wider block">
                    Ambientes desta OS (Clique para vincular):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {osAmbientes.map((amb) => {
                      const isSelected = ambiente === amb;
                      return (
                        <button
                          key={amb}
                          type="button"
                          onClick={() => setAmbiente(amb)}
                          className={`inline-flex items-center gap-1 text-xs font-mono-code px-2.5 py-1 rounded border transition-colors ${
                            isSelected
                              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold'
                              : 'bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:border-black dark:hover:border-white'
                          }`}
                        >
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{amb}</span>
                          {isSelected && <Check className="w-3 h-3 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Campo para digitar ou alterar o ambiente */}
              <div className="pt-1">
                <input
                  type="text"
                  required
                  value={ambiente}
                  onChange={(e) => setAmbiente(e.target.value)}
                  placeholder="Ou digite o ambiente específico (Ex: Fachada Frontal, Entrada Boxes, Recepção)"
                  className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-medium"
                />
              </div>
            </div>

            {/* Material Principal */}
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Material / Especificação de Chapa
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Ex: ACM 3mm Azul Brilho 0.21 | Acrílico Cast 3mm Branco Leitoso | PVC 20mm"
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
              />
            </div>

            {/* Quantidade */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
              />
            </div>

          </div>

          {/* Dimensões em Milímetros (Padrão de Comunicação Visual) */}
          <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface/60 dark:bg-dark-surface/60">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-light-text dark:text-dark-text">
                Dimensões da Peça (Milímetros - mm)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-light-text dark:text-dark-text select-none">
                  <input
                    type="checkbox"
                    checked={iluminado}
                    onChange={(e) => setIluminado(e.target.checked)}
                    className="rounded border-light-border dark:border-dark-border text-black focus:ring-0"
                  />
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Iluminado (LED 12V)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-light-text dark:text-dark-text select-none">
                  <input
                    type="checkbox"
                    checked={gabaritoGerado}
                    onChange={(e) => setGabaritoGerado(e.target.checked)}
                    className="rounded border-light-border dark:border-dark-border text-black focus:ring-0"
                  />
                  <span>Gabarito 1:1 Impresso</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="block text-[10px] text-light-muted dark:text-dark-muted mb-0.5">Largura (L)</span>
                <input
                  type="number"
                  min="0"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 14000"
                  className="w-full px-2.5 py-1.5 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-[10px] text-light-muted dark:text-dark-muted mb-0.5">Altura (A)</span>
                <input
                  type="number"
                  min="0"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 2200"
                  className="w-full px-2.5 py-1.5 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-[10px] text-light-muted dark:text-dark-muted mb-0.5">Espessura / Profundidade (P)</span>
                <input
                  type="number"
                  min="0"
                  value={profundidade}
                  onChange={(e) => setProfundidade(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 80"
                  className="w-full px-2.5 py-1.5 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Status do Item e Status de Corte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Status da Produção
              </label>
              <select
                value={statusItem}
                onChange={(e) => setStatusItem(e.target.value as StatusItemObra)}
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none font-medium"
              >
                <option value="layout">Em Layout (Detalhamento de Vetores)</option>
                <option value="corte_pendente">Corte Pendente (Aguardando Router / Laser)</option>
                <option value="em_producao">Em Usinagem / Dobras / Serralheria</option>
                <option value="teste_eletrico">Teste Elétrico / Teste de Bancada LED</option>
                <option value="pronto_instalacao">Pronto p/ Equipe de Instalação</option>
                <option value="instalado">Instalado na Obra</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Status do Corte Desta Peça
              </label>
              <select
                value={statusCorte}
                onChange={(e) => setStatusCorte(e.target.value as 'pendente' | 'cortado' | 'liberado')}
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none font-medium"
              >
                <option value="pendente">Pendente de Corte</option>
                <option value="cortado">Peças Cortadas / Usinadas</option>
                <option value="liberado">Liberado / Concluído</option>
              </select>
            </div>
          </div>

          {/* Upload / URL de Foto ou Render 3D */}
          <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface/40 dark:bg-dark-surface/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-light-text dark:text-dark-text flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>Foto da Fachada no Local ou Render 3D do Projeto</span>
              </label>
              {fotoUrl && (
                <button
                  type="button"
                  onClick={() => setFotoUrl('')}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" /> Remover foto
                </button>
              )}
            </div>

            {fotoUrl ? (
              <div className="relative w-full h-36 bg-black/60 rounded overflow-hidden flex items-center justify-center border border-light-border dark:border-dark-border">
                <img
                  src={fotoUrl}
                  alt="Pré-visualização do item"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full sm:w-auto px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text flex items-center justify-center gap-1.5 font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Escolher Foto do Computador</span>
                </button>

                <span className="text-[10px] text-light-muted dark:text-dark-muted">ou cole o link:</span>

                <input
                  type="url"
                  placeholder="https://exemplo.com/foto_fachada.jpg"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  className="flex-1 w-full px-3 py-1.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Arquivo de Corte (DXF, EPS, CDR, AI, PDF) */}
          <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface/40 dark:bg-dark-surface/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-light-text dark:text-dark-text flex items-center gap-1.5">
                <FileCode className="w-4 h-4" />
                <span>Arquivo de Corte / Usinagem (.DXF, .EPS, .CDR, .AI, .PDF)</span>
              </label>
              {(arquivoCorteNome || arquivoCorteUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setArquivoCorteNome('');
                    setArquivoCorteUrl('');
                  }}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" /> Remover arquivo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="file"
                  ref={cutFileInputRef}
                  accept=".dxf,.eps,.cdr,.ai,.pdf,.txt,.cut,.nc,.plt"
                  onChange={handleCutFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cutFileInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text flex items-center justify-center gap-1.5 font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Anexar Arquivo de Vetor</span>
                </button>
                {arquivoCorteNome && (
                  <p className="text-[11px] font-mono-code text-light-text dark:text-dark-text mt-1 truncate">
                    Arquivo: {arquivoCorteNome}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Ou link em nuvem (Drive, DropBox, Rede)"
                  value={arquivoCorteUrl}
                  onChange={(e) => {
                    setArquivoCorteUrl(e.target.value);
                    if (!arquivoCorteNome && e.target.value) {
                      setArquivoCorteNome('Link em Nuvem');
                    }
                  }}
                  className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Observações da Peça */}
          <div>
            <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
              Observações Técnicas / Furação / Elétrica / Gabarito
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Fresa em V 90° para dobra de bandejas. Saída de fio de 12V no canto inferior esquerdo com rabicho de 50cm."
              className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded border border-light-border dark:border-dark-border hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-bold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Peça da Obra</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
