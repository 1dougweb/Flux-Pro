import React, { useState } from 'react';
import {
  OrdemServico,
  PlanoCorte,
  ItemMaterial,
  ItemPlanta,
  CategoriaMaterial,
  StatusCorte,
  StatusSeparacao,
  OSStatus,
  SUGESTOES_TAGS_CV,
  SUGESTOES_AMBIENTES_CV,
} from '../../types';
import { OSStatusBadge, OSPrioridadeBadge, StatusCorteBadge, StatusSeparacaoBadge, TagBadge, AmbienteBadge } from '../common/Badge';
import { DeliveryCountdown } from '../common/DeliveryCountdown';
import { MaterialProgressBar } from '../materials/MaterialProgressBar';
import { ItemPlantaTable } from '../planta/ItemPlantaTable';
import {
  X,
  Scissors,
  Package,
  Layers,
  Calendar,
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
  Tag,
  MapPin,
} from 'lucide-react';

interface OSDetailModalProps {
  order: OrdemServico;
  onClose: () => void;
  onUpdateCutPlan: (osId: string, partial: Partial<PlanoCorte>) => Promise<void>;
  onAddItemPlanta: (osId: string, item: Omit<ItemPlanta, 'id' | 'os_id' | 'created_at'>) => Promise<void>;
  onUpdateItemPlanta: (osId: string, itemId: string, partial: Partial<ItemPlanta>) => Promise<void>;
  onRemoveItemPlanta: (osId: string, itemId: string) => Promise<void>;
  onCycleItemPlantaStatus: (osId: string, itemId: string) => Promise<void>;
  onAddMaterial: (osId: string, item: Omit<ItemMaterial, 'id' | 'os_id' | 'created_at'>) => Promise<void>;
  onUpdateMaterial: (osId: string, materialId: string, partial: Partial<ItemMaterial>) => Promise<void>;
  onRemoveMaterial: (osId: string, materialId: string) => Promise<void>;
  onCycleMaterialStatus: (osId: string, materialId: string) => Promise<void>;
  onChangeStatus: (osId: string, status: OSStatus) => Promise<void>;
  onUpdateOrder: (updated: OrdemServico) => Promise<void>;
}

