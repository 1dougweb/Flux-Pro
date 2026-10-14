import React, { useState } from 'react';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  isSupabaseConfigured,
} from '../../lib/supabase';
import {
  testSupabaseHealth,
  syncAllLocalToSupabase,
} from '../../lib/storage';
import {
  X,
  Database,
  Check,
  Copy,
  Activity,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface SupabaseModalProps {
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copied, setCopied] = useState(false);
  const isOnline = isSupabaseConfigured();

  // Estados de teste e sincronizacao
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    ok: boolean;
    message: string;
    details?: Record<string, boolean | string>;
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig(url.trim(), anonKey.trim());
    onConfigSaved();
    onClose();
  };

  const handleDisconnect = () => {
    if (confirm('Deseja desconectar o Supabase e voltar para o banco local no navegador?')) {
      setSupabaseConfig('', '');
      setUrl('');
      setAnonKey('');
      onConfigSaved();
      onClose();
    }
  };

  const handleRunDiagnostics = async () => {
    setIsDiagnosing(true);
    setDiagnosticResult(null);
    try {
      const res = await testSupabaseHealth();
      setDiagnosticResult(res);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const { success, errors } = await syncAllLocalToSupabase();
      if (errors.length === 0) {
        setSyncFeedback(`Sucesso! ${success} ${success === 1 ? 'OS sincronizada' : 'OSs sincronizadas'} no Supabase.`);
        onConfigSaved();
      } else {
        setSyncFeedback(`Sincronizado ${success} itens com ${errors.length} avisos.`);
      }
    } catch (err) {
      setSyncFeedback(`Falha ao sincronizar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    const sqlScript = `-- ============================================================
-- FLUXPRO - TABELAS E MIGRACAO PARA SUPABASE (COMUNICACAO VISUAL)
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ============================================================

-- 1. Tabela de Ordens de Servico
CREATE TABLE IF NOT EXISTS ordens_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_os VARCHAR(30) NOT NULL UNIQUE,
    cliente VARCHAR(150) NOT NULL,
    telefone_cliente VARCHAR(30),
    nome_projeto VARCHAR(200) NOT NULL,
    ambiente VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'layout_aprovado',
    prioridade VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (
        prioridade IN ('baixa', 'normal', 'alta', 'urgente')
    ),
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    previsao_entrega DATE NOT NULL,
    observacoes TEXT,
    valor_total NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Itens da Planta / Obra
CREATE TABLE IF NOT EXISTS itens_planta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    ambiente VARCHAR(100),
    tipo_elemento VARCHAR(100),
    maquina_corte VARCHAR(50) DEFAULT 'router_cnc',
    largura_mm INTEGER,
    altura_mm INTEGER,
    profundidade_mm INTEGER,
    quantidade INTEGER NOT NULL DEFAULT 1,
    material_principal VARCHAR(200),
    iluminado BOOLEAN DEFAULT false,
    foto_url TEXT,
    arquivo_corte_nome VARCHAR(200),
    arquivo_corte_url TEXT,
    gabarito_gerado BOOLEAN DEFAULT false,
    status_corte VARCHAR(30) NOT NULL DEFAULT 'pendente',
    status_item VARCHAR(30) NOT NULL DEFAULT 'corte_pendente',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Planos de Corte
CREATE TABLE IF NOT EXISTS planos_corte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    status_corte VARCHAR(30) NOT NULL DEFAULT 'nao_iniciado',
    software_origem VARCHAR(50) DEFAULT 'ArtCAM',
    maquina_principal VARCHAR(100) DEFAULT 'Router CNC',
    arquivo_ou_link TEXT,
    total_chapas INTEGER DEFAULT 0,
    especificacao_chapas TEXT,
    metros_vinil_lona NUMERIC(10, 2) DEFAULT 0.00,
    gabarito_pronto BOOLEAN DEFAULT false,
    aprovado_producao BOOLEAN DEFAULT false,
    data_conferencia TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_plano_os UNIQUE (os_id)
);

-- 4. Tabela de Materiais
CREATE TABLE IF NOT EXISTS itens_material (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    categoria VARCHAR(30) NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unidade VARCHAR(20) NOT NULL DEFAULT 'un',
    status_separacao VARCHAR(30) NOT NULL DEFAULT 'pendente',
    localizacao_estoque VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Historico
CREATE TABLE IF NOT EXISTS historico_os (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    etapa VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    autor VARCHAR(100) DEFAULT 'Projetista',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ATUALIZACAO DE TABELAS JA EXISTENTES (MIGRACAO)
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;
ALTER TABLE ordens_servico ADD CONSTRAINT ordens_servico_status_check CHECK (
    status IN ('rascunho', 'medicao_visita', 'layout_aprovado', 'corte_pendente', 'separacao_pendente', 'em_producao', 'pronto_entrega', 'entregue', 'cancelado', 'projeto_aprovado')
);

ALTER TABLE planos_corte ADD COLUMN IF NOT EXISTS maquina_principal VARCHAR(100) DEFAULT 'Router CNC';
ALTER TABLE planos_corte ADD COLUMN IF NOT EXISTS metros_vinil_lona NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE planos_corte ADD COLUMN IF NOT EXISTS gabarito_pronto BOOLEAN DEFAULT false;

ALTER TABLE itens_planta ADD COLUMN IF NOT EXISTS tipo_elemento VARCHAR(100);
ALTER TABLE itens_planta ADD COLUMN IF NOT EXISTS maquina_corte VARCHAR(50) DEFAULT 'router_cnc';
ALTER TABLE itens_planta ADD COLUMN IF NOT EXISTS iluminado BOOLEAN DEFAULT false;
ALTER TABLE itens_planta ADD COLUMN IF NOT EXISTS gabarito_gerado BOOLEAN DEFAULT false;

ALTER TABLE itens_material DROP CONSTRAINT IF EXISTS itens_material_categoria_check;
ALTER TABLE itens_material ADD CONSTRAINT itens_material_categoria_check CHECK (
    categoria IN ('chapa', 'vinil_lona', 'iluminacao', 'estrutura', 'fixacao_quimica', 'gabarito', 'fita_borda', 'ferragem', 'fixacao', 'acessorio', 'outro')
);

-- RLS E POLICIES
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_planta ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_corte ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_os ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao total anonima ordens_servico" ON ordens_servico;
CREATE POLICY "Permissao total anonima ordens_servico" ON ordens_servico FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao total anonima itens_planta" ON itens_planta;
CREATE POLICY "Permissao total anonima itens_planta" ON itens_planta FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao total anonima planos_corte" ON planos_corte;
CREATE POLICY "Permissao total anonima planos_corte" ON planos_corte FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao total anonima itens_material" ON itens_material;
CREATE POLICY "Permissao total anonima itens_material" ON itens_material FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao total anonima historico_os" ON historico_os;
CREATE POLICY "Permissao total anonima historico_os" ON historico_os FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg w-full max-w-xl overflow-hidden shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="p-4 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-light-text dark:text-dark-text" />
            <h3 className="text-sm font-bold text-light-text dark:text-dark-text">
              Configuração e Diagnóstico do Supabase
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Atual e Ações de Teste */}
        <div className="p-4 bg-light-surface/50 dark:bg-dark-surface/50 border-b border-light-border dark:border-dark-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-light-muted dark:text-dark-muted">Status do Armazenamento:</span>
            {isOnline ? (
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                Conectado ao Supabase
              </span>
            ) : (
              <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Modo Local Ativo (LocalStorage)
              </span>
            )}
          </div>

          {/* Botões de Ação de Banco */}
          {isOnline && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleRunDiagnostics}
                disabled={isDiagnosing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text transition-colors"
              >
                <Activity className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                <span>{isDiagnosing ? 'Testando tabelas...' : 'Diagnosticar Banco'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card hover:bg-neutral-200 dark:hover:bg-neutral-800 text-light-text dark:text-dark-text transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                <span>{isSyncing ? 'Sincronizando...' : 'Enviar Dados Locais para Supabase'}</span>
              </button>
            </div>
          )}

          {/* Resultado do Diagnóstico */}
          {diagnosticResult && (
            <div className={`p-3 rounded border text-xs space-y-1.5 ${
              diagnosticResult.ok
                ? 'border-neutral-300 dark:border-neutral-700 bg-light-surface dark:bg-dark-surface'
                : 'border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                {diagnosticResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span>{diagnosticResult.message}</span>
              </div>
              {diagnosticResult.details && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-1">
                  {Object.entries(diagnosticResult.details).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between border-b border-light-border dark:border-dark-border py-0.5">
                      <span className="text-light-muted dark:text-dark-muted truncate pr-2">{key}:</span>
                      <span className={`font-mono-code font-semibold shrink-0 ${val === 'OK' ? 'text-neutral-900 dark:text-neutral-100' : 'text-amber-600'}`}>
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback de Sincronizacao */}
          {syncFeedback && (
            <div className="p-2.5 rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-xs font-medium text-light-text dark:text-dark-text">
              {syncFeedback}
            </div>
          )}
        </div>

        {/* Formulário de Credenciais */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
              Project URL do Supabase
            </label>
            <input
              type="url"
              placeholder="https://exemplo-projeto.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-light-text dark:text-dark-text">
              Anon Public Key (chave pública do cliente)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono-code rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {/* Botão para copiar Script SQL de Tabelas */}
          <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-light-text dark:text-dark-text">
                Script SQL de Tabelas & Migração
              </p>
              <p className="text-[11px] text-light-muted dark:text-dark-muted">
                Execute no SQL Editor do Supabase se precisar atualizar colunas CNC ou RLS.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>

          {/* Guia de Configuração de Autenticação & Google OAuth */}
          <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface space-y-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <p className="text-xs font-semibold text-light-text dark:text-dark-text">
                Autenticação & Google OAuth no Supabase
              </p>
            </div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted leading-relaxed">
              1. No Supabase, vá em <strong>Authentication &gt; Providers &gt; Google</strong> e habilite.
              <br />
              2. No Google Cloud Console, adicione a Redirect URI: <code className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono-code text-[10px]">{url ? `${url}/auth/v1/callback` : 'https://<seu-projeto>.supabase.co/auth/v1/callback'}</code>
              <br />
              3. Em <strong>Authentication &gt; URL Configuration</strong>, defina seu domínio da Vercel (ex: <code className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono-code text-[10px]">https://seu-app.vercel.app</code>) como <strong>Site URL</strong> e adicione em <strong>Redirect URLs</strong>.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-light-border dark:border-dark-border">
            {isOnline ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-red-600 hover:underline"
              >
                Desconectar Supabase
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium rounded border border-light-border dark:border-dark-border hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
              >
                Salvar Credenciais
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
