import React, { useState } from 'react';
import {
  FolderKanban,
  LayoutGrid,
  List,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Scissors,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { OrdemServico, OSStatus, OSPrioridade } from '../../types';
import { ProjectCard } from './ProjectCard';
import {
  mapOSStatusToModern,
  mapPriorityStyle,
  getProjectHealth,
  calculateProjectProgress,
} from '../../types/project';

interface ProjectsDashboardProps {
  orders: OrdemServico[];
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
  onChangeStatus: (id: string, newStatus: OSStatus) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTag: string | null;
  onClearTag: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  orders,
  onOpenProject,
  onNewProject,
  onChangeStatus,
  searchQuery,
  setSearchQuery,
  selectedTag,
  onClearTag,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'priority'>('dueDate');

  // Métricas rápidas do dashboard
  const activeOrders = orders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado');
  const completedOrders = orders.filter((o) => o.status === 'entregue');
  const criticalOrders = orders.filter((o) => {
    if (o.status === 'entregue' || o.status === 'cancelado') return false;
    const health = getProjectHealth(o);
    return health.health === 'delayed' || health.health === 'at_risk';
  });
  const cuttingPendingOrders = orders.filter(
    (o) =>
      o.status !== 'entregue' &&
      o.status !== 'cancelado' &&
      (!o.plano_corte || o.plano_corte.status_corte !== 'conferido')
  );

  // Filtragem dos projetos
  const filteredOrders = orders.filter((order) => {
    // Filtro de texto
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.nome_projeto.toLowerCase().includes(q) ||
      order.cliente.toLowerCase().includes(q) ||
      order.numero_os.toLowerCase().includes(q) ||
      order.tags?.some((t) => t.toLowerCase().includes(q));

    // Filtro de tag ativa
    const matchesTag = !selectedTag || order.tags?.includes(selectedTag);

    // Filtro de status
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? order.status !== 'entregue' && order.status !== 'cancelado'
        : order.status === statusFilter;

    // Filtro de prioridade
    const matchesPriority =
      priorityFilter === 'all' ? true : order.prioridade === priorityFilter;

    return matchesSearch && matchesTag && matchesStatus && matchesPriority;
  });

  // Ordenação
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return a.previsao_entrega.localeCompare(b.previsao_entrega);
    }
    if (sortBy === 'title') {
      return a.nome_projeto.localeCompare(b.nome_projeto);
    }
    const priorityWeight: Record<OSPrioridade, number> = {
      urgente: 4,
      alta: 3,
      normal: 2,
      baixa: 1,
    };
    return (priorityWeight[b.prioridade] || 0) - (priorityWeight[a.prioridade] || 0);
  });

  return (
    <div className="space-y-6">
      {/* 1. Métricas Rápidas Estilo Linear / Monday */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-xs font-medium">Projetos Ativos</span>
            <FolderKanban className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-zinc-900 dark:text-zinc-100">
            {activeOrders.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Em linha de execução</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-xs font-medium">Prazos em Atenção</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-amber-600 dark:text-amber-400">
            {criticalOrders.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Atrasados ou entrega próxima</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-xs font-medium">Cortes & CNC</span>
            <Scissors className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-purple-600 dark:text-purple-400">
            {cuttingPendingOrders.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Com liberação pendente</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-xs font-medium">Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-emerald-600 dark:text-emerald-400">
            {completedOrders.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Entregues com sucesso</p>
        </div>
      </div>

      {/* 2. Barra de Controle: Filtros, Pesquisa e Alternador Grid/Lista */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Campo de Busca e Tags */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por projeto, cliente, OS..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {selectedTag && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono-code font-medium">
              <span>#{selectedTag}</span>
              <button onClick={onClearTag} className="hover:opacity-75">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Somente Ativos</option>
            <option value="medicao_visita">Medição & Visita</option>
            <option value="layout_aprovado">Layout Aprovado</option>
            <option value="corte_pendente">Corte Pendente</option>
            <option value="separacao_pendente">Separação de Materiais</option>
            <option value="em_producao">Em Produção</option>
            <option value="pronto_entrega">Pronto / Instalação</option>
            <option value="entregue">Concluídos</option>
          </select>

          {/* Filtro de Prioridade */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>

        {/* Lado Direito: Alternador de Visualização (Cards vs Lista) */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Visualização em Tabela / Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Projeto</span>
          </button>
        </div>
      </div>

      {/* 3. Conteúdo Principal: Grid de Cards ou Tabela */}
      {sortedOrders.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
          <FolderKanban className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Nenhum projeto encontrado
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
            Não encontramos nenhum projeto com os filtros selecionados. Crie um novo projeto ou limpe os filtros.
          </p>
          <button
            onClick={onNewProject}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Projeto</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Modo Grid de Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sortedOrders.map((order) => (
            <ProjectCard
              key={order.id}
              order={order}
              onOpen={onOpenProject}
            />
          ))}
        </div>
      ) : (
        /* Modo Tabela / Spreadsheet Interativa Estilo Linear & Monday */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-mono-code uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Código</th>
                  <th className="py-3 px-4 font-semibold">Projeto & Cliente</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Prioridade</th>
                  <th className="py-3 px-4 font-semibold">Prazo de Entrega</th>
                  <th className="py-3 px-4 font-semibold">Progresso</th>
                  <th className="py-3 px-4 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                {sortedOrders.map((order) => {
                  const statusInfo = mapOSStatusToModern(order.status);
                  const priorityInfo = mapPriorityStyle(order.prioridade);
                  const healthInfo = getProjectHealth(order);
                  const progress = calculateProjectProgress(order);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onOpenProject(order.id)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-850/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono-code font-bold text-zinc-900 dark:text-zinc-100">
                        {order.numero_os}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {order.nome_projeto}
                        </div>
                        <div className="text-zinc-400 text-[11px]">{order.cliente}</div>
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => onChangeStatus(order.id, e.target.value as OSStatus)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-full border focus:outline-none cursor-pointer ${statusInfo.badgeClass}`}
                        >
                          <option value="medicao_visita">Medição & Visita</option>
                          <option value="layout_aprovado">Layout Aprovado</option>
                          <option value="corte_pendente">Corte Pendente</option>
                          <option value="separacao_pendente">Separação Materiais</option>
                          <option value="em_producao">Em Produção</option>
                          <option value="pronto_entrega">Pronto / Instalação</option>
                          <option value="entregue">Entregue</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded border ${priorityInfo.badgeClass}`}
                        >
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded border ${healthInfo.badgeClass}`}
                        >
                          {order.previsao_entrega} ({healthInfo.label})
                        </span>
                      </td>
                      <td className="py-3 px-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="font-mono-code text-[11px] text-zinc-500 font-medium">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenProject(order.id)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Abrir →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
