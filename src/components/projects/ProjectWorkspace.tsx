import React, { useState } from 'react';
import {
  ArrowLeft,
  Kanban,
  List,
  Scissors,
  Package,
  FileText,
  Calendar,
  User,
  Phone,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';
import {
  OrdemServico,
  ItemPlanta,
  ItemMaterial,
  PlanoCorte,
  OSStatus,
  OSPrioridade,
  StatusItemObra,
} from '../../types';
import {
  mapOSStatusToModern,
  mapPriorityStyle,
  getProjectHealth,
  calculateProjectProgress,
} from '../../types/project';
import { ProjectTaskBoard } from '../tasks/ProjectTaskBoard';
import { ProjectTaskList } from '../tasks/ProjectTaskList';
import { TaskDrawer } from '../tasks/TaskDrawer';
import { ProjectFilesHub } from '../assets/ProjectFilesHub';
import { ProjectMaterialsHub } from '../materials/ProjectMaterialsHub';
import { ProjectEditModal } from './ProjectEditModal';

interface ProjectWorkspaceProps {
  order: OrdemServico;
  onBack: () => void;
  onUpdateOrder: (id: string, updates: Partial<OrdemServico>) => void;
  onDeleteOrder?: (id: string) => void;
  // Ações de itens de planta / tarefas
  onAddItem: (item: Omit<ItemPlanta, 'id' | 'created_at'>) => void;
  onUpdateItem: (id: string, updates: Partial<ItemPlanta>) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItemStatus: (id: string, newStatus: StatusItemObra) => void;
  // Ações de plano de corte
  onUpdateCutPlan: (plan: Partial<PlanoCorte>) => void;
  // Ações de materiais
  onAddMaterial: (mat: Omit<ItemMaterial, 'id' | 'created_at'>) => void;
  onUpdateMaterial: (id: string, updates: Partial<ItemMaterial>) => void;
  onRemoveMaterial: (id: string) => void;
  onCycleMaterialStatus: (id: string) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  order,
  onBack,
  onUpdateOrder,
  onDeleteOrder,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onUpdateItemStatus,
  onUpdateCutPlan,
  onAddMaterial,
  onUpdateMaterial,
  onRemoveMaterial,
  onCycleMaterialStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'files' | 'materials' | 'overview'>('board');
  const [selectedTask, setSelectedTask] = useState<ItemPlanta | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAmbiente, setSelectedAmbiente] = useState<string | null>(null);

  const statusInfo = mapOSStatusToModern(order.status);
  const priorityInfo = mapPriorityStyle(order.prioridade);
  const healthInfo = getProjectHealth(order);
  const progress = calculateProjectProgress(order);

  const items = order.itens_planta || [];
  const materials = order.materiais || [];
  const ambientes = order.ambientes || [];

  // Itens filtrados pelo chip de ambiente selecionado
  const displayedItems = selectedAmbiente
    ? items.filter((it) => it.ambiente === selectedAmbiente)
    : items;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header do Workspace do Projeto */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors shrink-0 mt-0.5"
              title="Voltar para Todos os Projetos"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono-code text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {order.numero_os}
                </span>

                {/* Seletor de Status Direto */}
                <select
                  value={order.status}
                  onChange={(e) => onUpdateOrder(order.id, { status: e.target.value as OSStatus })}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${statusInfo.badgeClass}`}
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

                {/* Prioridade */}
                <select
                  value={order.prioridade}
                  onChange={(e) =>
                    onUpdateOrder(order.id, { prioridade: e.target.value as OSPrioridade })
                  }
                  className={`text-xs font-semibold px-2 py-0.5 rounded border cursor-pointer focus:outline-none ${priorityInfo.badgeClass}`}
                >
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>

                {/* Botão de Edição Completa dos Dados */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors ml-1"
                  title="Editar dados da obra"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Título do Projeto */}
              <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {order.nome_projeto}
              </h1>

              {/* Metadados: Cliente e Prazos */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  {order.cliente}
                </span>

                {order.telefone_cliente && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    {order.telefone_cliente}
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Entrega: {order.previsao_entrega}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${healthInfo.badgeClass}`}
                  >
                    {healthInfo.label}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Barra de Progresso e Ações */}
          <div className="flex items-center gap-3">
            <div className="w-full md:w-52 shrink-0 bg-zinc-50 dark:bg-zinc-850 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-500 font-medium text-[11px]">Progresso Geral</span>
                <span className="font-mono-code font-bold text-zinc-800 dark:text-zinc-200">
                  {progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progress === 100
                      ? 'bg-emerald-500'
                      : progress >= 60
                      ? 'bg-blue-600'
                      : 'bg-zinc-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {onDeleteOrder && (
              <button
                onClick={() => {
                  if (confirm(`Tem certeza que deseja excluir a obra ${order.numero_os} (${order.nome_projeto})?`)) {
                    onDeleteOrder(order.id);
                  }
                }}
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                title="Excluir Obra"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Barra de Abas (Tabs) Estilo Linear & Monday */}
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'board'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Quadro Kanban</span>
              <span
                className={`font-mono-code text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'board'
                    ? 'bg-zinc-800 text-white dark:bg-zinc-300 dark:text-zinc-900'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'list'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista de Tarefas</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'files'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Arquivos & CNC</span>
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'materials'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Materiais & Insumos</span>
              {materials.length > 0 && (
                <span
                  className={`font-mono-code text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'materials'
                      ? 'bg-zinc-800 text-white dark:bg-zinc-300 dark:text-zinc-900'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {materials.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Visão Geral & Briefing</span>
            </button>
          </div>

          {/* Chips de Filtro por Ambiente (visíveis nas abas de Quadro e Lista) */}
          {(activeTab === 'board' || activeTab === 'list') && ambientes.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              <span className="text-[10px] text-zinc-400 font-mono-code uppercase mr-1">
                Ambiente:
              </span>
              <button
                onClick={() => setSelectedAmbiente(null)}
                className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                  selectedAmbiente === null
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                Todos ({items.length})
              </button>
              {ambientes.map((amb) => {
                const count = items.filter((it) => it.ambiente === amb).length;
                const isSelected = selectedAmbiente === amb;
                return (
                  <button
                    key={amb}
                    onClick={() => setSelectedAmbiente(isSelected ? null : amb)}
                    className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    {amb} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Área de Conteúdo da Aba Ativa */}
      <div>
        {activeTab === 'board' && (
          <ProjectTaskBoard
            items={items}
            onOpenTask={(task) => setSelectedTask(task)}
            onAddTask={(taskData) =>
              onAddItem({
                os_id: order.id,
                codigo: taskData.codigo || 'PC-01',
                nome: taskData.nome || 'Nova Peça',
                quantidade: 1,
                status_corte: 'pendente',
                status_item: taskData.status_item || 'layout',
                ambiente: selectedAmbiente || taskData.ambiente || 'Geral',
                maquina_corte: taskData.maquina_corte || 'router_cnc',
                ...taskData,
              })
            }
            onUpdateStatus={onUpdateItemStatus}
            ambientes={order.ambientes}
            selectedAmbienteFilter={selectedAmbiente}
          />
        )}

        {activeTab === 'list' && (
          <ProjectTaskList
            items={displayedItems}
            onOpenTask={(task) => setSelectedTask(task)}
            onAddTask={(taskData) =>
              onAddItem({
                os_id: order.id,
                codigo: taskData.codigo || 'PC-01',
                nome: taskData.nome || 'Nova Peça',
                quantidade: 1,
                status_corte: 'pendente',
                status_item: taskData.status_item || 'layout',
                ambiente: selectedAmbiente || taskData.ambiente || 'Geral',
                maquina_corte: taskData.maquina_corte || 'router_cnc',
                ...taskData,
              })
            }
            onUpdateStatus={onUpdateItemStatus}
            onDeleteTask={onRemoveItem}
            ambientes={order.ambientes}
          />
        )}

        {activeTab === 'files' && (
          <ProjectFilesHub
            items={items}
            planoCorte={order.plano_corte}
            onUpdatePlanoCorte={onUpdateCutPlan}
            onUpdateItem={onUpdateItem}
          />
        )}

        {activeTab === 'materials' && (
          <ProjectMaterialsHub
            materials={materials}
            onAddMaterial={(mat) =>
              onAddMaterial({
                ...mat,
                os_id: order.id,
              })
            }
            onUpdateMaterial={onUpdateMaterial}
            onRemoveMaterial={onRemoveMaterial}
            onCycleStatus={onCycleMaterialStatus}
          />
        )}

        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Briefing & Instruções da Obra
              </h3>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Editar
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {order.observacoes || 'Nenhuma instrução adicional cadastrada para esta obra.'}
            </p>

            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Ambientes Cadastrados
              </h3>
              <div className="flex flex-wrap gap-2">
                {order.ambientes && order.ambientes.length > 0 ? (
                  order.ambientes.map((amb) => (
                    <span
                      key={amb}
                      className="text-xs px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                    >
                      {amb}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400">Nenhum ambiente isolado</span>
                )}
              </div>
            </div>

            {order.historico && order.historico.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                  Histórico de Atividades
                </h3>
                <div className="space-y-2 border-l-2 border-zinc-200 dark:border-zinc-800 pl-3">
                  {order.historico.map((h) => (
                    <div key={h.id} className="text-xs">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {h.etapa}:
                      </span>{' '}
                      <span className="text-zinc-600 dark:text-zinc-400">{h.descricao}</span>
                      <span className="text-[10px] text-zinc-400 ml-2">({h.created_at})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Peek Drawer Lateral para Editar Tarefas Sem Sair da Tela */}
      <TaskDrawer
        item={selectedTask}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onUpdate={onUpdateItem}
        onDelete={(id) => {
          onRemoveItem(id);
          setSelectedTask(null);
        }}
      />

      {/* 5. Modal de Edição Geral da Obra */}
      <ProjectEditModal
        order={order}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(updates) => onUpdateOrder(order.id, updates)}
      />
    </div>
  );
};
