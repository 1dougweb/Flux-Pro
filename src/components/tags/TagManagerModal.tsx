import React, { useState, useMemo } from 'react';
import { X, Check, Plus, Tag as TagIcon, Pencil, Trash2 } from 'lucide-react';
import {
  TagColor,
  TAG_COLORS,
  TAG_COLORS_CONFIG,
  DEFAULT_TRELLO_TAGS,
  formatTag,
  parseTag,
  areTagsEqual,
} from '../../lib/tags';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  allExistingTags?: string[];
  projectTitle?: string;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  selectedTags = [],
  onToggleTag,
  allExistingTags = [],
  projectTitle,
}) => {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);

  // Formulário de Criação/Edição
  const [inputName, setInputName] = useState('');
  const [selectedColor, setSelectedColor] = useState<TagColor>('red');

  // Lista consolidada de todas as etiquetas conhecidas
  const availableTagsList = useMemo(() => {
    const list: Array<{ name: string; color: TagColor; raw: string }> = [];
    const seenNames = new Set<string>();

    const addTag = (rawTag: string) => {
      const parsed = parseTag(rawTag);
      const key = `${parsed.name.toLowerCase()}::${parsed.color}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        list.push(parsed);
      }
    };

    // 1. Tags já selecionadas nesta OS
    selectedTags.forEach(addTag);

    // 2. Tags existentes em outros projetos
    allExistingTags.forEach(addTag);

    // 3. Sugestões padrão do FLUXPRO
    DEFAULT_TRELLO_TAGS.forEach((def) => {
      addTag(formatTag(def.name, def.color));
    });

    return list;
  }, [selectedTags, allExistingTags]);

  // Filtro de busca
  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableTagsList;
    return availableTagsList.filter((t) => t.name.toLowerCase().includes(q));
  }, [availableTagsList, search]);

  if (!isOpen) return null;

  const isTagApplied = (rawCandidate: string) => {
    return selectedTags.some((st) => areTagsEqual(st, rawCandidate));
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingTag(null);
    setInputName(search.trim());
    setSelectedColor('blue');
  };

  const handleStartEdit = (tagRaw: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const parsed = parseTag(tagRaw);
    setEditingTag(tagRaw);
    setIsCreating(false);
    setInputName(parsed.name);
    setSelectedColor(parsed.color);
  };

  const handleSaveCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = formatTag(inputName, selectedColor);

    if (editingTag) {
      // Se estava editando e estava selecionada, desmarca a antiga e marca a nova
      if (isTagApplied(editingTag)) {
        onToggleTag(editingTag);
        onToggleTag(formatted);
      }
    } else {
      // Criação nova: já aplica à OS se ainda não estiver
      if (!isTagApplied(formatted)) {
        onToggleTag(formatted);
      }
    }

    setIsCreating(false);
    setEditingTag(null);
    setInputName('');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-3 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal no Estilo Trello */}
        <div className="p-3.5 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-neutral-500" />
            <h3 className="text-xs font-bold text-light-text dark:text-dark-text uppercase tracking-wider">
              {editingTag
                ? 'Editar Etiqueta'
                : isCreating
                ? 'Criar Nova Etiqueta'
                : 'Etiquetas do Projeto'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtítulo com Nome do Projeto */}
        {projectTitle && !isCreating && !editingTag && (
          <div className="px-3.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border-b border-light-border dark:border-dark-border text-[11px] text-light-muted dark:text-dark-muted truncate">
            Obra: <strong className="text-light-text dark:text-dark-text">{projectTitle}</strong>
          </div>
        )}

        {/* MODO 1: Lista e Seleção de Etiquetas */}
        {!isCreating && !editingTag ? (
          <div className="p-3.5 space-y-3">
            {/* Input de Busca */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar etiquetas..."
              className="w-full px-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />

            {/* Lista de Etiquetas Disponíveis */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredTags.length === 0 ? (
                <div className="text-center py-4 text-xs text-neutral-400">
                  Nenhuma etiqueta encontrada para "{search}".
                </div>
              ) : (
                filteredTags.map((tagItem) => {
                  const rawFormatted = formatTag(tagItem.name, tagItem.color);
                  const isChecked = isTagApplied(rawFormatted) || isTagApplied(tagItem.raw);
                  const colorCfg = TAG_COLORS_CONFIG[tagItem.color];

                  return (
                    <div
                      key={`${tagItem.name}::${tagItem.color}`}
                      onClick={() => onToggleTag(rawFormatted)}
                      className="group flex items-center gap-2 cursor-pointer select-none"
                    >
                      {/* Checkbox de Ativação */}
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                            : 'border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Bloco Colorido da Etiqueta no Estilo Trello */}
                      <div
                        className={`flex-1 flex items-center justify-between px-3 py-1.5 rounded transition-transform group-hover:scale-[1.01] ${colorCfg.bgClass} ${colorCfg.textClass} shadow-sm`}
                      >
                        <span className="text-xs font-bold truncate">
                          {tagItem.name || `(${colorCfg.label})`}
                        </span>

                        {/* Botão de Edição */}
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(rawFormatted, e)}
                          title="Editar cor ou nome desta etiqueta"
                          className="opacity-60 group-hover:opacity-100 hover:scale-110 p-0.5 transition-all text-white"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Botão para Criar Nova Etiqueta */}
            <button
              type="button"
              onClick={handleStartCreate}
              className="w-full py-2 px-3 text-xs font-semibold rounded border border-dashed border-light-border dark:border-dark-border hover:border-black dark:hover:border-white bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar nova etiqueta</span>
            </button>
          </div>
        ) : (
          /* MODO 2: Criação / Edição de Etiqueta */
          <form onSubmit={handleSaveCustomTag} className="p-3.5 space-y-3.5">
            {/* Pré-visualização da Etiqueta */}
            <div>
              <label className="block text-[11px] font-semibold text-light-muted dark:text-dark-muted mb-1.5">
                Pré-visualização
              </label>
              <div
                className={`w-full py-2 px-3 rounded flex items-center justify-center font-bold text-xs shadow-sm ${
                  TAG_COLORS_CONFIG[selectedColor].bgClass
                } ${TAG_COLORS_CONFIG[selectedColor].textClass}`}
              >
                {inputName.trim() || `(${TAG_COLORS_CONFIG[selectedColor].label})`}
              </div>
            </div>

            {/* Input do Título */}
            <div>
              <label className="block text-[11px] font-semibold text-light-text dark:text-dark-text mb-1">
                Título da Etiqueta (opcional)
              </label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Ex: Urgente, Router CNC, Letra Caixa"
                className="w-full px-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                autoFocus
              />
            </div>

            {/* Paleta de Cores do Trello */}
            <div>
              <label className="block text-[11px] font-semibold text-light-text dark:text-dark-text mb-1.5">
                Selecione uma Cor
              </label>
              <div className="grid grid-cols-5 gap-2">
                {TAG_COLORS.map((col) => {
                  const cfg = TAG_COLORS_CONFIG[col];
                  const isSelected = selectedColor === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      title={cfg.label}
                      className={`h-8 rounded flex items-center justify-center transition-all ${
                        cfg.bgClass
                      } ${
                        isSelected
                          ? 'ring-2 ring-black dark:ring-white ring-offset-2 scale-105'
                          : 'hover:opacity-90 active:scale-95'
                      }`}
                    >
                      {isSelected && (
                        <Check
                          className={`w-4 h-4 stroke-[3] ${
                            col === 'yellow' || col === 'lime' ? 'text-black' : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ações Salvar / Voltar */}
            <div className="flex items-center justify-between pt-2 border-t border-light-border dark:border-dark-border gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingTag(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-light-border dark:border-dark-border hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                Voltar
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity shadow-sm"
              >
                {editingTag ? 'Salvar Alterações' : 'Criar e Aplicar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
