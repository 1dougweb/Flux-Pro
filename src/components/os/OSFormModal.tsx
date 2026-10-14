import React, { useState } from 'react';
import { OrdemServico, OSStatus, OSPrioridade, SUGESTOES_TAGS_CV, SUGESTOES_AMBIENTES_CV } from '../../types';
import { X, Plus, Calendar, AlertCircle, Tag, MapPin } from 'lucide-react';
import { TagBadge, AmbienteBadge } from '../common/Badge';

interface OSFormModalProps {
  onClose: () => void;
  onCreateOrder: (
    data: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<OrdemServico>;
  existingOrdersCount: number;
}

export const OSFormModal: React.FC<OSFormModalProps> = ({
  onClose,
  onCreateOrder,
  existingOrdersCount,
}) => {
  const currentYear = new Date().getFullYear();
  const defaultSeq = String(existingOrdersCount + 1).padStart(3, '0');
  const defaultOSNum = `OS-${currentYear}-${defaultSeq}`;

  // Previsão padrão: 15 dias a partir de hoje
  const defaultDeliveryDate = new Date();
  defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 15);
  const defaultDeliveryStr = defaultDeliveryDate.toISOString().split('T')[0];

  const [numeroOS, setNumeroOS] = useState(defaultOSNum);
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [ambientes, setAmbientes] = useState<string[]>(['Fachada Principal']);
  const [ambienteInput, setAmbienteInput] = useState('');
  const [prioridade, setPrioridade] = useState<OSPrioridade>('normal');
  const [status, setStatus] = useState<OSStatus>('layout_aprovado');
  const [previsaoEntrega, setPrevisaoEntrega] = useState(defaultDeliveryStr);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAmbiente = (ambToAdd: string) => {
    const clean = ambToAdd.trim();
    if (!clean) return;
    if (ambientes.includes(clean)) return;
    setAmbientes([...ambientes, clean]);
    setAmbienteInput('');
  };

