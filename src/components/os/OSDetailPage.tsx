import React, { useState, useMemo } from 'react';
import {
  OrdemServico,
  PlanoCorte,
  ItemMaterial,
  ItemPlanta,
  CategoriaMaterial,
  StatusCorte,
  StatusSeparacao,
  OSStatus,
} from '../../types';
import {
  OSStatusBadge,
  OSPrioridadeBadge,
  StatusCorteBadge,
  StatusSeparacaoBadge,
  TagBadge,
  AmbienteBadge,
} from '../common/Badge';
import { DeliveryCountdown } from '../common/DeliveryCountdown';
import { MaterialProgressBar } from '../materials/MaterialProgressBar';
import { ItemPlantaTable } from '../planta/ItemPlantaTable';
import { OSEditModal } from './OSEditModal';
import { TagManagerModal } from '../tags/TagManagerModal';
import { areTagsEqual } from '../../lib/tags';
import {
  ArrowLeft,
  Pencil,
  Scissors,
  Package,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckSquare,
  Square,
  X,
  Phone,
  User,
  Calendar,
  Tag as TagIcon,
  Filter,
  LayoutGrid,
  List,
  Box,
} from 'lucide-react';

interface OSDetailPageProps {
  order: OrdemServico;
  onBack: () => void;
  onUpdateCutPlan: (osId: string, partial: Partial<PlanoCorte>) => Promise<void>;
  onAddItemPlanta: (
    osId: string,
    item: Omit<ItemPlanta, 'id' | 'os_id' | 'created_at'>
  ) => Promise<void>;
  onUpdateItemPlanta: (
    osId: string,
    itemId: string,
    partial: Partial<ItemPlanta>
  ) => Promise<void>;
  onRemoveItemPlanta: (osId: string, itemId: string) => Promise<void>;
  onCycleItemPlantaStatus: (osId: string, itemId: string) => Promise<void>;
  onAddMaterial: (
    osId: string,
    material: Omit<ItemMaterial, 'id' | 'os_id' | 'created_at'>
  ) => Promise<void>;
  onUpdateMaterial: (
    osId: string,
    matId: string,
    partial: Partial<ItemMaterial>
  ) => Promise<void>;
  onRemoveMaterial: (osId: string, matId: string) => Promise<void>;
  onCycleMaterialStatus: (osId: string, matId: string) => Promise<void>;
  onChangeStatus: (osId: string, newStatus: OSStatus) => Promise<void>;
  onUpdateOrder: (updated: OrdemServico) => Promise<void>;
  allTags?: string[];
  onToggleTag?: (osId: string, tag: string) => Promise<void>;
}

