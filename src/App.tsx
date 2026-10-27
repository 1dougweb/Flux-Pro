import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useOrders } from './hooks/useOrders';
import { useAuth } from './hooks/useAuth';
import { ModernSidebar } from './components/layout/ModernSidebar';
import { ModernTopbar } from './components/layout/ModernTopbar';
import { CommandPalette } from './components/command/CommandPalette';
import { ProjectsDashboard } from './components/projects/ProjectsDashboard';
import { ProjectWorkspace } from './components/projects/ProjectWorkspace';
import { ProjectCreateModal } from './components/projects/ProjectCreateModal';
import { OSKanban } from './components/os/OSKanban';
import { SupabaseModal } from './components/settings/SupabaseModal';
import { FileManagerModal } from './components/assets/FileManagerModal';
import { AuthModal, AuthMode } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { OrdemServico, OSStatus } from './types';
import { AlertTriangle, X } from 'lucide-react';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    orders,
    filteredOrders,
    selectedOrder,
    setSelectedOrderId,
    selectedTag,
    setSelectedTag,
    allTags,
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
    updateOrder,
    deleteOrder,
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
    refreshOrders,
    toggleTagOnOrder,
  } = useOrders();

  const {
    user,
    session,
    loading: authLoading,
    isPasswordRecovery,
    setIsPasswordRecovery,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordResetEmail,
    updatePassword,
    signOut,
    isSupabaseConfigured,
  } = useAuth();

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');

  // Atalho Global de Teclado (Ctrl + K / Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ao criar projeto, navega direto para o workspace do projeto
  const handleCreateProject = async (
    data: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const newOrder = await createOrder(data);
    setSelectedOrderId(newOrder.id);
    return newOrder;
  };

  // 1. Tela de Carregamento da Sessão
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-lg font-mono-code animate-pulse shadow-md">
            FP
          </div>
          <p className="text-xs font-mono-code uppercase tracking-widest text-zinc-400">
            FLUXPRO 2.0 • Carregando Workspace...
          </p>
        </div>
      </div>
    );
  }

  // 2. Tela de Autenticação Segura (sem exposição de configurações do banco)
  if (!user) {
    return (
      <AuthPage
        initialMode={authModalMode}
        onSignInWithEmail={signInWithEmail}
        onSignUpWithEmail={signUpWithEmail}
        onSignInWithGoogle={signInWithGoogle}
        onSendPasswordReset={sendPasswordResetEmail}
        onUpdatePassword={updatePassword}
        theme={theme}
        toggleTheme={toggleTheme}
        isPasswordRecovery={isPasswordRecovery}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
      {/* Alerta de Erro de Sincronização Supabase */}
      {syncError && (
        <div className="bg-amber-100 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Aviso de Conexão:</strong> {syncError}. Os dados permanecem salvos localmente no navegador.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="underline font-semibold hover:opacity-80"
              >
                Configurações
              </button>
              <button
                onClick={() => setSyncError(null)}
                className="p-1 hover:bg-amber-200 dark:hover:bg-amber-900 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topbar Superior */}
      <ModernTopbar
        activeProject={selectedOrder}
        onBackToProjects={() => setSelectedOrderId(null)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        dataSource={dataSource}
      />

      {/* Layout Dividido: Sidebar + Workspace Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Esquerdo de Navegação */}
        <ModernSidebar
          currentFilter={filter}
          setFilter={setFilter}
          activeProjectId={selectedOrder ? selectedOrder.id : null}
          onSelectProject={(id) => setSelectedOrderId(id)}
          orders={orders}
          metrics={metrics}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          user={user}
          onSignOut={signOut}
          selectedTag={selectedTag}
          onSelectTag={(tag) => setSelectedTag(tag)}
          allTags={allTags}
          onOpenFileManager={() => setIsFileManagerOpen(true)}
        />

        {/* Área Principal de Conteúdo */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {selectedOrder ? (
              /* Workspace Focado no Projeto Selecionado */
              <ProjectWorkspace
                order={selectedOrder}
                onBack={() => setSelectedOrderId(null)}
                onUpdateOrder={(id, updates) => {
                  const target = orders.find((o) => o.id === id);
                  if (target) {
                    updateOrder({ ...target, ...updates });
                  }
                }}
                onDeleteOrder={(id) => {
                  deleteOrder(id);
                  setSelectedOrderId(null);
                }}
                onAddItem={(itemData) => addItemPlanta(selectedOrder.id, itemData)}
                onUpdateItem={(itemId, updates) =>
                  updateItemPlanta(selectedOrder.id, itemId, updates)
                }
                onRemoveItem={(itemId) => removeItemPlanta(selectedOrder.id, itemId)}
                onUpdateItemStatus={(itemId, newStatus) =>
                  updateItemPlanta(selectedOrder.id, itemId, { status_item: newStatus })
                }
                onUpdateCutPlan={(planData) => updateCutPlan(selectedOrder.id, planData)}
                onAddMaterial={(matData) => addMaterialItem(selectedOrder.id, matData)}
                onUpdateMaterial={(matId, updates) =>
                  updateMaterialItem(selectedOrder.id, matId, updates)
                }
                onRemoveMaterial={(matId) => removeMaterialItem(selectedOrder.id, matId)}
                onCycleMaterialStatus={(matId) => cycleMaterialStatus(selectedOrder.id, matId)}
              />
            ) : filter === 'kanban' ? (
              /* Visão Global em Quadro Kanban */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Quadro Geral de Produção
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Fluxo de todas as obras ativas por fase de entrega
                    </p>
                  </div>
                  <button
                    onClick={() => setFilter('todas')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    ← Voltar para Hub de Projetos
                  </button>
                </div>

                <OSKanban
                  orders={filteredOrders}
                  onSelectOrder={(order) => setSelectedOrderId(order.id)}
                  onChangeStatus={changeOSStatus}
                  selectedTag={selectedTag}
                  onSelectTag={(tag) => setSelectedTag(tag)}
                  allTags={allTags}
                  onToggleTag={toggleTagOnOrder}
                />
              </div>
            ) : (
              /* Hub Central de Gestão de Projetos (Dashboard) */
              <ProjectsDashboard
                orders={filteredOrders}
                onOpenProject={(id) => setSelectedOrderId(id)}
                onNewProject={() => setIsNewProjectModalOpen(true)}
                onChangeStatus={changeOSStatus}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedTag={selectedTag}
                onClearTag={() => setSelectedTag(null)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Paleta de Comandos Global (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        orders={orders}
        onSelectProject={(id) => setSelectedOrderId(id)}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        onSelectFilter={(f) => {
          setSelectedOrderId(null);
          setFilter(f);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenFileManager={() => setIsFileManagerOpen(true)}
      />

      {/* Modal Ágil de Criação de Projeto */}
      <ProjectCreateModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* Modal de Gestão Central de Arquivos & Biblioteca */}
      <FileManagerModal
        isOpen={isFileManagerOpen}
        onClose={() => setIsFileManagerOpen(false)}
        projectId={selectedOrder?.id}
      />

      {/* Modal de Configurações de Banco / Supabase */}
      {isSettingsModalOpen && (
        <SupabaseModal
          onClose={() => setIsSettingsModalOpen(false)}
          onConfigSaved={refreshOrders}
        />
      )}
    </div>
  );
}

export default App;
