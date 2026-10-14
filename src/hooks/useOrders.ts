import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  OrdemServico,
  ViewFilter,
  PlanoCorte,
  ItemMaterial,
  ItemPlanta,
  StatusSeparacao,
  StatusItemObra,
  OSStatus,
  HistoricoOS,
} from '../types';
import { fetchAllOrders, saveOrder, deleteOrder as apiDeleteOrder, generateUUID, getOrderAmbientes } from '../lib/storage';
import { areTagsEqual, parseTag } from '../lib/tags';

export interface ItemPlantaWithOS extends ItemPlanta {
  os_numero: string;
  os_cliente: string;
  os_projeto: string;
  os_previsao: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ViewFilter>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAmbientes, setSelectedAmbientes] = useState<string[]>([]);

  // Escuta erros de sincronização com o Supabase
  useEffect(() => {
    const handleSyncError = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      setSyncError(customEvent.detail?.message || 'Erro ao sincronizar com o Supabase');
    };
    window.addEventListener('fluxpro_sync_error', handleSyncError);
    return () => window.removeEventListener('fluxpro_sync_error', handleSyncError);
  }, []);

  // Carrega ordens
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { orders: loaded, source } = await fetchAllOrders();
      setOrders(loaded);
      setDataSource(source);
    } catch (err) {
      console.error('Erro ao carregar ordens:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Contadores e Alertas Antiesquecimento
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const ativas = orders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado');

    // Alerta 1: Sem plano de corte liberado
    const cortePendente = ativas.filter(
      (o) =>
        !o.plano_corte ||
        o.plano_corte.status_corte === 'nao_iniciado' ||
        o.plano_corte.status_corte === 'em_otimizacao' ||
        !o.plano_corte.aprovado_producao
    );

    // Alerta 2: Materiais pendentes ou em falta
    const separacaoPendente = ativas.filter((o) => {
      const mats = o.materiais || [];
      if (mats.length === 0) return true;
      return mats.some((m) => m.status_separacao === 'pendente' || m.status_separacao === 'falta_comprar');
    });

    // Alerta 3: Atrasadas
    const atrasadas = ativas.filter((o) => o.previsao_entrega < today);

    // Alerta 4: Entregas nos próximos 3 dias
    const proximas = ativas.filter((o) => {
      if (o.previsao_entrega < today) return false;
      const diffDays = Math.ceil(
        (new Date(o.previsao_entrega).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 3;
    });

    // Estatísticas de Itens de Planta
    const totalItens = orders.reduce((acc, o) => acc + (o.itens_planta?.length || 0), 0);
    const itensCortePendente = orders.reduce(
      (acc, o) => acc + (o.itens_planta?.filter((it) => it.status_corte === 'pendente').length || 0),
      0
    );

    return {
      totalAtivas: ativas.length,
      cortePendenteCount: cortePendente.length,
      separacaoPendenteCount: separacaoPendente.length,
      atrasadasCount: atrasadas.length,
      proximasCount: proximas.length,
      totalItensPlanta: totalItens,
      itensCortePendente: itensCortePendente,
    };
  }, [orders]);

  // Lista unificada de todos os itens da planta / obra
  const allItensPlanta = useMemo<ItemPlantaWithOS[]>(() => {
    const list: ItemPlantaWithOS[] = [];
    for (const o of orders) {
      if (o.itens_planta && o.itens_planta.length > 0) {
        for (const item of o.itens_planta) {
          list.push({
            ...item,
            os_numero: o.numero_os,
            os_cliente: o.cliente,
            os_projeto: o.nome_projeto,
            os_previsao: o.previsao_entrega,
          });
        }
      }
    }
    return list;
  }, [orders]);

  // Lista única e ordenada de todas as tags em uso nos projetos
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const order of orders) {
      if (order.tags && Array.isArray(order.tags)) {
        for (const t of order.tags) {
          if (t && t.trim()) {
            tagSet.add(t.trim());
          }
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [orders]);

  // Lista única e contada de todos os ambientes presentes nas ordens
  const allAmbientes = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const order of orders) {
      const ambs = getOrderAmbientes(order);
      for (const a of ambs) {
        countMap.set(a, (countMap.get(a) || 0) + 1);
      }
    }
    return Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [orders]);

  // Alterna a inclusão de um ambiente no filtro simultâneo (multi-select)
  const toggleAmbienteFilter = useCallback((ambiente: string) => {
    setSelectedAmbientes((prev) => {
      if (prev.includes(ambiente)) {
        return prev.filter((a) => a !== ambiente);
      } else {
        return [...prev, ambiente];
      }
    });
  }, []);

  // Seleciona um ambiente de forma exclusiva (único) ou limpa se já for o único
  const selectSingleAmbiente = useCallback((ambiente: string) => {
    setSelectedAmbientes((prev) => {
      if (prev.length === 1 && prev[0] === ambiente) {
        return [];
      }
      return [ambiente];
    });
  }, []);

  // Limpa o filtro de ambientes para exibir todos
  const clearAmbienteFilter = useCallback(() => {
    setSelectedAmbientes([]);
  }, []);

  // Filtro e Busca
  const filteredOrders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return orders.filter((order) => {
      // Filtro por Tag selecionada
      if (selectedTag) {
        if (!order.tags || !order.tags.some((t) => areTagsEqual(t, selectedTag))) {
          return false;
        }
      }

      // Filtro simultâneo por Ambiente(s)
      if (selectedAmbientes.length > 0) {
        const orderAmbs = getOrderAmbientes(order);
        const matchesAny = selectedAmbientes.some((sel) => orderAmbs.includes(sel));
        if (!matchesAny) {
          return false;
        }
      }

      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchNumero = order.numero_os.toLowerCase().includes(q);
        const matchCliente = order.cliente.toLowerCase().includes(q);
        const matchProjeto = order.nome_projeto.toLowerCase().includes(q);
        const matchAmbiente =
          order.ambiente?.toLowerCase().includes(q) ||
          order.ambientes?.some((a) => a.toLowerCase().includes(q));
        const matchTags = order.tags?.some((t) => {
          const parsed = parseTag(t);
          return parsed.name.toLowerCase().includes(q) || t.toLowerCase().includes(q);
        });
        const matchItens = order.itens_planta?.some(
          (it) =>
            it.codigo.toLowerCase().includes(q) ||
            it.nome.toLowerCase().includes(q) ||
            it.ambiente.toLowerCase().includes(q)
        );

        if (!matchNumero && !matchCliente && !matchProjeto && !matchAmbiente && !matchItens && !matchTags) {
          return false;
        }
      }

      if (filter === 'corte_pendente') {
        if (order.status === 'entregue' || order.status === 'cancelado') return false;
        return (
          !order.plano_corte ||
          order.plano_corte.status_corte === 'nao_iniciado' ||
          order.plano_corte.status_corte === 'em_otimizacao' ||
          !order.plano_corte.aprovado_producao
        );
      }

      if (filter === 'separacao_pendente') {
        if (order.status === 'entregue' || order.status === 'cancelado') return false;
        const mats = order.materiais || [];
        if (mats.length === 0) return true;
        return mats.some((m) => m.status_separacao === 'pendente' || m.status_separacao === 'falta_comprar');
      }

      if (filter === 'em_producao') {
        return order.status === 'em_producao';
      }

      if (filter === 'urgentes_atrasadas') {
        if (order.status === 'entregue' || order.status === 'cancelado') return false;
        const isAtrasada = order.previsao_entrega < today;
        const isUrgente = order.prioridade === 'urgente' || order.prioridade === 'alta';
        return isAtrasada || isUrgente;
      }

      return true;
    });
  }, [orders, filter, searchQuery, selectedTag, selectedAmbientes]);

  // Criação de OS
  const createOrder = async (
    orderData: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>
  ): Promise<OrdemServico> => {
    const now = new Date().toISOString();
    const newId = generateUUID();

    const defaultPlanoCorte: PlanoCorte = {
      id: generateUUID(),
      os_id: newId,
      status_corte: 'nao_iniciado',
      software_origem: 'ArtCAM',
      maquina_principal: 'Router CNC',
      total_chapas: 0,
      especificacao_chapas: '',
      metros_vinil_lona: 0,
      gabarito_pronto: false,
      aprovado_producao: false,
      created_at: now,
      updated_at: now,
    };

    const newOrder: OrdemServico = {
      ...orderData,
      id: newId,
      tags: orderData.tags || [],
      created_at: now,
      updated_at: now,
      plano_corte: orderData.plano_corte || defaultPlanoCorte,
      materiais: orderData.materiais || [],
      itens_planta: orderData.itens_planta || [],
      historico: [
        {
          id: generateUUID(),
          os_id: newId,
          etapa: 'Criação da OS',
          descricao: `Ordem de serviço aberta para o cliente ${orderData.cliente}`,
          autor: 'Projetista',
          created_at: now,
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    await saveOrder(newOrder);
    return newOrder;
  };

  // Atualização de OS
  const updateOrderData = async (updated: OrdemServico): Promise<void> => {
    const withTimestamp = { ...updated, updated_at: new Date().toISOString() };
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? withTimestamp : o)));
    await saveOrder(withTimestamp);
  };

  // Exclusão de OS
  const removeOrder = async (orderId: string): Promise<void> => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
    }
    await apiDeleteOrder(orderId);
  };

  // Atualização direta do Plano de Corte
  const updateCutPlan = async (osId: string, partial: Partial<PlanoCorte>): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const currentPlan: PlanoCorte = target.plano_corte || {
      id: generateUUID(),
      os_id: osId,
      status_corte: 'nao_iniciado',
      software_origem: 'ArtCAM',
      maquina_principal: 'Router CNC',
      total_chapas: 0,
      especificacao_chapas: '',
      metros_vinil_lona: 0,
      gabarito_pronto: false,
      aprovado_producao: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedPlan: PlanoCorte = {
      ...currentPlan,
      ...partial,
      updated_at: new Date().toISOString(),
    };

    let updatedHistory = target.historico || [];
    if (partial.aprovado_producao && !currentPlan.aprovado_producao) {
      updatedHistory = [
        ...updatedHistory,
        {
          id: generateUUID(),
          os_id: osId,
          etapa: 'Plano de Corte Validado',
          descricao: `Plano de corte conferido (${updatedPlan.total_chapas} chapas) e liberado para a produção.`,
          autor: 'Projetista',
          created_at: new Date().toISOString(),
        },
      ];
    }

    const updatedOrder: OrdemServico = {
      ...target,
      plano_corte: updatedPlan,
      historico: updatedHistory,
      updated_at: new Date().toISOString(),
    };

    await updateOrderData(updatedOrder);
  };

  // ==========================================
  // Ações de Itens da Planta / Obra
  // ==========================================
  const addItemPlanta = async (
    osId: string,
    item: Omit<ItemPlanta, 'id' | 'os_id' | 'created_at'>
  ): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const newItem: ItemPlanta = {
      ...item,
      id: generateUUID(),
      os_id: osId,
      created_at: new Date().toISOString(),
    };

    const updatedOrder: OrdemServico = {
      ...target,
      itens_planta: [...(target.itens_planta || []), newItem],
      updated_at: new Date().toISOString(),
    };

    await updateOrderData(updatedOrder);
  };

  const updateItemPlanta = async (
    osId: string,
    itemId: string,
    partial: Partial<ItemPlanta>
  ): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const updatedItems = (target.itens_planta || []).map((it) =>
      it.id === itemId ? { ...it, ...partial } : it
    );

    const updatedOrder: OrdemServico = {
      ...target,
      itens_planta: updatedItems,
      updated_at: new Date().toISOString(),
    };

    await updateOrderData(updatedOrder);
  };

  const removeItemPlanta = async (osId: string, itemId: string): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const updatedItems = (target.itens_planta || []).filter((it) => it.id !== itemId);

    const updatedOrder: OrdemServico = {
      ...target,
      itens_planta: updatedItems,
      updated_at: new Date().toISOString(),
    };

    await updateOrderData(updatedOrder);
  };

  const cycleItemPlantaStatus = async (osId: string, itemId: string): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const item = target.itens_planta?.find((it) => it.id === itemId);
    if (!item) return;

    const cycle: Record<StatusItemObra, StatusItemObra> = {
      layout: 'corte_pendente',
      corte_pendente: 'em_producao',
      em_producao: 'teste_eletrico',
      teste_eletrico: 'pronto_instalacao',
      pronto_instalacao: 'instalado',
      instalado: 'layout',
    };

    await updateItemPlanta(osId, itemId, { status_item: cycle[item.status_item] });
  };

  // ==========================================
  // Ações de Materiais
  // ==========================================
  const addMaterialItem = async (
    osId: string,
    material: Omit<ItemMaterial, 'id' | 'os_id' | 'created_at'>
  ): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const newItem: ItemMaterial = {
      ...material,
      id: generateUUID(),
      os_id: osId,
      created_at: new Date().toISOString(),
    };

    const updatedOrder: OrdemServico = {
      ...target,
      materiais: [...(target.materiais || []), newItem],
      updated_at: new Date().toISOString(),
    };

    await updateOrderData(updatedOrder);
  };

  const updateMaterialItem = async (
    osId: string,
    materialId: string,
    partial: Partial<ItemMaterial>
  ): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const updatedMats = (target.materiais || []).map((m) =>
      m.id === materialId ? { ...m, ...partial } : m
    );

    const updatedOrder: OrdemServico = {
      ...target,
      materiais: updatedMats,
      updated_at: new Date().toISOString(),
    };

    await updateOrderData(updatedOrder);
  };

  const removeMaterialItem = async (osId: string, materialId: string): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const updatedMats = (target.materiais || []).filter((m) => m.id !== materialId);

    const updatedOrder: OrdemServico = {
      ...target,
      materiais: updatedMats,
      updated_at: new Date().toISOString(),
    };

    await updateOrderData(updatedOrder);
  };

  const cycleMaterialStatus = async (osId: string, materialId: string): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const item = target.materiais?.find((m) => m.id === materialId);
    if (!item) return;

    const cycle: Record<StatusSeparacao, StatusSeparacao> = {
      pendente: 'separado',
      separado: 'falta_comprar',
      falta_comprar: 'consumido',
      consumido: 'pendente',
    };

    await updateMaterialItem(osId, materialId, { status_separacao: cycle[item.status_separacao] });
  };

  // Mudar status da OS
  const changeOSStatus = async (osId: string, newStatus: OSStatus): Promise<void> => {
    const target = orders.find((o) => o.id === osId);
    if (!target) return;

    const statusLabels: Record<OSStatus, string> = {
      medicao_visita: 'Visita / Medição',
      layout_aprovado: 'Layout Aprovado',
      corte_pendente: 'Arquivos CNC / Corte',
      separacao_pendente: 'Separação de Materiais',
      em_producao: 'Em Usinagem / Produção',
      pronto_entrega: 'Pronto para Instalação',
      entregue: 'Instalado na Obra',
      cancelado: 'Cancelado',
    };

    const newHistory: HistoricoOS = {
      id: generateUUID(),
      os_id: osId,
      etapa: 'Mudança de Status',
      descricao: `Status alterado para "${statusLabels[newStatus]}"`,
      autor: 'Projetista',
      created_at: new Date().toISOString(),
    };

    const updated: OrdemServico = {
      ...target,
      status: newStatus,
      historico: [...(target.historico || []), newHistory],
      updated_at: new Date().toISOString(),
    };

    await updateOrderData(updated);
  };

  // Gerenciamento dinâmico de Tags
  const addTagToOrder = async (osId: string, tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    const target = orders.find((o) => o.id === osId);
    if (!target) return;
    const currentTags = target.tags || [];
    if (currentTags.includes(clean)) return;
    const updated: OrdemServico = {
      ...target,
      tags: [...currentTags, clean],
      updated_at: new Date().toISOString(),
    };
    await updateOrderData(updated);
  };

  const removeTagFromOrder = async (osId: string, tag: string) => {
    const target = orders.find((o) => o.id === osId);
    if (!target || !target.tags) return;
    const updated: OrdemServico = {
      ...target,
      tags: target.tags.filter((t) => !areTagsEqual(t, tag)),
      updated_at: new Date().toISOString(),
    };
    await updateOrderData(updated);
  };

  const toggleTagOnOrder = async (osId: string, tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    const target = orders.find((o) => o.id === osId);
    if (!target) return;
    const currentTags = target.tags || [];
    const exists = currentTags.some((t) => areTagsEqual(t, clean));
    const nextTags = exists
      ? currentTags.filter((t) => !areTagsEqual(t, clean))
      : [...currentTags, clean];

    const updated: OrdemServico = {
      ...target,
      tags: nextTags,
      updated_at: new Date().toISOString(),
    };
    await updateOrderData(updated);
  };

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  return {
    orders,
    filteredOrders,
    allItensPlanta,
    selectedOrder,
    selectedOrderId,
    setSelectedOrderId,
    selectedTag,
    setSelectedTag,
    allTags,
    selectedAmbientes,
    setSelectedAmbientes,
    toggleAmbienteFilter,
    selectSingleAmbiente,
    clearAmbienteFilter,
    allAmbientes,
    addTagToOrder,
    removeTagFromOrder,
    toggleTagOnOrder,
    isLoading,
    dataSource,
    syncError,
    setSyncError,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    metrics,
    createOrder,
    updateOrder: updateOrderData,
    deleteOrder: removeOrder,
    updateCutPlan,
    addItemPlanta,
    updateItemPlanta,
    removeItemPlanta,
    cycleItemPlantaStatus,
    addMaterialItem,
    updateMaterialItem,
    removeMaterialItem,
    cycleMaterialStatus,
    changeOSStatus,
    refreshOrders: loadOrders,
  };
}