export const OSDetailPage: React.FC<OSDetailPageProps> = ({
  order,
  onBack,
  onUpdateCutPlan,
  onAddItemPlanta,
  onUpdateItemPlanta,
  onRemoveItemPlanta,
  onCycleItemPlantaStatus,
  onAddMaterial,
  onUpdateMaterial,
  onRemoveMaterial,
  onCycleMaterialStatus,
  onChangeStatus,
  onUpdateOrder,
  allTags = [],
  onToggleTag,
}) => {
  const [activeTab, setActiveTab] = useState<'itens' | 'corte' | 'materiais' | 'historico'>('itens');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Filtro interno de Ambientes desta Obra (Multi-select simultâneo)
  const [selectedAmbientes, setSelectedAmbientes] = useState<string[]>([]);
  const [quickAmbienteInput, setQuickAmbienteInput] = useState('');
  const [showAddAmbienteInput, setShowAddAmbienteInput] = useState(false);

  // Lista unificada de ambientes desta OS
  const orderAmbientesList = useMemo(() => {
    const set = new Set<string>();
    if (order.ambientes && Array.isArray(order.ambientes)) {
      order.ambientes.forEach((a) => {
        if (a && a.trim()) set.add(a.trim());
      });
    }
    if (order.ambiente) {
      order.ambiente.split(/[,;/+]+/).map((s) => s.trim()).filter(Boolean).forEach((a) => set.add(a));
    }
    (order.itens_planta || []).forEach((it) => {
      if (it.ambiente && it.ambiente.trim()) set.add(it.ambiente.trim());
    });
    return Array.from(set);
  }, [order.ambientes, order.ambiente, order.itens_planta]);

  // Contagem de peças por ambiente nesta OS
  const ambienteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const amb of orderAmbientesList) {
      counts[amb] = 0;
    }
    for (const item of order.itens_planta || []) {
      if (item.ambiente) {
        counts[item.ambiente] = (counts[item.ambiente] || 0) + 1;
      }
    }
    return counts;
  }, [orderAmbientesList, order.itens_planta]);

  // Itens da obra filtrados pelos ambientes selecionados no sidebar interno
  const filteredItens = useMemo(() => {
    const itens = order.itens_planta || [];
    if (selectedAmbientes.length === 0) return itens;
    return itens.filter((it) => selectedAmbientes.includes(it.ambiente));
  }, [order.itens_planta, selectedAmbientes]);

  const toggleAmbienteFilter = (amb: string) => {
    setSelectedAmbientes((prev) => {
      if (prev.includes(amb)) {
        return prev.filter((a) => a !== amb);
      } else {
        return [...prev, amb];
      }
    });
  };

  const selectSingleAmbiente = (amb: string) => {
    setSelectedAmbientes((prev) => {
      if (prev.length === 1 && prev[0] === amb) {
        return [];
      }
      return [amb];
    });
  };

  const handleQuickAddAmbiente = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickAmbienteInput.trim();
    if (!clean) return;

    if (!orderAmbientesList.includes(clean)) {
      const nextAmbientes = [...orderAmbientesList, clean];
      await onUpdateOrder({
        ...order,
        ambientes: nextAmbientes,
        ambiente: nextAmbientes.join(', '),
      });
    }
    setQuickAmbienteInput('');
    setShowAddAmbienteInput(false);
  };

  // Estado local para o formulário de Plano de Corte
  const cutPlan = order.plano_corte || {
    id: `pc-${order.id}`,
    os_id: order.id,
    status_corte: 'nao_iniciado',
    software_origem: 'ArtCAM',
    maquina_principal: 'Router CNC',
    arquivo_ou_link: '',
    total_chapas: 0,
    especificacao_chapas: '',
    metros_vinil_lona: 0,
    gabarito_pronto: false,
    aprovado_producao: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const [softwareOrigem, setSoftwareOrigem] = useState(cutPlan.software_origem || 'ArtCAM');
  const [maquinaPrincipal, setMaquinaPrincipal] = useState(cutPlan.maquina_principal || 'Router CNC');
  const [statusCorte, setStatusCorte] = useState<StatusCorte>(cutPlan.status_corte || 'nao_iniciado');
  const [arquivoLink, setArquivoLink] = useState(cutPlan.arquivo_ou_link || '');
  const [totalChapas, setTotalChapas] = useState(cutPlan.total_chapas || 0);
  const [especificacaoChapas, setEspecificacaoChapas] = useState(cutPlan.especificacao_chapas || '');
  const [metrosVinil, setMetrosVinil] = useState(cutPlan.metros_vinil_lona || 0);
  const [gabaritoPronto, setGabaritoPronto] = useState(cutPlan.gabarito_pronto || false);
  const [obsCorte, setObsCorte] = useState(cutPlan.observacoes || '');
  const [isSavingCut, setIsSavingCut] = useState(false);

  // Estado para adicionar novo material
  const [showAddMat, setShowAddMat] = useState(false);
  const [newMatDesc, setNewMatDesc] = useState('');
  const [newMatCat, setNewMatCat] = useState<CategoriaMaterial>('chapa');
  const [newMatQtd, setNewMatQtd] = useState(1);
  const [newMatUn, setNewMatUn] = useState('un');
  const [newMatLoc, setNewMatLoc] = useState('');
  const [newMatItemPlantaId, setNewMatItemPlantaId] = useState<string>('');
  const [materialFilterItem, setMaterialFilterItem] = useState<string>('todos');
  const [materialViewMode, setMaterialViewMode] = useState<'grouped' | 'list'>('grouped');

  const handleOpenAddForPiece = (itemId?: string) => {
    setNewMatItemPlantaId(itemId || '');
    setShowAddMat(true);
  };

  // Salvar alterações do Plano de Corte
  const handleSaveCutPlan = async (aprovar = false) => {
    setIsSavingCut(true);
    try {
      await onUpdateCutPlan(order.id, {
        software_origem: softwareOrigem,
        maquina_principal: maquinaPrincipal,
        status_corte: aprovar ? 'enviado_producao' : statusCorte,
        arquivo_ou_link: arquivoLink,
        total_chapas: Number(totalChapas),
        especificacao_chapas: especificacaoChapas,
        metros_vinil_lona: Number(metrosVinil),
        gabarito_pronto: gabaritoPronto,
        observacoes: obsCorte,
        aprovado_producao: aprovar ? true : cutPlan.aprovado_producao,
        data_conferencia: aprovar ? new Date().toISOString() : cutPlan.data_conferencia,
      });

      if (aprovar && order.status === 'corte_pendente') {
        await onChangeStatus(order.id, 'separacao_pendente');
      }
    } finally {
      setIsSavingCut(false);
    }
  };

  const handleRevokeApproval = async () => {
    if (confirm('Deseja reabrir o plano de corte para alterações?')) {
      await onUpdateCutPlan(order.id, {
        aprovado_producao: false,
        status_corte: 'em_otimizacao',
      });
    }
  };

  const handleAddNewMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatDesc.trim()) return;

    await onAddMaterial(order.id, {
      descricao: newMatDesc.trim(),
      categoria: newMatCat,
      quantidade: Number(newMatQtd),
      unidade: newMatUn.trim() || 'un',
      status_separacao: 'pendente',
      localizacao_estoque: newMatLoc.trim() || undefined,
      item_planta_id: newMatItemPlantaId.trim() || undefined,
    });

    setNewMatDesc('');
    setNewMatQtd(1);
    setNewMatLoc('');
    setNewMatItemPlantaId('');
    setShowAddMat(false);
  };

  const handleInsertStandardKit = async () => {
    const defaultKit: Array<Omit<ItemMaterial, 'id' | 'os_id' | 'created_at'>> = [
      {
        categoria: 'iluminacao',
        descricao: 'Módulo LED Injetado 12V 1.5W Branco Frio 6500K IP68 (Lente 160°)',
        quantidade: 120,
        unidade: 'módulo',
        status_separacao: 'pendente',
        localizacao_estoque: 'Gaveteiro Elétrica E-03',
      },
      {
        categoria: 'iluminacao',
        descricao: 'Fonte Chaveada Slim Bivolt 12V 20A / 240W',
        quantidade: 2,
        unidade: 'un',
        status_separacao: 'pendente',
        localizacao_estoque: 'Prateleira Fontes',
      },
      {
        categoria: 'fixacao_quimica',
        descricao: 'Selante Estrutural PU 40 Cinza (Tubo 400g)',
        quantidade: 4,
        unidade: 'tubo',
        status_separacao: 'pendente',
        localizacao_estoque: 'Armário Químicos Q-01',
      },
      {
        categoria: 'fixacao_quimica',
        descricao: 'Fita Dupla Face Estrutural VHB 3M 19mm x 20m',
        quantidade: 2,
        unidade: 'rolo',
        status_separacao: 'pendente',
        localizacao_estoque: 'Gaveta Fitas Especiais',
      },
    ];

    for (const mat of defaultKit) {
      await onAddMaterial(order.id, mat);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Barra de Navegação e Topo da Obra */}
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 sm:p-5 shadow-sm">
        
        {/* Linha 1: Voltar + Breadcrumb + Ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors shadow-sm"
              title="Voltar para a lista e kanban de obras"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Obras</span>
            </button>

            <span className="text-neutral-400 dark:text-neutral-600 text-xs">•</span>
            <span className="font-mono-code font-bold text-xs text-light-muted dark:text-dark-muted">
              OS: {order.numero_os}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Edição das Informações da Obra (LÁPIS) */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-xs font-semibold transition-all shadow-sm"
              title="Editar informações da obra (cliente, prazos, ambientação, status)"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Dados da Obra</span>
            </button>
          </div>
        </div>

        {/* Linha 2: Informações Principais da Obra */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-code font-bold text-sm tracking-tight px-2 py-0.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text">
                {order.numero_os}
              </span>
              <OSStatusBadge status={order.status} />
              <OSPrioridadeBadge prioridade={order.prioridade} />
              
              <DeliveryCountdown
                dateStr={order.previsao_entrega}
                isDelivered={order.status === 'entregue'}
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-light-text dark:text-dark-text tracking-tight">
              {order.nome_projeto}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-light-muted dark:text-dark-muted">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                Cliente: <strong className="text-light-text dark:text-dark-text">{order.cliente}</strong>
              </span>

              {order.telefone_cliente && (
                <span className="flex items-center gap-1 font-mono-code">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  {order.telefone_cliente}
                </span>
              )}

              {order.valor_total !== undefined && order.valor_total > 0 && (
                <span className="font-mono-code font-semibold text-neutral-800 dark:text-neutral-200">
                  Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.valor_total)}
                </span>
              )}
            </div>

            {/* Tags da OS no Estilo Trello com Cores Vivas */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              {order.tags &&
                order.tags.map((t) => (
                  <TagBadge key={t} tag={t} size="sm" />
                ))}

              {/* Botão de Adicionar/Gerenciar Etiquetas no Projeto */}
              <button
                type="button"
                onClick={() => setIsTagModalOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border border-dashed border-light-border dark:border-dark-border hover:border-black dark:hover:border-white text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface transition-colors"
                title="Adicionar ou alterar etiquetas coloridas nesta obra"
              >
                <TagIcon className="w-3 h-3 text-neutral-500" />
                <span>+ Etiqueta</span>
              </button>
            </div>
          </div>

          {/* Resumo Rápido de Corte e Separação */}
          <div className="flex items-center gap-3 lg:shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-light-border dark:border-dark-border">
            <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface min-w-[140px]">
              <div className="text-[10px] text-light-muted dark:text-dark-muted mb-1 flex items-center gap-1">
                <Scissors className="w-3 h-3 text-neutral-500" />
                <span>Plano de Corte</span>
              </div>
              <StatusCorteBadge
                status={order.plano_corte?.status_corte || 'nao_iniciado'}
                aprovado={Boolean(order.plano_corte?.aprovado_producao)}
              />
            </div>

            <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface min-w-[150px]">
              <div className="text-[10px] text-light-muted dark:text-dark-muted mb-1 flex items-center gap-1">
                <Package className="w-3 h-3 text-neutral-500" />
                <span>Separação</span>
              </div>
              <MaterialProgressBar materiais={order.materiais} compact />
            </div>
          </div>
        </div>

        {/* Abas de Navegação da Obra */}
        <div className="flex items-center gap-1 mt-5 pt-3 border-t border-light-border dark:border-dark-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('itens')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              activeTab === 'itens'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Itens da Obra ({(order.itens_planta || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('corte')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              activeTab === 'corte'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Plano de Corte CNC</span>
            {cutPlan.aprovado_producao ? (
              <span className="w-2 h-2 rounded-full bg-neutral-100 dark:bg-neutral-900" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('materiais')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              activeTab === 'materiais'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Materiais & Estoque ({(order.materiais || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              activeTab === 'historico'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Histórico ({order.historico?.length || 0})</span>
          </button>
        </div>

      </div>

      {/* Corpo da Obra: Com Sidebar de Ambientes INTERNO da Obra */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ======================================================== */}
        {/* SIDEBAR DE AMBIENTES INTERNO DA OBRA                      */}
        {/* ======================================================== */}
        <aside className="w-full lg:w-64 shrink-0 space-y-3">
          <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-3 shadow-sm">
            
            <div className="px-1 pb-2 mb-2 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <p className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold">
                  Ambientes da Obra
                </p>
              </div>

              {selectedAmbientes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedAmbientes([])}
                  className="inline-flex items-center gap-1 text-[10px] text-neutral-500 hover:text-black dark:hover:text-white underline underline-offset-2"
                  title="Mostrar todos os itens desta obra"
                >
                  <X className="w-3 h-3" />
                  <span>Todos</span>
                </button>
              )}
            </div>

            {/* Botão Todos os Ambientes desta Obra */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setSelectedAmbientes([])}
                className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
                  selectedAmbientes.length === 0
                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-light-surface dark:hover:bg-dark-surface'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>Todas as Peças</span>
                </div>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code border ${
                    selectedAmbientes.length === 0
                      ? 'border-white/30 text-white dark:border-black/30 dark:text-black'
                      : 'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                  }`}
                >
                  {(order.itens_planta || []).length}
                </span>
              </button>
            </div>

            {/* Lista dos Ambientes Cadastrados nesta Obra */}
            {orderAmbientesList.length === 0 ? (
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 px-2 py-2 italic">
                Nenhum ambiente cadastrado nesta obra. Use o botão abaixo ou edite no lápis.
              </p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {orderAmbientesList.map((amb) => {
                  const isSelected = selectedAmbientes.includes(amb);
                  const count = ambienteCounts[amb] || 0;

                  return (
                    <div
                      key={amb}
                      className={`group flex items-center justify-between gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${
                        isSelected
                          ? 'bg-neutral-200/80 dark:bg-neutral-800/80 font-medium text-black dark:text-white'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-light-surface dark:hover:bg-dark-surface'
                      }`}
                    >
                      {/* Checkbox para seleção simultânea */}
                      <button
                        type="button"
                        onClick={() => toggleAmbienteFilter(amb)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                        title={`Filtrar peças em ${amb}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 shrink-0 text-black dark:text-white" />
                        ) : (
                          <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400 dark:text-neutral-600" />
                        )}
                        <span className="truncate">{amb}</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Botão de seleção Única */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectSingleAmbiente(amb);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all font-mono-code"
                          title={`Filtrar apenas as peças de "${amb}"`}
                        >
                          Único
                        </button>

                        {/* Contagem de peças */}
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code border ${
                            isSelected
                              ? 'border-neutral-400 bg-black text-white dark:bg-white dark:text-black'
                              : 'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Adicionar Ambiente Rápido nesta Obra */}
            <div className="mt-3 pt-2.5 border-t border-light-border dark:border-dark-border">
              {showAddAmbienteInput ? (
                <form onSubmit={handleQuickAddAmbiente} className="space-y-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={quickAmbienteInput}
                    onChange={(e) => setQuickAmbienteInput(e.target.value)}
                    placeholder="Nome do ambiente..."
                    className="w-full px-2 py-1 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAmbienteInput(false);
                        setQuickAmbienteInput('');
                      }}
                      className="px-2 py-0.5 rounded text-neutral-500 hover:text-black dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black font-semibold"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddAmbienteInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded border border-dashed border-light-border dark:border-dark-border hover:border-black dark:hover:border-white text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Ambiente na Obra</span>
                </button>
              )}
            </div>

          </div>
        </aside>

        {/* ======================================================== */}
        {/* ÁREA PRINCIPAL DA OBRA (ABAS FLUÍDAS)                     */}
        {/* ======================================================== */}
        <div className="flex-1 min-w-0 w-full space-y-6">

          {/* ABA 1: ITENS DA PLANTA / PEÇAS DA OBRA */}
          {activeTab === 'itens' && (
            <div className="space-y-4">
              
              {/* Banner Resumo dos Itens e Arquivos de Corte */}
              <div className="p-3.5 rounded-lg border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text">
                    <Layers className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-light-text dark:text-dark-text">
                      Peças da Obra ({filteredItens.length} de {(order.itens_planta || []).length}{' '}
                      {filteredItens.length === 1 ? 'peça' : 'peças'} exibidas)
                    </h3>
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">
                      {selectedAmbientes.length > 0
                        ? `Filtrando por: ${selectedAmbientes.join(', ')}`
                        : 'Visualizando todos os ambientes desta obra'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono-code">
                  {(order.itens_planta || []).filter((it) => !it.arquivo_corte_url && !it.arquivo_corte_nome).length > 0 ? (
                    <span className="px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {(order.itens_planta || []).filter((it) => !it.arquivo_corte_url && !it.arquivo_corte_nome).length} sem arquivo de corte
                    </span>
                  ) : (order.itens_planta || []).length > 0 ? (
                    <span className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-light-surface dark:bg-dark-surface text-neutral-700 dark:text-neutral-300">
                      Arquivos CNC 100% anexados
                    </span>
                  ) : null}

                  <span className="px-2 py-0.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text font-semibold">
                    {(order.itens_planta || []).filter((it) => it.status_item === 'pronto_instalacao' || it.status_item === 'instalado').length}/{(order.itens_planta || []).length} prontos
                  </span>
                </div>
              </div>

              {/* Tabela de Peças desta OS */}
              <ItemPlantaTable
                osId={order.id}
                itens={filteredItens}
                materiais={order.materiais}
                onNavigateToMateriais={(itemId) => {
                  if (itemId) {
                    setMaterialFilterItem(itemId);
                  } else {
                    setMaterialFilterItem('todos');
                  }
                  setActiveTab('materiais');
                }}
                osAmbientes={orderAmbientesList}
                onAddItem={onAddItemPlanta}
                onUpdateItem={onUpdateItemPlanta}
                onRemoveItem={onRemoveItemPlanta}
                onCycleStatus={onCycleItemPlantaStatus}
              />
            </div>
          )}

          {/* ABA 2: PLANO DE CORTE CNC */}
          {activeTab === 'corte' && (
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-5 space-y-6 shadow-sm">
              
              {/* Banner de Validação */}
              <div
                className={`p-4 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  cutPlan.aprovado_producao
                    ? 'border-neutral-300 bg-neutral-100 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                    : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded border border-current/20 bg-current/10">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <span>Plano de Otimização e Corte CNC</span>
                      <StatusCorteBadge status={cutPlan.status_corte} aprovado={cutPlan.aprovado_producao} />
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {cutPlan.aprovado_producao
                        ? `Arquivos aprovados e liberados para corte na máquina (${cutPlan.maquina_principal || 'Router CNC'}).`
                        : 'Atenção: A produção NÃO deve iniciar o corte sem a liberação formal do projetista.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {cutPlan.aprovado_producao ? (
                    <button
                      type="button"
                      onClick={handleRevokeApproval}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-neutral-400 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reabrir Nesting</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSaveCutPlan(true)}
                      disabled={isSavingCut}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Liberar para Corte</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Formulário do Plano de Corte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                    Software de Otimização / CAM
                  </label>
                  <select
                    value={softwareOrigem}
                    onChange={(e) => setSoftwareOrigem(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                  >
                    <option value="ArtCAM">ArtCAM (Usinagem 2D/3D e Perfil ACM)</option>
                    <option value="Aspire / Vectric">Aspire / Vectric (Router CNC)</option>
                    <option value="CorelDraw">CorelDraw (Vetores Laser e Plotter)</option>
                    <option value="AutoCAD">AutoCAD (Estruturas e Gabaritos)</option>
                    <option value="LightBurn">LightBurn (Corte Laser Fibra/CO2)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                    Máquina Principal de Corte
                  </label>
                  <select
                    value={maquinaPrincipal}
                    onChange={(e) => setMaquinaPrincipal(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                  >
                    <option value="Router CNC">Router CNC (Chapas de ACM, PVC e Acrílico)</option>
                    <option value="Laser CO2 / Fibra">Laser CO2 / Fibra (Acrílico e Inox)</option>
                    <option value="Plotter de Recorte">Plotter de Recorte (Vinil Adesivo)</option>
                    <option value="Impressora Mesa Plana">Impressora Mesa Plana / UV</option>
                    <option value="Serralheria / Manual">Serralheria / Corte Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                    Total de Chapas de ACM / Acrílico
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalChapas}
                    onChange={(e) => setTotalChapas(Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                    Metragem Linear de Vinil / Lona (m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={metrosVinil}
                    onChange={(e) => setMetrosVinil(Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                    Especificação Detalhada das Chapas no Nesting
                  </label>
                  <input
                    type="text"
                    value={especificacaoChapas}
                    onChange={(e) => setEspecificacaoChapas(e.target.value)}
                    placeholder="Ex: 6x ACM Azul Brilhante 3mm 5.00x1.22m (rebaixo em V 90°) | 2x Acrílico Branco 3mm"
                    className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                    Link do Arquivo de Otimização (.CRV, .ART, .DXF ou Pasta de Rede)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={arquivoLink}
                      onChange={(e) => setArquivoLink(e.target.value)}
                      placeholder="http://rede-cnc/cortes/os-001.dxf ou caminho da pasta do ArtCAM"
                      className="flex-1 px-3 py-2 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                    />
                    {arquivoLink && (
                      <a
                        href={arquivoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                    <input
                      type="checkbox"
                      checked={gabaritoPronto}
                      onChange={(e) => setGabaritoPronto(e.target.checked)}
                      className="rounded border-light-border dark:border-dark-border text-black dark:text-white focus:ring-0 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block text-light-text dark:text-dark-text">
                        Gabarito 1:1 Impresso e Separado
                      </span>
                      <span className="text-[11px] text-light-muted dark:text-dark-muted">
                        Gabarito em lona/papel kraft com furações para a equipe de instalação
                      </span>
                    </div>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1 text-light-text dark:text-dark-text">
                    Observações de Usinagem / Fresa / Sentido de Pintura
                  </label>
                  <textarea
                    rows={3}
                    value={obsCorte}
                    onChange={(e) => setObsCorte(e.target.value)}
                    placeholder="Instruções para o operador da Router CNC (sentido das setas do ACM, fresa V-bit 90 graus, folgas de dobra...)"
                    className="w-full px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => handleSaveCutPlan(false)}
                  disabled={isSavingCut}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-xs font-semibold shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingCut ? 'Salvando...' : 'Salvar Alterações do Corte'}</span>
                </button>
              </div>

            </div>
          )}

          {/* ABA 3: SEPARAÇÃO DE MATERIAIS */}
          {activeTab === 'materiais' && (
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-5 space-y-6 shadow-sm">
              
              {/* Cabeçalho da Aba de Materiais com Controles */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-light-border dark:border-dark-border">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-neutral-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-light-text dark:text-dark-text">
                      Separação de Chapas, LEDs e Insumos por Item da OS
                    </h3>
                  </div>
                  <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5">
                    Destine cada insumo a uma peça específica da obra ou mantenha como material geral
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Modo de Visualização: Agrupado vs Lista */}
                  <div className="inline-flex rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-0.5">
                    <button
                      type="button"
                      onClick={() => setMaterialViewMode('grouped')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                        materialViewMode === 'grouped'
                          ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                      }`}
                      title="Visualizar materiais agrupados por peça da obra"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Por Peça</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialViewMode('list')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                        materialViewMode === 'list'
                          ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                      }`}
                      title="Visualizar tabela corrida com todos os materiais"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Tabela Geral</span>
                    </button>
                  </div>

                  {/* Filtro por Item da Obra */}
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-neutral-400" />
                    <select
                      value={materialFilterItem}
                      onChange={(e) => setMaterialFilterItem(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none max-w-[200px] truncate"
                      title="Filtrar por peça da obra"
                    >
                      <option value="todos">Todas as Peças & Geral</option>
                      <option value="geral">Geral da Obra (sem peça)</option>
                      {(order.itens_planta || []).map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.codigo} - {it.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ações */}
                  <button
                    type="button"
                    onClick={handleInsertStandardKit}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold text-light-text dark:text-dark-text transition-colors"
                    title="Adicionar kit padrão de LEDs, fontes 12V, PU40 e fita VHB"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Kit CV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewMatItemPlantaId(materialFilterItem !== 'todos' && materialFilterItem !== 'geral' ? materialFilterItem : '');
                      setShowAddMat(!showAddMat);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Insumo</span>
                  </button>
                </div>
              </div>

              {/* Métricas de Materiais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                  <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">Total de Insumos</span>
                  <div className="text-xl font-bold font-mono-code text-light-text dark:text-dark-text">
                    {(order.materiais || []).length}
                  </div>
                </div>

                <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                  <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">Destinados a Peças</span>
                  <div className="text-xl font-bold font-mono-code text-light-text dark:text-dark-text">
                    {(order.materiais || []).filter((m) => m.item_planta_id && (order.itens_planta || []).some((it) => it.id === m.item_planta_id)).length}
                  </div>
                </div>

                <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                  <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">Gerais da Obra</span>
                  <div className="text-xl font-bold font-mono-code text-light-text dark:text-dark-text">
                    {(order.materiais || []).filter((m) => !m.item_planta_id || !(order.itens_planta || []).some((it) => it.id === m.item_planta_id)).length}
                  </div>
                </div>

                <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                  <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">Separados</span>
                  <div className="text-xl font-bold font-mono-code text-light-text dark:text-dark-text">
                    {(order.materiais || []).filter((m) => m.status_separacao === 'separado').length} / {(order.materiais || []).length}
                  </div>
                </div>
              </div>

              {/* Barra de Progresso Global */}
              <div className="p-3.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                <MaterialProgressBar materiais={order.materiais} />
              </div>

              {/* Form Inline Adicionar Material */}
              {showAddMat && (
                <form
                  onSubmit={handleAddNewMaterial}
                  className="p-4 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-light-border dark:border-dark-border">
                    <span className="text-xs font-bold uppercase tracking-wider text-light-text dark:text-dark-text flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Novo Insumo / Material
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddMat(false)}
                      className="text-neutral-400 hover:text-black dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    {/* Destinado ao Item da OS */}
                    <div className="sm:col-span-2">
                      <label className="block font-medium mb-1 text-light-text dark:text-dark-text">
                        Destinado à Peça / Item da Obra
                      </label>
                      <select
                        value={newMatItemPlantaId}
                        onChange={(e) => setNewMatItemPlantaId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                      >
                        <option value="">Geral da Obra (sem peça específica)</option>
                        {(order.itens_planta || []).map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.codigo} - {it.nome} {it.ambiente ? `(${it.ambiente})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Categoria */}
                    <div className="sm:col-span-2">
                      <label className="block font-medium mb-1 text-light-text dark:text-dark-text">
                        Categoria
                      </label>
                      <select
                        value={newMatCat}
                        onChange={(e) => setNewMatCat(e.target.value as CategoriaMaterial)}
                        className="w-full px-2.5 py-1.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                      >
                        <option value="chapa">Chapas (ACM, Acrílico, PVC)</option>
                        <option value="iluminacao">Iluminação (LED, Fontes 12V)</option>
                        <option value="vinil_lona">Vinil / Lona / Adesivo</option>
                        <option value="estrutura">Estrutura (Metalon, Alumínio)</option>
                        <option value="fixacao_quimica">Fixação (PU 40, VHB, Parafusos)</option>
                        <option value="gabarito">Gabarito 1:1</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>

                    {/* Descrição */}
                    <div className="sm:col-span-2">
                      <label className="block font-medium mb-1 text-light-text dark:text-dark-text">
                        Descrição do Material *
                      </label>
                      <input
                        type="text"
                        required
                        value={newMatDesc}
                        onChange={(e) => setNewMatDesc(e.target.value)}
                        placeholder="Ex: ACM Azul 3mm 5.00x1.22m ou LEDs 12V Branco Frio"
                        className="w-full px-2.5 py-1.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                      />
                    </div>

                    {/* Quantidade / Unidade */}
                    <div>
                      <label className="block font-medium mb-1 text-light-text dark:text-dark-text">
                        Quantidade / Unidade
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          required
                          value={newMatQtd}
                          onChange={(e) => setNewMatQtd(Number(e.target.value))}
                          className="w-2/3 px-2.5 py-1.5 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                        />
                        <input
                          type="text"
                          value={newMatUn}
                          onChange={(e) => setNewMatUn(e.target.value)}
                          placeholder="un, chapa, m"
                          className="w-1/3 px-2 py-1.5 font-mono-code rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Localização Estoque */}
                    <div>
                      <label className="block font-medium mb-1 text-light-text dark:text-dark-text">
                        Localização no Estoque
                      </label>
                      <input
                        type="text"
                        value={newMatLoc}
                        onChange={(e) => setNewMatLoc(e.target.value)}
                        placeholder="Ex: Prateleira B-04"
                        className="w-full px-2.5 py-1.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMat(false)}
                      className="px-3 py-1.5 rounded text-neutral-500 hover:text-black dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-black text-white dark:bg-white dark:text-black font-semibold"
                    >
                      Salvar Insumo
                    </button>
                  </div>
                </form>
              )}

              {/* MODO 1: VISUALIZAÇÃO AGRUPADA POR PEÇA */}
              {materialViewMode === 'grouped' && (
                <div className="space-y-4">
                  
                  {/* Seções de Cada Peça da Obra */}
                  {(order.itens_planta || [])
                    .filter((item) => {
                      if (materialFilterItem === 'todos') return true;
                      if (materialFilterItem === 'geral') return false;
                      return item.id === materialFilterItem;
                    })
                    .map((item) => {
                      const itemMats = (order.materiais || []).filter((m) => m.item_planta_id === item.id);
                      const sepCount = itemMats.filter((m) => m.status_separacao === 'separado').length;
                      const hasDimensions = item.largura_mm || item.altura_mm || item.profundidade_mm;
                      const dimStr = `${item.largura_mm || '-'} x ${item.altura_mm || '-'} x ${item.profundidade_mm || '-'} mm`;

                      return (
                        <div
                          key={item.id}
                          className="border border-light-border dark:border-dark-border rounded-lg bg-light-surface/40 dark:bg-dark-surface/40 overflow-hidden"
                        >
                          {/* Cabeçalho da Peça */}
                          <div className="p-3 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono-code font-bold text-xs px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                                {item.codigo}
                              </span>
                              <span className="font-bold text-xs text-light-text dark:text-dark-text truncate">
                                {item.nome}
                              </span>
                              {item.ambiente && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-muted dark:text-dark-muted">
                                  {item.ambiente}
                                </span>
                              )}
                              {hasDimensions && (
                                <span className="font-mono-code text-[10px] text-light-muted dark:text-dark-muted hidden sm:inline">
                                  {dimStr}
                                </span>
                              )}
                              {item.material_principal && (
                                <span className="text-[10px] text-light-muted dark:text-dark-muted italic hidden md:inline truncate max-w-[150px]">
                                  • {item.material_principal}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono-code text-[11px] px-2 py-0.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text">
                                {sepCount}/{itemMats.length} separados
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenAddForPiece(item.id)}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-medium"
                                title={`Destinar novo insumo especificamente para ${item.codigo}`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Insumo p/ Peça</span>
                              </button>
                            </div>
                          </div>

                          {/* Lista de Insumos da Peça */}
                          {itemMats.length === 0 ? (
                            <div className="p-4 text-center text-xs text-light-muted dark:text-dark-muted border-t border-dashed border-light-border dark:border-dark-border bg-light-card/40 dark:bg-dark-card/40">
                              Nenhum insumo destinado para esta peça ainda.{' '}
                              <button
                                type="button"
                                onClick={() => handleOpenAddForPiece(item.id)}
                                className="text-black dark:text-white underline underline-offset-2 font-medium"
                              >
                                Clique aqui para destinar chapas, LEDs ou fitas.
                              </button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-light-border dark:border-dark-border bg-light-card/60 dark:bg-dark-card/60 font-mono-code text-[10px] text-light-muted dark:text-dark-muted">
                                    <th className="p-2.5">Descrição do Insumo</th>
                                    <th className="p-2.5">Categoria</th>
                                    <th className="p-2.5 text-center">Quantidade</th>
                                    <th className="p-2.5">Estoque</th>
                                    <th className="p-2.5">Status Separação</th>
                                    <th className="p-2.5">Reatribuir Peça</th>
                                    <th className="p-2.5 text-right">Ação</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-light-border dark:divide-dark-border bg-light-card dark:bg-dark-card">
                                  {itemMats.map((mat) => (
                                    <tr key={mat.id} className="hover:bg-light-surface/60 dark:hover:bg-dark-surface/60 transition-colors">
                                      <td className="p-2.5 font-medium text-light-text dark:text-dark-text">
                                        {mat.descricao}
                                      </td>
                                      <td className="p-2.5 text-light-muted dark:text-dark-muted">
                                        <span className="font-mono-code text-[10px] uppercase">
                                          {mat.categoria}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-center font-mono-code">
                                        {mat.quantidade} {mat.unidade}
                                      </td>
                                      <td className="p-2.5 text-light-muted dark:text-dark-muted">
                                        {mat.localizacao_estoque || '-'}
                                      </td>
                                      <td className="p-2.5">
                                        <button
                                          type="button"
                                          onClick={() => onCycleMaterialStatus(order.id, mat.id)}
                                          className="hover:opacity-80 transition-opacity"
                                          title="Clique para alternar o status da separação"
                                        >
                                          <StatusSeparacaoBadge status={mat.status_separacao} />
                                        </button>
                                      </td>
                                      <td className="p-2.5">
                                        <select
                                          value={mat.item_planta_id || ''}
                                          onChange={(e) =>
                                            onUpdateMaterial(order.id, mat.id, {
                                              item_planta_id: e.target.value || undefined,
                                            })
                                          }
                                          className="text-[11px] px-2 py-1 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none max-w-[160px] truncate"
                                          title="Mudar o destino deste insumo"
                                        >
                                          <option value="">Geral da Obra</option>
                                          {(order.itens_planta || []).map((it) => (
                                            <option key={it.id} value={it.id}>
                                              {it.codigo} - {it.nome}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="p-2.5 text-right">
                                        <button
                                          type="button"
                                          onClick={() => onRemoveMaterial(order.id, mat.id)}
                                          className="p-1 rounded text-neutral-400 hover:text-red-600 transition-colors"
                                          title="Remover material"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Seção de Insumos Gerais da Obra */}
                  {(materialFilterItem === 'todos' || materialFilterItem === 'geral') && (
                    <div className="border border-light-border dark:border-dark-border rounded-lg bg-light-surface/40 dark:bg-dark-surface/40 overflow-hidden">
                      <div className="p-3 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-neutral-500" />
                          <div>
                            <span className="font-bold text-xs text-light-text dark:text-dark-text">
                              Insumos Gerais da Obra
                            </span>
                            <span className="text-[11px] text-light-muted dark:text-dark-muted ml-2">
                              (Chapas globais, parafusos, fitas e químicos compartilhados)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {(() => {
                            const generalMats = (order.materiais || []).filter(
                              (m) => !m.item_planta_id || !(order.itens_planta || []).some((it) => it.id === m.item_planta_id)
                            );
                            const sepCount = generalMats.filter((m) => m.status_separacao === 'separado').length;

                            return (
                              <>
                                <span className="font-mono-code text-[11px] px-2 py-0.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text">
                                  {sepCount}/{generalMats.length} separados
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddForPiece('')}
                                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-medium"
                                  title="Adicionar insumo geral para a obra"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Insumo Geral</span>
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {(() => {
                        const generalMats = (order.materiais || []).filter(
                          (m) => !m.item_planta_id || !(order.itens_planta || []).some((it) => it.id === m.item_planta_id)
                        );

                        if (generalMats.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-light-muted dark:text-dark-muted bg-light-card/40 dark:bg-dark-card/40">
                              Nenhum insumo geral da obra cadastrado. Todos os materiais foram destinados a peças específicas ou nenhum foi cadastrado.
                            </div>
                          );
                        }

                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-light-border dark:border-dark-border bg-light-card/60 dark:bg-dark-card/60 font-mono-code text-[10px] text-light-muted dark:text-dark-muted">
                                  <th className="p-2.5">Descrição do Insumo</th>
                                  <th className="p-2.5">Categoria</th>
                                  <th className="p-2.5 text-center">Quantidade</th>
                                  <th className="p-2.5">Estoque</th>
                                  <th className="p-2.5">Status Separação</th>
                                  <th className="p-2.5">Destinar à Peça</th>
                                  <th className="p-2.5 text-right">Ação</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-light-border dark:divide-dark-border bg-light-card dark:bg-dark-card">
                                {generalMats.map((mat) => (
                                  <tr key={mat.id} className="hover:bg-light-surface/60 dark:hover:bg-dark-surface/60 transition-colors">
                                    <td className="p-2.5 font-medium text-light-text dark:text-dark-text">
                                      {mat.descricao}
                                    </td>
                                    <td className="p-2.5 text-light-muted dark:text-dark-muted">
                                      <span className="font-mono-code text-[10px] uppercase">
                                        {mat.categoria}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-center font-mono-code">
                                      {mat.quantidade} {mat.unidade}
                                    </td>
                                    <td className="p-2.5 text-light-muted dark:text-dark-muted">
                                      {mat.localizacao_estoque || '-'}
                                    </td>
                                    <td className="p-2.5">
                                      <button
                                        type="button"
                                        onClick={() => onCycleMaterialStatus(order.id, mat.id)}
                                        className="hover:opacity-80 transition-opacity"
                                        title="Clique para alternar o status da separação"
                                      >
                                        <StatusSeparacaoBadge status={mat.status_separacao} />
                                      </button>
                                    </td>
                                    <td className="p-2.5">
                                      <select
                                        value={mat.item_planta_id || ''}
                                        onChange={(e) =>
                                          onUpdateMaterial(order.id, mat.id, {
                                            item_planta_id: e.target.value || undefined,
                                          })
                                        }
                                        className="text-[11px] px-2 py-1 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none max-w-[160px] truncate"
                                        title="Alocar este insumo a uma peça específica"
                                      >
                                        <option value="">Geral da Obra</option>
                                        {(order.itens_planta || []).map((it) => (
                                          <option key={it.id} value={it.id}>
                                            {it.codigo} - {it.nome}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <button
                                        type="button"
                                        onClick={() => onRemoveMaterial(order.id, mat.id)}
                                        className="p-1 rounded text-neutral-400 hover:text-red-600 transition-colors"
                                        title="Remover material"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                </div>
              )}

              {/* MODO 2: VISUALIZAÇÃO EM TABELA COMPLETA COM DESTINO */}
              {materialViewMode === 'list' && (
                <div>
                  {(() => {
                    const displayedMats = (order.materiais || []).filter((m) => {
                      if (materialFilterItem === 'todos') return true;
                      if (materialFilterItem === 'geral') {
                        return !m.item_planta_id || !(order.itens_planta || []).some((it) => it.id === m.item_planta_id);
                      }
                      return m.item_planta_id === materialFilterItem;
                    });

                    if (displayedMats.length === 0) {
                      return (
                        <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-light-border dark:border-dark-border rounded">
                          Nenhum material encontrado com o filtro selecionado.
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto border border-light-border dark:border-dark-border rounded">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface font-mono-code text-[11px] text-light-muted dark:text-dark-muted">
                              <th className="p-2.5">Descrição do Insumo</th>
                              <th className="p-2.5">Categoria</th>
                              <th className="p-2.5">Peça Destinada</th>
                              <th className="p-2.5 text-center">Quantidade</th>
                              <th className="p-2.5">Estoque</th>
                              <th className="p-2.5">Status Separação</th>
                              <th className="p-2.5 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-light-border dark:divide-dark-border">
                            {displayedMats.map((mat) => {
                              const assignedItem = (order.itens_planta || []).find((it) => it.id === mat.item_planta_id);

                              return (
                                <tr key={mat.id} className="hover:bg-light-surface dark:hover:bg-dark-surface transition-colors">
                                  <td className="p-2.5 font-medium text-light-text dark:text-dark-text">
                                    {mat.descricao}
                                  </td>
                                  <td className="p-2.5 text-light-muted dark:text-dark-muted">
                                    <span className="font-mono-code text-[11px] uppercase">
                                      {mat.categoria}
                                    </span>
                                  </td>
                                  <td className="p-2.5">
                                    <select
                                      value={mat.item_planta_id || ''}
                                      onChange={(e) =>
                                        onUpdateMaterial(order.id, mat.id, {
                                          item_planta_id: e.target.value || undefined,
                                        })
                                      }
                                      className={`text-[11px] font-mono-code px-2 py-1 rounded border transition-colors max-w-[200px] truncate ${
                                        assignedItem
                                          ? 'border-neutral-300 dark:border-neutral-700 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text font-semibold'
                                          : 'border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-muted dark:text-dark-muted'
                                      }`}
                                      title="Clique para reatribuir este insumo a outra peça da obra"
                                    >
                                      <option value="">Geral da Obra</option>
                                      {(order.itens_planta || []).map((it) => (
                                        <option key={it.id} value={it.id}>
                                          {it.codigo} - {it.nome}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-2.5 text-center font-mono-code">
                                    {mat.quantidade} {mat.unidade}
                                  </td>
                                  <td className="p-2.5 text-light-muted dark:text-dark-muted">
                                    {mat.localizacao_estoque || '-'}
                                  </td>
                                  <td className="p-2.5">
                                    <button
                                      type="button"
                                      onClick={() => onCycleMaterialStatus(order.id, mat.id)}
                                      className="hover:opacity-80 transition-opacity"
                                      title="Clique para alternar o status da separação"
                                    >
                                      <StatusSeparacaoBadge status={mat.status_separacao} />
                                    </button>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => onRemoveMaterial(order.id, mat.id)}
                                      className="p-1 rounded text-neutral-400 hover:text-red-600 transition-colors"
                                      title="Remover material"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

          {/* ABA 4: HISTÓRICO DA OS */}
          {activeTab === 'historico' && (
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-5 space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-light-text dark:text-dark-text">
                  Linha do Tempo da Obra
                </h3>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">
                  Registro cronológico de aprovações, liberações CNC e alterações de status
                </p>
              </div>

              {(!order.historico || order.historico.length === 0) ? (
                <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-light-border dark:border-dark-border rounded">
                  Nenhum registro histórico gerado para esta ordem de serviço.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-light-border dark:before:bg-dark-border">
                  {order.historico.map((h) => (
                    <div key={h.id} className="relative pl-7 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-light-border dark:border-dark-border bg-black dark:bg-white" />
                      <div className="flex items-center gap-2 font-mono-code text-[11px] text-light-muted dark:text-dark-muted">
                        <span>{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                        <span>•</span>
                        <span className="font-semibold text-light-text dark:text-dark-text">{h.etapa}</span>
                        <span>•</span>
                        <span>Por: {h.autor}</span>
                      </div>
                      <p className="mt-0.5 text-light-text dark:text-dark-text">
                        {h.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Modal de Edição Completa da Obra (Acionado pelo Lápis) */}
      {isEditModalOpen && (
        <OSEditModal
          order={order}
          onClose={() => setIsEditModalOpen(false)}
          onSave={onUpdateOrder}
        />
      )}

      {/* Modal de Gestão de Etiquetas Trello */}
      {isTagModalOpen && (
        <TagManagerModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          selectedTags={order.tags || []}
          allExistingTags={allTags}
          projectTitle={`${order.numero_os} - ${order.cliente}`}
          onToggleTag={async (tag) => {
            if (onToggleTag) {
              await onToggleTag(order.id, tag);
            } else {
              const current = order.tags || [];
              const exists = current.some((t) => areTagsEqual(t, tag));
              const next = exists
                ? current.filter((t) => !areTagsEqual(t, tag))
                : [...current, tag];
              await onUpdateOrder({ ...order, tags: next });
            }
          }}
        />
      )}

    </div>
  );
};
