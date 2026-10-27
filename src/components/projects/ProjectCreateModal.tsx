import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Calendar,
  User,
  Phone,
  Tag,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react';
import { OrdemServico, OSPrioridade, SUGESTOES_AMBIENTES_CV, SUGESTOES_TAGS_CV } from '../../types';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    data: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<OrdemServico>;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [prioridade, setPrioridade] = useState<OSPrioridade>('normal');
  const [previsaoEntrega, setPrevisaoEntrega] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [ambientes, setAmbientes] = useState<string[]>(['Fachada Principal']);
  const [tags, setTags] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Atalhos de prazo
  const setQuickDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setPrevisaoEntrega(d.toISOString().split('T')[0]);
  };

  const toggleAmbiente = (amb: string) => {
    if (ambientes.includes(amb)) {
      setAmbientes(ambientes.filter((a) => a !== amb));
    } else {
      setAmbientes([...ambientes, amb]);
    }
  };

  const toggleTag = (t: string) => {
    if (tags.includes(t)) {
      setTags(tags.filter((tag) => tag !== t));
    } else {
      setTags([...tags, t]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProjeto.trim() || !cliente.trim()) return;

    setIsSubmitting(true);
    try {
      const ano = new Date().getFullYear();
      const numRandom = Math.floor(100 + Math.random() * 900);
      const numeroOs = `OS-${ano}-${numRandom}`;

      await onCreate({
        numero_os: numeroOs,
        nome_projeto: nomeProjeto.trim(),
        cliente: cliente.trim(),
        telefone_cliente: telefone.trim() || undefined,
        status: 'layout_aprovado',
        prioridade,
        data_inicio: new Date().toISOString().split('T')[0],
        previsao_entrega: previsaoEntrega,
        ambientes,
        tags,
        observacoes: observacoes.trim() || undefined,
      });

      onClose();
    } catch (err) {
      console.error('Erro ao criar projeto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Caixa do Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Criar Novo Projeto
              </h2>
              <p className="text-[11px] text-zinc-500">
                Cadastre a obra ou OS com fluxo ágil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nome do Projeto / Obra */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome do Projeto / Obra *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nomeProjeto}
              onChange={(e) => setNomeProjeto(e.target.value)}
              placeholder="Ex: Fachada Comercial em ACM e Letreiro Luminoso"
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Cliente e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Cliente *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome do cliente ou empresa"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Prazo de Entrega e Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Previsão de Entrega
              </label>
              <div className="relative mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={previsaoEntrega}
                  onChange={(e) => setPrevisaoEntrega(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(3)}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                >
                  +3d
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                >
                  +7d
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(15)}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                >
                  +15d
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(30)}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                >
                  +30d
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as OSPrioridade)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Ambientes / Fases da Obra */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Ambientes da Obra (selecione os aplicáveis)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUGESTOES_AMBIENTES_CV.slice(0, 8).map((amb) => {
                const isSelected = ambientes.includes(amb);
                return (
                  <button
                    type="button"
                    key={amb}
                    onClick={() => toggleAmbiente(amb)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{amb}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Rápidas */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Etiquetas do Projeto
            </label>
            <div className="flex flex-wrap gap-1">
              {SUGESTOES_TAGS_CV.slice(0, 10).map((t) => {
                const isSelected = tags.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`text-[10px] font-mono-code px-2 py-0.5 rounded transition-colors ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Briefing / Observações */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Briefing / Observações
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções de produção, acabamento, detalhes da instalação..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting ? 'Criando...' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
