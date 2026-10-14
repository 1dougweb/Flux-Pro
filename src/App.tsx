import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useOrders } from './hooks/useOrders';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardMetrics } from './components/dashboard/DashboardMetrics';
import { OSList } from './components/os/OSList';
import { OSKanban } from './components/os/OSKanban';
import { OSDetailPage } from './components/os/OSDetailPage';
import { OSFormModal } from './components/os/OSFormModal';
import { SupabaseModal } from './components/settings/SupabaseModal';
import { AuthModal, AuthMode } from './components/auth/AuthModal';
import { OrdemServico, OSStatus } from './types';
import {
  Kanban,
  ListFilter,
  AlertTriangle,
  X,
  User as UserIcon,
} from 'lucide-react';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    orders,
    filteredOrders,
    allItensPlanta,
    selectedOrder,
    setSelectedOrderId,
    selectedTag,
    setSelectedTag,
    allTags,
    selectedAmbientes,
    toggleAmbienteFilter,
    selectSingleAmbiente,
    clearAmbienteFilter,
    allAmbientes,
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
  } = useOrders();

  const {
    user,
    session,
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

  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');

  // Abre automaticamente o modal de redefinicao se o usuario acessou via link de recuperacao
  useEffect(() => {
    if (isPasswordRecovery) {
      setAuthModalMode('reset_password');
      setIsAuthModalOpen(true);
    }
  }, [isPasswordRecovery]);

  // Ao criar a OS, navega diretamente para a página dedicada da obra
  const handleCreateOrder = async (
    data: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const newOrder = await createOrder(data);
    setSelectedOrderId(newOrder.id);
    return newOrder;
  };

  return (
    <div className="min-h-screen bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text flex flex-col font-sans transition-colors duration-150">
      
      {/* Barra de Navegação Superior */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNewOSModal={() => setIsNewOSModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        dataSource={dataSource}
        user={user}
        onOpenAuthModal={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenResetPasswordModal={() => {
          setAuthModalMode('reset_password');
          setIsAuthModalOpen(true);
        }}
        onSignOut={signOut}
        isSupabaseConfigured={isSupabaseConfigured}
      />

      {/* Banner de Acesso Convidado (Discreto quando nao autenticado) */}
      {!user && (
        <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-light-border dark:border-dark-border px-4 py-1.5 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span>
                Navegando como convidado. Faca login ou conecte o Google para salvar na nuvem.
              </span>
            </div>
            <button
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="underline font-semibold text-light-text dark:text-dark-text hover:opacity-80"
            >
              Entrar / Cadastrar
            </button>
          </div>
        </div>
      )}

      {/* Alerta de Erro de Sincronização Supabase */}
      {syncError && (
        <div className="bg-amber-100 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Aviso de Banco:</strong> {syncError}. Os dados continuam salvos no navegador.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="underline font-semibold hover:opacity-80"
              >
                Diagnosticar Banco
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

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedOrder ? (
          /* Página Dedicada da Obra (OS) com Sidebar Interno de Ambientes e Edição no Lápis */
          <OSDetailPage
            order={selectedOrder}
            onBack={() => setSelectedOrderId(null)}
            onUpdateCutPlan={updateCutPlan}
            onAddItemPlanta={addItemPlanta}
            onUpdateItemPlanta={updateItemPlanta}
            onRemoveItemPlanta={removeItemPlanta}
            onCycleItemPlantaStatus={cycleItemPlantaStatus}
            onAddMaterial={addMaterialItem}
            onUpdateMaterial={updateMaterialItem}
            onRemoveMaterial={removeMaterialItem}
            onCycleMaterialStatus={cycleMaterialStatus}
            onChangeStatus={changeOSStatus}
            onUpdateOrder={updateOrder}
          />
        ) : (
          <>
            {/* Painel Superior de Métricas Antiesquecimento */}
            <DashboardMetrics
              metrics={metrics}
              currentFilter={filter}
              setFilter={setFilter}
            />

            {/* Corpo: Barra Lateral e Lista de OS */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Menu Lateral de Filtros */}
              <Sidebar
                currentFilter={filter}
                setFilter={setFilter}
                metrics={metrics}
                allTags={allTags}
                selectedTag={selectedTag}
                onSelectTag={(tag) => setSelectedTag(tag)}
              />

              {/* Área Principal de Conteúdo */}
              <div className="flex-1 min-w-0">
                
                {/* Barra de Controle de Visualização */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-light-border dark:border-dark-border">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-light-text dark:text-dark-text">
                      {filter === 'kanban'
                        ? 'Fluxo da Produção (Kanban de Obras)'
                        : filter === 'corte_pendente'
                        ? 'Obras com Planos de Corte Pendentes'
                        : filter === 'separacao_pendente'
                        ? 'Obras com Separação de Materiais Pendente'
                        : filter === 'urgentes_atrasadas'
                        ? 'Obras com Prazos Críticos ou Atrasados'
                        : filter === 'em_producao'
                        ? 'Obras em Linha de Produção'
                        : 'Todas as Obras (Ordens de Serviço)'}
                    </h2>
                    <span className="font-mono-code text-xs px-2 py-0.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-neutral-600 dark:text-neutral-400">
                      {filteredOrders.length} {filteredOrders.length === 1 ? 'Obra' : 'Obras'}
                    </span>

                    {/* Indicador de Tag Ativa com 1 clique para remover */}
                    {selectedTag && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black text-xs font-mono-code font-bold animate-in fade-in">
                        <span>Tag: #{selectedTag}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTag(null)}
                          className="hover:opacity-70 ml-1 text-xs"
                          title="Limpar filtro de tag"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Toggle Rápido Lista / Kanban */}
                  <div className="flex items-center gap-1 bg-light-surface dark:bg-dark-surface p-1 rounded border border-light-border dark:border-dark-border">
                    <button
                      onClick={() => setFilter('todas')}
                      className={`p-1.5 rounded transition-colors ${
                        filter !== 'kanban'
                          ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                          : 'text-neutral-500 hover:text-black dark:hover:text-white'
                      }`}
                      title="Visualização em Lista de Obras"
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setFilter('kanban')}
                      className={`p-1.5 rounded transition-colors ${
                        filter === 'kanban'
                          ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                          : 'text-neutral-500 hover:text-black dark:hover:text-white'
                      }`}
                      title="Visualização em Quadro Kanban"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo: Kanban de Obras ou Lista de Obras (com Itens Expandíveis) */}
                {filter === 'kanban' ? (
                  <OSKanban
                    orders={filteredOrders}
                    onSelectOrder={(order) => setSelectedOrderId(order.id)}
                    onChangeStatus={changeOSStatus}
                    selectedTag={selectedTag}
                    onSelectTag={(tag) => setSelectedTag(tag === selectedTag ? null : tag)}
                  />
                ) : (
                  <OSList
                    orders={filteredOrders}
                    onSelectOrder={(order) => setSelectedOrderId(order.id)}
                    onDeleteOrder={deleteOrder}
                    selectedTag={selectedTag}
                    onSelectTag={(tag) => setSelectedTag(tag === selectedTag ? null : tag)}
                    onAddItemPlanta={addItemPlanta}
                    onUpdateItemPlanta={updateItemPlanta}
                    onRemoveItemPlanta={removeItemPlanta}
                    onCycleItemPlantaStatus={cycleItemPlantaStatus}
                  />
                )}

              </div>
            </div>
          </>
        )}
      </main>

      {/* Rodapé Simples e Técnico */}
      <footer className="border-t border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-light-muted dark:text-dark-muted gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono-code font-bold text-light-text dark:text-dark-text">FLUXPRO v1.1</span>
            <span>•</span>
            <span>Itens da Planta, Cortes e Produção para Projetistas</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-light-text dark:hover:text-dark-text transition-colors underline underline-offset-2"
            >
              Configurar Supabase
            </button>
            <span>•</span>
            <span>React + TypeScript + Vercel</span>
          </div>
        </div>
      </footer>

      {/* Modal de Abertura de Nova OS */}
      {isNewOSModalOpen && (
        <OSFormModal
          onClose={() => setIsNewOSModalOpen(false)}
          onCreateOrder={handleCreateOrder}
          existingOrdersCount={orders.length}
        />
      )}

      {/* Modal de Configuração do Supabase */}
      {isSettingsModalOpen && (
        <SupabaseModal
          onClose={() => setIsSettingsModalOpen(false)}
          onConfigSaved={refreshOrders}
        />
      )}

      {/* Modal de Autenticação (Login, Cadastro, Recuperação e Google Auth) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => {
          setIsAuthModalOpen(false);
          setIsPasswordRecovery(false);
        }}
        onSignInWithEmail={signInWithEmail}
        onSignUpWithEmail={signUpWithEmail}
        onSignInWithGoogle={signInWithGoogle}
        onSendPasswordReset={sendPasswordResetEmail}
        onUpdatePassword={updatePassword}
        isSupabaseConfigured={isSupabaseConfigured}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

    </div>
  );
}
export default App;