  const handleRemoveAmbiente = (ambToRemove: string) => {
    setAmbientes(ambientes.filter((a) => a !== ambToRemove));
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (!clean) return;
    if (tags.includes(clean)) return;
    setTags([...tags, clean]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim() || !nomeProjeto.trim() || !numeroOS.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateOrder({
        numero_os: numeroOS.trim(),
        cliente: cliente.trim(),
        telefone_cliente: telefone.trim() || undefined,
        nome_projeto: nomeProjeto.trim(),
        ambiente: ambientes.length > 0 ? ambientes.join(', ') : (ambienteInput.trim() || undefined),
        ambientes: ambientes.length > 0 ? ambientes : (ambienteInput.trim() ? [ambienteInput.trim()] : undefined),
        prioridade,
        status,
        tags,
        data_inicio: new Date().toISOString().split('T')[0],
        previsao_entrega: previsaoEntrega,
        observacoes: observacoes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg w-full max-w-xl overflow-hidden shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="p-4 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white" />
            <h3 className="text-sm font-bold text-light-text dark:text-dark-text">
              Abrir Nova Ordem de Serviço (OS)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Número da OS */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Número da OS *
              </label>
              <input
                type="text"
                required
                value={numeroOS}
                onChange={(e) => setNumeroOS(e.target.value)}
                placeholder="Ex: OS-2026-006"
                className="w-full px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Previsão de Entrega */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Previsão de Entrega *
              </label>
              <input
                type="date"
                required
                value={previsaoEntrega}
                onChange={(e) => setPrevisaoEntrega(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ex: Ana Paula Ribeiro"
                className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Telefone de Contato
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 98888-0000"
                className="w-full px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Nome do Projeto */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Nome do Projeto / Escopo *
              </label>
              <input
                type="text"
                required
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                placeholder="Ex: Fachada em ACM e Letreiro Luminoso LED"
                className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Ambientes da Obra (Ambientação da Comunicação Visual) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Ambientes da Obra (Ambientação)</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  Os itens da obra serão vinculados a estes ambientes
                </span>
              </label>

              {/* Ambientes Selecionados */}
              <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] p-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-2">
                {ambientes.length === 0 ? (
                  <span className="text-[11px] text-neutral-400 italic">
                    Nenhum ambiente selecionado. Adicione abaixo.
                  </span>
                ) : (
                  ambientes.map((amb) => (
                    <AmbienteBadge
                      key={amb}
                      ambiente={amb}
                      onRemove={() => handleRemoveAmbiente(amb)}
                    />
                  ))
                )}
              </div>

              {/* Input para adicionar ambiente customizado */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={ambienteInput}
                  onChange={(e) => setAmbienteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAmbiente(ambienteInput);
                    }
                  }}
                  placeholder="Digitar novo ambiente (Ex: Fachada Frontal, Recepção) e pressionar Enter"
                  className="flex-1 px-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddAmbiente(ambienteInput)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded bg-neutral-200 dark:bg-neutral-800 text-light-text dark:text-dark-text hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {/* Sugestões Rápidas de Ambientes de CV */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-neutral-400 mr-1">Sugestões:</span>
                {SUGESTOES_AMBIENTES_CV.map((sug) => {
                  const alreadyAdded = ambientes.includes(sug);
                  return (
                    <button
                      key={sug}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddAmbiente(sug)}
                      className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded border transition-colors ${
                        alreadyAdded
                          ? 'opacity-40 border-dashed border-neutral-300 dark:border-neutral-700 cursor-not-allowed'
                          : 'border-light-border dark:border-dark-border hover:border-black dark:hover:border-white bg-light-card dark:bg-dark-card'
                      }`}
                    >
                      + {sug}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as OSPrioridade)}
                className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>

            {/* Status Inicial */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Status Inicial da Produção
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OSStatus)}
                className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none font-medium"
              >
                <option value="layout_aprovado">Layout Aprovado (Aguardando arquivos CNC / Router / Laser)</option>
                <option value="corte_pendente">Corte Pendente (Prioridade na programação de corte)</option>
                <option value="separacao_pendente">Separação Pendente (ACM, Acrílico, LEDs, Fontes e Serralheria)</option>
                <option value="medicao_visita">Visita Técnica / Medição</option>
              </select>
            </div>

            {/* Observações */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                Observações Iniciais do Projetista
              </label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Revestimento em ACM Azul Brilho 3mm com bandejas usinadas na Router. Letras em acrílico 3mm com LED 6500K e fontes chaveadas 12V."
                className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
              />
            </div>

            {/* Tags do Projeto */}
            <div className="sm:col-span-2 pt-1 border-t border-light-border dark:border-dark-border">
              <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-neutral-500" />
                <span>Tags do Projeto (Comunicação Visual)</span>
              </label>

              {/* Tags ativas */}
              <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] p-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-2">
                {tags.length === 0 ? (
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 italic">
                    Nenhuma tag adicionada. Escolha uma sugestão rápida ou digite uma nova.
                  </span>
                ) : (
                  tags.map((t) => (
                    <TagBadge
                      key={t}
                      tag={t}
                      onRemove={() => handleRemoveTag(t)}
                    />
                  ))
                )}
              </div>

              {/* Input para adicionar nova tag */}
              <div className="flex items-center gap-1.5 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Digitar tag personalizada e teclar Enter..."
                  className="flex-1 px-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              {/* Sugestões rápidas de tags de CV */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[10px] uppercase font-mono-code text-neutral-400 dark:text-neutral-500 mr-1">
                  Sugestões:
                </span>
                {SUGESTOES_TAGS_CV.map((sug) => {
                  const already = tags.includes(sug);
                  return (
                    <button
                      key={sug}
                      type="button"
                      disabled={already}
                      onClick={() => handleAddTag(sug)}
                      className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded border transition-colors ${
                        already
                          ? 'opacity-40 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 cursor-not-allowed'
                          : 'border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text hover:border-black dark:hover:border-white'
                      }`}
                    >
                      +{sug}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-bold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
            >
              Criar Ordem de Serviço
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