export const OSDetailModal: React.FC<OSDetailModalProps> = ({
  order,
  onClose,
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
}) => {
  const [activeTab, setActiveTab] = useState<'itens' | 'corte' | 'materiais' | 'dados' | 'historico'>('itens');

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

  // Estado e helpers para Tags da OS
  const [tagInput, setTagInput] = useState('');

  const handleAddTagToOS = async (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    const current = order.tags || [];
    if (current.includes(clean)) return;
    await onUpdateOrder({
      ...order,
      tags: [...current, clean],
    });
    setTagInput('');
  };

  const handleRemoveTagFromOS = async (tag: string) => {
    const current = order.tags || [];
    await onUpdateOrder({
      ...order,
      tags: current.filter((t) => t !== tag),
    });
  };

  // Estado e helpers para Ambientes da OS
  const [ambienteInput, setAmbienteInput] = useState('');

  const handleAddAmbienteToOS = async (amb: string) => {
    const clean = amb.trim();
    if (!clean) return;
    const current = order.ambientes || (order.ambiente ? [order.ambiente] : []);
    if (current.includes(clean)) return;
    const nextAmbientes = [...current, clean];
    await onUpdateOrder({
      ...order,
      ambientes: nextAmbientes,
      ambiente: nextAmbientes.join(', '),
    });
    setAmbienteInput('');
  };

  const handleRemoveAmbienteFromOS = async (amb: string) => {
    const current = order.ambientes || [];
    const nextAmbientes = current.filter((a) => a !== amb);
    await onUpdateOrder({
      ...order,
      ambientes: nextAmbientes,
      ambiente: nextAmbientes.join(', '),
    });
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

  // Desfazer aprovação do corte
  const handleRevokeApproval = async () => {
    if (confirm('Deseja reabrir o plano de corte para alterações?')) {
      await onUpdateCutPlan(order.id, {
        aprovado_producao: false,
        status_corte: 'em_otimizacao',
      });
    }
  };

  // Adicionar item de material
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
    });

    setNewMatDesc('');
    setNewMatQtd(1);
    setNewMatLoc('');
    setShowAddMat(false);
  };

  // Inserir Kit Padrão de Comunicação Visual (LEDs, Fontes, PU40, VHB e Fixadores)
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
      {
        categoria: 'fixacao_quimica',
        descricao: 'Parafuso Autobrocante Flangeado 4.2 x 19mm para Metal',
        quantidade: 150,
        unidade: 'un',
        status_separacao: 'pendente',
        localizacao_estoque: 'Caixa Fixadores P-01',
      },
      {
        categoria: 'fixacao_quimica',
        descricao: 'Rebite de Repuxo Alumínio 4.0 x 12mm',
        quantidade: 100,
        unidade: 'un',
        status_separacao: 'pendente',
      },
      {
        categoria: 'iluminacao',
        descricao: 'Cabo Paralelo Bicolor 2 x 1.5mm Flexível',
        quantidade: 25,
        unidade: 'metro',
        status_separacao: 'pendente',
        localizacao_estoque: 'Carretel Fios',
      },
      {
        categoria: 'gabarito',
        descricao: 'Gabarito de Furação e Alinhamento 1:1 Impresso',
        quantidade: 1,
        unidade: 'un',
        status_separacao: 'pendente',
        observacoes: 'Imprimir na plotter antes da equipe sair para a obra',
      },
    ];

    for (const item of defaultKit) {
      await onAddMaterial(order.id, item);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 backdrop-blur-sm">
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Topo do Modal com OS, Cliente, Status e Fechar */}
        <div className="p-4 sm:p-5 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono-code font-bold text-sm bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded">
                  {order.numero_os}
                </span>
                <OSStatusBadge status={order.status} />
                <OSPrioridadeBadge prioridade={order.prioridade} />
                <DeliveryCountdown
                  dateStr={order.previsao_entrega}
                  isDelivered={order.status === 'entregue'}
                />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-light-text dark:text-dark-text">
                {order.nome_projeto}
              </h2>
              <p className="text-xs text-light-muted dark:text-dark-muted">
                Cliente: <span className="font-medium text-light-text dark:text-dark-text">{order.cliente}</span>
                {order.telefone_cliente && ` • Tel: ${order.telefone_cliente}`}
              </p>

              {/* Ambientes e Tags Ativos no Topo */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {(order.ambientes && order.ambientes.length > 0 ? order.ambientes : order.ambiente ? [order.ambiente] : []).map((amb) => (
                  <AmbienteBadge
                    key={amb}
                    ambiente={amb}
                    onRemove={() => handleRemoveAmbienteFromOS(amb)}
                  />
                ))}
                {order.tags && order.tags.map((t) => (
                  <TagBadge
                    key={t}
                    tag={t}
                    onRemove={() => handleRemoveTagFromOS(t)}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Abas de Navegação */}
          <div className="flex items-center gap-1 mt-4 pt-2 border-t border-light-border dark:border-dark-border overflow-x-auto">
            
            {/* Aba 1: Itens da Planta / Obra */}
            <button
              onClick={() => setActiveTab('itens')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                activeTab === 'itens'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Itens da Planta ({order.itens_planta?.length || 0})</span>
            </button>

            {/* Aba 2: Plano de Corte */}
            <button
              onClick={() => setActiveTab('corte')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                activeTab === 'corte'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Plano de Corte Geral</span>
              {cutPlan.aprovado_producao ? (
                <span className="w-2 h-2 rounded-full bg-neutral-100 dark:bg-neutral-900" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            {/* Aba 3: Separação de Materiais */}
            <button
              onClick={() => setActiveTab('materiais')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                activeTab === 'materiais'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Separação de Materiais ({order.materiais?.length || 0})</span>
            </button>

            {/* Aba 4: Dados da OS */}
            <button
              onClick={() => setActiveTab('dados')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                activeTab === 'dados'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dados & Status da OS</span>
            </button>

            {/* Aba 5: Histórico */}
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

        {/* Conteúdo das Abas (Scrollável) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ======================================================== */}
          {/* ABA: ITENS DA PLANTA / OBRA (TABELA COM FOTOS E CORTES)  */}
          {/* ======================================================== */}
          {activeTab === 'itens' && (
            <div className="space-y-4">
              {/* Banner Resumo de Itens & Arquivos de Corte */}
              <div className="p-3.5 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text">
                    <Layers className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-light-text dark:text-dark-text">
                      Itens da Obra ({(order.itens_planta || []).length} {((order.itens_planta || []).length === 1 ? 'peça' : 'peças')})
                    </h4>
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">
                      Arquivos vetoriais (.DXF/.CDR) e marcador de etapa individual para cada elemento
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
                    <span className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-light-card dark:bg-dark-card text-neutral-700 dark:text-neutral-300">
                      Arquivos de corte 100% anexados
                    </span>
                  ) : null}

                  <span className="px-2 py-0.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text font-semibold">
                    {(order.itens_planta || []).filter((it) => it.status_item === 'pronto_instalacao' || it.status_item === 'instalado').length}/{(order.itens_planta || []).length} prontos
                  </span>
                </div>
              </div>

              <ItemPlantaTable
                osId={order.id}
                itens={order.itens_planta || []}
                osAmbientes={order.ambientes && order.ambientes.length > 0 ? order.ambientes : order.ambiente ? [order.ambiente] : []}
                onAddItem={onAddItemPlanta}
                onUpdateItem={onUpdateItemPlanta}
                onRemoveItem={onRemoveItemPlanta}
                onCycleStatus={onCycleItemPlantaStatus}
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA: PLANO DE CORTE (FOCO ANTIESQUECIMENTO DO PROJETISTA) */}
          {/* ======================================================== */}
          {activeTab === 'corte' && (
            <div className="space-y-6">
              
              {/* Banner de Validação */}
              <div
                className={`p-4 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  cutPlan.aprovado_producao
                    ? 'border-neutral-300 bg-neutral-100 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                    : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm mb-1">
                    {cutPlan.aprovado_producao ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                        <span>Plano de Corte Geral Conferido e Liberado para a Fábrica</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        <span>Atenção: Plano de corte pendente de conferência e liberação!</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs opacity-90">
                    {cutPlan.aprovado_producao
                      ? `Validado em ${
                          cutPlan.data_conferencia
                            ? new Date(cutPlan.data_conferencia).toLocaleDateString('pt-BR')
                            : 'data recente'
                        }. A produção está autorizada a cortar as chapas.`
                      : 'Não inicie a produção nem o corte de chapas sem antes otimizar e conferir as medidas e fitas.'}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {cutPlan.aprovado_producao ? (
                    <button
                      onClick={handleRevokeApproval}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-neutral-400 dark:border-neutral-700 bg-light-card dark:bg-dark-card hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reabrir Corte</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveCutPlan(true)}
                      disabled={isSavingCut}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
                    >
                      <Check className="w-4 h-4" />
                      <span>Liberar para Produção</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Formulário de Especificação do Corte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Software de Origem / CAM */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Software CAM / Vetorização de Origem
                  </label>
                  <select
                    value={softwareOrigem}
                    onChange={(e) => setSoftwareOrigem(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="ArtCAM">ArtCAM (Usinagem CNC)</option>
                    <option value="Aspire / Vectric">Aspire / Vectric (3D e V-Bit ACM)</option>
                    <option value="CorelDraw">CorelDraw (Vetor EPS / DXF / CDR)</option>
                    <option value="AutoCAD">AutoCAD (Plantas e DXF 2D)</option>
                    <option value="LightBurn">LightBurn (Laser CO2 / Fibra)</option>
                    <option value="FlexiSign">FlexiSign (Plotter de Recorte)</option>
                    <option value="Manual / Serralheria">Manual / Serralheria e Dobradeira</option>
                  </select>
                </div>

                {/* Máquina Principal */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Máquina Principal de Usinagem
                  </label>
                  <select
                    value={maquinaPrincipal}
                    onChange={(e) => setMaquinaPrincipal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="Router CNC">Router CNC (ACM, PVC Expandido, Madeira)</option>
                    <option value="Laser CO2 / Fibra">Laser CO2 / Fibra (Acrílico, Inox, Galvanizado)</option>
                    <option value="Plotter de Recorte">Plotter de Recorte (Vinil Adesivo, Máscara)</option>
                    <option value="Mesa de Impressão UV">Mesa de Impressão UV / Lona</option>
                    <option value="Serralheria / Dobra">Serralheria / Calandra / Dobra Manual</option>
                  </select>
                </div>

                {/* Status do Corte */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Status do Plano de Corte / Arquivos CNC
                  </label>
                  <select
                    value={statusCorte}
                    onChange={(e) => setStatusCorte(e.target.value as StatusCorte)}
                    className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="nao_iniciado">Não Iniciado (Aguardando medidas/vetor)</option>
                    <option value="em_otimizacao">Em Vetorização / Geração de G-Code</option>
                    <option value="gerado">Arquivos Gerados (DXF/EPS prontos para conferência)</option>
                    <option value="conferido">Conferido pelo Projetista Técnico</option>
                    <option value="enviado_producao">Liberado para Router / Laser / Fábrica</option>
                  </select>
                </div>

                {/* Link ou Arquivo dos Vetores */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Link do Arquivo CNC (.DXF, .EPS, .CDR) ou Pasta na Nuvem / Servidor
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={arquivoLink}
                      onChange={(e) => setArquivoLink(e.target.value)}
                      placeholder="Ex: https://drive.google.com/.../corte_fachada.dxf ou //servidor/cnc/os-001.eps"
                      className="flex-1 px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                    {arquivoLink && (
                      <a
                        href={arquivoLink.startsWith('http') ? arquivoLink : `https://${arquivoLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Link</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Total de Chapas */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Total de Chapas Estimadas (ACM, Acrílico, PVC, Inox)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalChapas}
                    onChange={(e) => setTotalChapas(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                {/* Metros de Vinil / Lona e Gabarito */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Metragem Linear de Vinil / Lona (m)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={metrosVinil}
                      onChange={(e) => setMetrosVinil(Number(e.target.value))}
                      className="flex-1 px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-light-text dark:text-dark-text cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={gabaritoPronto}
                        onChange={(e) => setGabaritoPronto(e.target.checked)}
                        className="rounded border-light-border dark:border-dark-border text-black focus:ring-0"
                      />
                      <span>Gabarito 1:1 Impresso</span>
                    </label>
                  </div>
                </div>

                {/* Especificação das Chapas */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Especificação Detalhada das Chapas (Cores, Espessuras e Medidas)
                  </label>
                  <textarea
                    rows={2}
                    value={especificacaoChapas}
                    onChange={(e) => setEspecificacaoChapas(e.target.value)}
                    placeholder="Ex: 4x ACM Azul Brilho 3mm 5000x1220mm (Bandejas Fachada) | 2x Acrílico Cast Branco Leitoso 3mm | 1x PVC Expandido 20mm (Letras)"
                    className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                {/* Observações de Corte */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Observações de Usinagem, Ângulos de Fresa e Fixação
                  </label>
                  <textarea
                    rows={2}
                    value={obsCorte}
                    onChange={(e) => setObsCorte(e.target.value)}
                    placeholder="Ex: Fresa 90° em V para dobra de ACM com profundidade 2.2mm. Respeitar sentido das setas de pintura do ACM. Teste de módulos LED 12V na bancada antes de fechar os módulos."
                    className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>

              </div>

              {/* Botão de Salvar Rascunho do Corte */}
              <div className="flex justify-end pt-2 border-t border-light-border dark:border-dark-border">
                <button
                  onClick={() => handleSaveCutPlan(false)}
                  disabled={isSavingCut}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Dados do Plano de Corte</span>
                </button>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* ABA: SEPARAÇÃO E CONSUMO DE MATERIAIS                    */}
          {/* ======================================================== */}
          {activeTab === 'materiais' && (
            <div className="space-y-5">
              
              {/* Barra de Progresso Geral */}
              <MaterialProgressBar materiais={order.materiais} />

              {/* Barra de Ações Rápidas */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddMat(!showAddMat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Item</span>
                  </button>

                  <button
                    onClick={handleInsertStandardKit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text transition-colors"
                    title="Insere itens padrão de comunicação visual (Módulos LED 12V, Fontes Chaveadas, PU 40, Fita VHB 3M, Rebites, Parafusos Brocantes)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Inserir Kit Comunicação Visual</span>
                  </button>
                </div>

                <div className="text-[11px] text-light-muted dark:text-dark-muted">
                  Dica: Clique no status do item para alternar: <strong className="text-light-text dark:text-dark-text">Pendente &rarr; Separado &rarr; Falta Comprar &rarr; Consumido</strong>
                </div>
              </div>

              {/* Formulário de Novo Material */}
              {showAddMat && (
                <form
                  onSubmit={handleAddNewMaterial}
                  className="p-3.5 rounded border border-black dark:border-white bg-light-surface dark:bg-dark-surface space-y-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-light-text dark:text-dark-text">
                      Cadastrar Novo Material para esta OS
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddMat(false)}
                      className="text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        required
                        value={newMatDesc}
                        onChange={(e) => setNewMatDesc(e.target.value)}
                        placeholder="Descrição (ex: Módulo LED 12V 1.5W 6500K ou PU 40 Cinza)"
                        className="w-full px-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <select
                        value={newMatCat}
                        onChange={(e) => setNewMatCat(e.target.value as CategoriaMaterial)}
                        className="w-full px-2 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                      >
                        <option value="chapa">Chapa (ACM, Acrílico, PVC)</option>
                        <option value="vinil_lona">Vinil / Lona / Laminação</option>
                        <option value="iluminacao">Iluminação (LEDs / Fontes)</option>
                        <option value="estrutura">Estrutura (Tubos / Metalon)</option>
                        <option value="fixacao_quimica">Fixação (PU 40 / VHB)</option>
                        <option value="gabarito">Gabarito 1:1</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1 flex gap-1">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={newMatQtd}
                        onChange={(e) => setNewMatQtd(Number(e.target.value))}
                        className="w-16 px-2 py-1.5 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newMatUn}
                        onChange={(e) => setNewMatUn(e.target.value)}
                        placeholder="un/par"
                        className="w-14 px-2 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <input
                        type="text"
                        value={newMatLoc}
                        onChange={(e) => setNewMatLoc(e.target.value)}
                        placeholder="Local estoque"
                        className="w-full px-2 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-semibold rounded bg-black text-white dark:bg-white dark:text-black"
                    >
                      Salvar Item
                    </button>
                  </div>
                </form>
              )}

              {/* Lista / Tabela de Materiais */}
              {(!order.materiais || order.materiais.length === 0) ? (
                <div className="p-8 text-center border border-dashed border-light-border dark:border-dark-border rounded text-xs text-light-muted dark:text-dark-muted">
                  Nenhum material adicionado a esta Ordem de Serviço ainda.
                  <br />
                  Clique em "Adicionar Item" ou "Inserir Kit Comunicação Visual" acima.
                </div>
              ) : (
                <div className="border border-light-border dark:border-dark-border rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border font-semibold text-light-text dark:text-dark-text">
                      <tr>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Descrição</th>
                        <th className="p-2.5">Categoria</th>
                        <th className="p-2.5 text-right">Qtd</th>
                        <th className="p-2.5">Localização</th>
                        <th className="p-2.5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border">
                      {order.materiais.map((mat) => (
                        <tr
                          key={mat.id}
                          className="hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 transition-colors"
                        >
                          <td className="p-2.5">
                            <button
                              onClick={() => onCycleMaterialStatus(order.id, mat.id)}
                              title="Clique para alternar status (Pendente / Separado / Em Falta / Consumido)"
                              className="focus:outline-none"
                            >
                              <StatusSeparacaoBadge status={mat.status_separacao} />
                            </button>
                          </td>
                          <td className="p-2.5 font-medium text-light-text dark:text-dark-text">
                            {mat.descricao}
                            {mat.observacoes && (
                              <p className="text-[10px] text-light-muted dark:text-dark-muted">
                                {mat.observacoes}
                              </p>
                            )}
                          </td>
                          <td className="p-2.5 text-light-muted dark:text-dark-muted capitalize">
                            {mat.categoria.replace('_', ' ')}
                          </td>
                          <td className="p-2.5 text-right font-mono-code font-bold">
                            {mat.quantidade} {mat.unidade}
                          </td>
                          <td className="p-2.5 text-light-muted dark:text-dark-muted">
                            {mat.localizacao_estoque || '-'}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => onRemoveMaterial(order.id, mat.id)}
                              title="Remover item"
                              className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
          )}

          {/* ======================================================== */}
          {/* ABA: DADOS GERAIS & STATUS DA OS                         */}
          {/* ======================================================== */}
          {activeTab === 'dados' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Status Geral da OS
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => onChangeStatus(order.id, e.target.value as OSStatus)}
                    className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text font-medium"
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="projeto_aprovado">Projeto Aprovado</option>
                    <option value="corte_pendente">Corte Pendente</option>
                    <option value="separacao_pendente">Separação Pendente</option>
                    <option value="em_producao">Em Produção</option>
                    <option value="pronto_entrega">Pronto para Entrega</option>
                    <option value="entregue">Entregue (Concluído)</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Previsão de Entrega
                  </label>
                  <input
                    type="date"
                    value={order.previsao_entrega}
                    onChange={(e) => onUpdateOrder({ ...order, previsao_entrega: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Nome do Cliente
                  </label>
                  <input
                    type="text"
                    value={order.cliente}
                    onChange={(e) => onUpdateOrder({ ...order, cliente: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    value={order.telefone_cliente || ''}
                    onChange={(e) => onUpdateOrder({ ...order, telefone_cliente: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    value={order.nome_projeto}
                    onChange={(e) => onUpdateOrder({ ...order, nome_projeto: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
                  />
                </div>

                {/* Ambientes da Obra (Ambientação da Comunicação Visual) */}
                <div className="md:col-span-2 pt-2 border-t border-light-border dark:border-dark-border">
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Ambientes da Obra (Ambientação)</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      Os itens desta obra correspondem a estes ambientes
                    </span>
                  </label>

                  {/* Ambientes Ativos */}
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] p-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-2">
                    {(!order.ambientes || order.ambientes.length === 0) && !order.ambiente ? (
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 italic">
                        Nenhum ambiente cadastrado nesta OS.
                      </span>
                    ) : (
                      (order.ambientes && order.ambientes.length > 0 ? order.ambientes : [order.ambiente!]).map((amb) => (
                        <AmbienteBadge
                          key={amb}
                          ambiente={amb}
                          onRemove={() => handleRemoveAmbienteFromOS(amb)}
                        />
                      ))
                    )}
                  </div>

                  {/* Input de Adicionar Ambiente */}
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={ambienteInput}
                      onChange={(e) => setAmbienteInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAmbienteToOS(ambienteInput);
                        }
                      }}
                      placeholder="Novo ambiente (ex: Fachada Lateral, Vitrine) e Enter"
                      className="flex-1 px-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAmbienteToOS(ambienteInput)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded bg-neutral-200 dark:bg-neutral-800 text-light-text dark:text-dark-text hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>

                  {/* Sugestões Rápidas de Ambientes */}
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-neutral-400 mr-1">Sugestões:</span>
                    {SUGESTOES_AMBIENTES_CV.map((sug) => {
                      const currentAmbs = order.ambientes || (order.ambiente ? [order.ambiente] : []);
                      const isAdded = currentAmbs.includes(sug);
                      return (
                        <button
                          key={sug}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddAmbienteToOS(sug)}
                          className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded border transition-colors ${
                            isAdded
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

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
                    Observações Gerais do Projeto
                  </label>
                  <textarea
                    rows={3}
                    value={order.observacoes || ''}
                    onChange={(e) => onUpdateOrder({ ...order, observacoes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text"
                  />
                </div>

                {/* Tags do Projeto (Comunicação Visual) */}
                <div className="md:col-span-2 pt-3 border-t border-light-border dark:border-dark-border">
                  <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Tags do Projeto (Comunicação Visual)</span>
                  </label>

                  {/* Tags ativas */}
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] p-2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-2">
                    {(!order.tags || order.tags.length === 0) ? (
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 italic">
                        Nenhuma tag vinculada a este projeto.
                      </span>
                    ) : (
                      order.tags.map((t) => (
                        <TagBadge
                          key={t}
                          tag={t}
                          onRemove={() => handleRemoveTagFromOS(t)}
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
                          handleAddTagToOS(tagInput);
                        }
                      }}
                      placeholder="Adicionar nova tag (ex: Fachada ACM, LED 12V)..."
                      className="flex-1 px-3 py-1.5 text-xs rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTagToOS(tagInput)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  {/* Sugestões rápidas de tags de CV */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] uppercase font-mono-code text-neutral-400 dark:text-neutral-500 mr-1">
                      Sugestões Rápidas:
                    </span>
                    {SUGESTOES_TAGS_CV.map((sug) => {
                      const already = order.tags?.includes(sug);
                      return (
                        <button
                          key={sug}
                          type="button"
                          disabled={already}
                          onClick={() => handleAddTagToOS(sug)}
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
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA: HISTÓRICO E LINHA DO TEMPO DA OS                    */}
          {/* ======================================================== */}
          {activeTab === 'historico' && (
            <div className="space-y-3">
              {(!order.historico || order.historico.length === 0) ? (
                <div className="p-8 text-center text-xs text-light-muted dark:text-dark-muted">
                  Nenhum registro histórico gerado ainda.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {order.historico.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-light-text dark:text-dark-text mb-0.5">
                          {h.etapa}
                        </div>
                        <p className="text-light-muted dark:text-dark-muted">
                          {h.descricao}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono-code text-[11px] text-neutral-500">
                          {new Date(h.created_at).toLocaleString('pt-BR')}
                        </span>
                        <div className="text-[10px] text-neutral-400">
                          {h.autor}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono-code text-light-muted dark:text-dark-muted">
            ID: {order.id} • Criado em: {new Date(order.created_at).toLocaleDateString('pt-BR')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
