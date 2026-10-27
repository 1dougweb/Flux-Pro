import React, { useState } from 'react';
import {
  X,
  Edit3,
  Calendar,
  User,
  Phone,
  Tag,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { OrdemServico, OSStatus, OSPrioridade, SUGESTOES_AMBIENTES_CV, SUGESTOES_TAGS_CV } from '../../types';

interface ProjectEditModalProps {
  order: OrdemServico;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<OrdemServico>) => void;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
}) => {
  const [nomeProjeto, setNomeProjeto] = useState(order.nome_projeto);
  const [cliente, setCliente] = useState(order.cliente);
  const [telefone, setTelefone] = useState(order.telefone_cliente || '');
  const [status, setStatus] = useState<OSStatus>(order.status);
  const [prioridade, setPrioridade] = useState<OSPrioridade>(order.prioridade);
  const [previsaoEntrega, setPrevisaoEntrega] = useState(order.previsao_entrega);
  const [ambientes, setAmbientes] = useState<string[]>(order.ambientes || []);
  const [tags, setTags] = useState<string[]>(order.tags || []);
  const [observacoes, setObservacoes] = useState(order.observacoes || '');
  const [customAmbiente, setCustomAmbiente] = useState('');

  if (!isOpen) return null;

  const toggleAmbiente = (amb: string) => {
    if (ambientes.includes(amb)) {
      setAmbientes(ambientes.filter((a) => a !== amb));
    } else {
      setAmbientes([...ambientes, amb]);
    }
  };

  const addCustomAmbiente = () => {
    if (customAmbiente.trim() && !ambientes.includes(customAmbiente.trim())) {
      setAmbientes([...ambientes, customAmbiente.trim()]);
      setCustomAmbiente('');
    }
  };

  const toggleTag = (t: string) => {
    if (tags.includes(t)) {
      setTags(tags.filter((tag) => tag !== t));
    } else {
      setTags([...tags, t]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nome_projeto: nomeProjeto.trim(),
      cliente: cliente.trim(),
      telefone_cliente: telefone.trim() || undefined,
      status,
      prioridade,
      previsao_entrega: previsaoEntrega,
      ambientes,
      tags,
      observacoes: observacoes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Editar Dados do Projeto
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono-code">
                {order.numero_os}
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
          {/* Nome do Projeto */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome do Projeto / Obra *
            </label>
            <input
              type="text"
              required
              value={nomeProjeto}
              onChange={(e) => setNomeProjeto(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Cliente e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Cliente *
              </label>
              <input
                type="text"
                required
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status e Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Status Atual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OSStatus)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="medicao_visita">Medição & Visita</option>
                <option value="layout_aprovado">Layout Aprovado</option>
                <option value="corte_pendente">Corte CNC & Arquivos</option>
                <option value="separacao_pendente">Separação de Materiais</option>
                <option value="em_producao">Em Produção</option>
                <option value="pronto_entrega">Pronto / Instalação</option>
                <option value="entregue">Concluído / Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as OSPrioridade)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Previsão de Entrega */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Previsão de Entrega
            </label>
            <input
              type="date"
              required
              value={previsaoEntrega}
              onChange={(e) => setPrevisaoEntrega(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>

          {/* Ambientes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Ambientes da Obra
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
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
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customAmbiente}
                onChange={(e) => setCustomAmbiente(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAmbiente();
                  }
                }}
                placeholder="Adicionar ambiente personalizado..."
                className="flex-1 px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
              />
              <button
                type="button"
                onClick={addCustomAmbiente}
                className="px-2.5 py-1 text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-800 dark:text-zinc-200 rounded-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Etiquetas
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

          {/* Briefing */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Briefing / Observações
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>

          {/* Rodapé */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
