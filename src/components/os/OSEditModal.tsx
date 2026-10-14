import React, { useState } from 'react';
import { OrdemServico, OSStatus, OSPrioridade, SUGESTOES_AMBIENTES_CV } from '../../types';
import { X, Pencil, MapPin, Tag, Calendar, AlertCircle, Check, Plus } from 'lucide-react';
import { TagBadge, AmbienteBadge, OSStatusBadge, OSPrioridadeBadge } from '../common/Badge';
import {
  TagColor,
  TAG_COLORS,
  TAG_COLORS_CONFIG,
  DEFAULT_TRELLO_TAGS,
  formatTag,
  areTagsEqual,
} from '../../lib/tags';
import { TagManagerModal } from '../tags/TagManagerModal';

interface OSEditModalProps {
  order: OrdemServico;
  onClose: () => void;
  onSave: (updated: OrdemServico) => Promise<void>;
}

export const OSEditModal: React.FC<OSEditModalProps> = ({
  order,
  onClose,
  onSave,
}) => {
  const [numeroOS, setNumeroOS] = useState(order.numero_os);
  const [cliente, setCliente] = useState(order.cliente);
  const [telefone, setTelefone] = useState(order.telefone_cliente || '');
  const [nomeProjeto, setNomeProjeto] = useState(order.nome_projeto);
  const [ambientes, setAmbientes] = useState<string[]>(
    order.ambientes && order.ambientes.length > 0
      ? order.ambientes
      : order.ambiente
      ? [order.ambiente]
      : []
  );
  const [ambienteInput, setAmbienteInput] = useState('');
  const [prioridade, setPrioridade] = useState<OSPrioridade>(order.prioridade);
  const [status, setStatus] = useState<OSStatus>(order.status);
  const [previsaoEntrega, setPrevisaoEntrega] = useState(order.previsao_entrega);
  const [valorTotal, setValorTotal] = useState<number | ''>(order.valor_total || '');
  const [observacoes, setObservacoes] = useState(order.observacoes || '');
  const [tags, setTags] = useState<string[]>(order.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [tagColor, setTagColor] = useState<TagColor>('blue');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
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

  const handleAddCustomTag = (name: string, color: TagColor) => {
    const clean = name.trim();
    const formatted = formatTag(clean, color);
    if (tags.some((t) => areTagsEqual(t, formatted))) return;
    setTags([...tags, formatted]);
    setTagInput('');
  };

  const handleToggleTag = (tagFormatted: string) => {
    if (tags.some((t) => areTagsEqual(t, tagFormatted))) {
      setTags(tags.filter((t) => !areTagsEqual(t, tagFormatted)));
    } else {
      setTags([...tags, tagFormatted]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => !areTagsEqual(t, tagToRemove)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim() || !nomeProjeto.trim() || !numeroOS.trim()) return;

    setIsSubmitting(true);
    try {
      const updatedOrder: OrdemServico = {
        ...order,
        numero_os: numeroOS.trim(),
        cliente: cliente.trim(),
        telefone_cliente: telefone.trim() || undefined,
        nome_projeto: nomeProjeto.trim(),
        ambientes,
        ambiente: ambientes.length > 0 ? ambientes.join(', ') : undefined,
        prioridade,
        status,
        previsao_entrega: previsaoEntrega,
        valor_total: valorTotal !== '' ? Number(valorTotal) : undefined,
        observacoes: observacoes.trim() || undefined,
        tags,
        updated_at: new Date().toISOString(),
      };

      await onSave(updatedOrder);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="p-4 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-black text-white dark:bg-white dark:text-black">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-light-text dark:text-dark-text">
                Editar Informações da Obra: {order.numero_os}
              </h3>
              <p className="text-[11px] text-light-muted dark:text-dark-muted">
                Atualize prazos, escopo, ambientação e dados do cliente
              </p>
            </div>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Número da OS */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Número da OS *
              </label>
              <input
                type="text"
                required
                value={numeroOS}
                onChange={(e) => setNumeroOS(e.target.value)}
                className="w-full px-3 py-2 font-mono-code font-bold rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Previsão de Entrega */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Previsão de Entrega *
              </label>
              <input
                type="date"
                required
                value={previsaoEntrega}
                onChange={(e) => setPrevisaoEntrega(e.target.value)}
                className="w-full px-3 py-2 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Telefone de Contato
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 98888-0000"
                className="w-full px-3 py-2 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
              />
            </div>

            {/* Nome do Projeto */}
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Nome do Projeto / Escopo da Obra *
              </label>
              <input
                type="text"
                required
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none font-medium"
              />
            </div>

            {/* Status da Produção */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Status da Produção
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OSStatus)}
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none font-medium"
              >
                <option value="medicao_visita">Visita / Medição Técnica</option>
                <option value="layout_aprovado">Layout 3D Aprovado</option>
                <option value="corte_pendente">Cortes Pendentes (CNC/Router)</option>
                <option value="separacao_pendente">Separação de Materiais</option>
                <option value="em_producao">Em Produção / Usinagem</option>
                <option value="pronto_entrega">Pronto para Instalação</option>
                <option value="entregue">Instalado na Obra</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as OSPrioridade)}
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none font-medium"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            {/* Valor do Projeto */}
            <div>
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="Ex: 28500.00"
                className="w-full px-3 py-2 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
              />
            </div>

            {/* Ambientes da Obra (Ambientação da Comunicação Visual) */}
            <div className="sm:col-span-2 pt-2 border-t border-light-border dark:border-dark-border">
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Ambientes da Obra (Ambientação)</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  As peças desta obra serão vinculadas a estes ambientes
                </span>
              </label>

              {/* Ambientes Ativos */}
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
                  placeholder="Digitar novo ambiente (Ex: Fachada Frontal, Recepção) e Enter"
                  className="flex-1 px-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddAmbiente(ambienteInput)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded bg-neutral-200 dark:bg-neutral-800 text-light-text dark:text-dark-text hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {/* Sugestões Rápidas de Ambientes */}
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

            {/* Tags e Etiquetas do Projeto (Estilo Trello) */}
            <div className="sm:col-span-2 pt-2 border-t border-light-border dark:border-dark-border">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-light-text dark:text-dark-text flex items-center gap-1.5 text-xs">
                  <Tag className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Etiquetas Visuais do Projeto (Cores e Alertas)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(true)}
                  className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline underline-offset-2 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Gerenciar Etiquetas</span>
                </button>
              </div>

              {/* Tags Ativas */}
              <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] p-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-2.5">
                {tags.length === 0 ? (
                  <span className="text-[11px] text-neutral-400 italic">
                    Nenhuma etiqueta vinculada. Clique em uma cor abaixo ou crie uma personalizada.
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

              {/* Sugestões Rápidas de Etiquetas com Cores Vivas (Trello) */}
              <div className="mb-3">
                <span className="text-[10px] font-semibold text-neutral-400 block mb-1">
                  Etiquetas Rápidas de Comunicação Visual (Clique para alternar):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {DEFAULT_TRELLO_TAGS.map((sug) => {
                    const formatted = formatTag(sug.name, sug.color);
                    const isAdded = tags.some((t) => areTagsEqual(t, formatted));
                    const cfg = TAG_COLORS_CONFIG[sug.color];

                    return (
                      <button
                        key={sug.name}
                        type="button"
                        onClick={() => handleToggleTag(formatted)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all flex items-center gap-1 shadow-xs select-none ${
                          isAdded
                            ? `${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass} ring-1 ring-black dark:ring-white scale-105`
                            : 'bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border text-neutral-600 dark:text-neutral-300 hover:border-black dark:hover:border-white opacity-85'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${cfg.bgClass} shrink-0`}
                        />
                        <span>{sug.name}</span>
                        {isAdded && <Check className="w-2.5 h-2.5 stroke-[3] ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Criar Etiqueta Personalizada com Seletor de Cor */}
              <div className="p-2.5 rounded border border-light-border dark:border-dark-border bg-light-surface/60 dark:bg-dark-surface/60">
                <span className="text-[10px] font-semibold text-light-text dark:text-dark-text block mb-1.5">
                  Criar Etiqueta com Cor Personalizada:
                </span>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim()) handleAddCustomTag(tagInput, tagColor);
                      }
                    }}
                    placeholder="Nome da etiqueta (ex: Instalação Noturna, Acrílico 5mm)"
                    className="flex-1 px-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                  />

                  {/* Seletor de Cor */}
                  <div className="flex items-center gap-1 justify-between sm:justify-start">
                    {TAG_COLORS.map((col) => {
                      const cfg = TAG_COLORS_CONFIG[col];
                      const isSel = tagColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setTagColor(col)}
                          title={cfg.label}
                          className={`w-5 h-5 rounded transition-transform ${cfg.bgClass} ${
                            isSel
                              ? 'ring-2 ring-black dark:ring-white scale-110'
                              : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (tagInput.trim()) handleAddCustomTag(tagInput, tagColor);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-neutral-200 dark:bg-neutral-800 text-light-text dark:text-dark-text hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Observações Gerais */}
            <div className="sm:col-span-2 pt-2 border-t border-light-border dark:border-dark-border">
              <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                Observações Gerais do Projeto
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Instruções para instaladores, detalhes de iluminação, restrições de horários de shopping..."
                className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
              />
            </div>

          </div>

          {/* Rodapé de Ações */}
          <div className="p-4 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-end gap-3 -mx-4 -mb-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-black text-white dark:bg-white dark:text-black font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>

        </form>

      </div>

      {/* Modal de Gestão Completa de Etiquetas */}
      {isTagModalOpen && (
        <TagManagerModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          selectedTags={tags}
          projectTitle={`${numeroOS} - ${cliente}`}
          onToggleTag={handleToggleTag}
        />
      )}
    </div>
  );
};
