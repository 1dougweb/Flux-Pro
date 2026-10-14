-- ============================================================
-- FLUXPRO - SISTEMA DE GESTAO DE PROJETOS E PRODUCAO (OS)
-- Especializado para Comunicacao Visual, Fachadas e Router CNC
-- Banco de Dados Supabase (PostgreSQL)
-- ============================================================

-- ============================================================
-- SECAO 1: CRIACAO DAS TABELAS (Caso ainda nao existam)
-- ============================================================

-- 1. Tabela de Ordens de Servico (OS)
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
    tags TEXT[] DEFAULT '{}',
    ambientes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Itens da Planta / Obra (Pecas, Fotos e Arquivos de Corte CNC)
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
    status_corte VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (
        status_corte IN ('pendente', 'cortado', 'liberado')
    ),
    status_item VARCHAR(30) NOT NULL DEFAULT 'corte_pendente',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Planos de Corte
CREATE TABLE IF NOT EXISTS planos_corte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    status_corte VARCHAR(30) NOT NULL DEFAULT 'nao_iniciado' CHECK (
        status_corte IN (
            'nao_iniciado',
            'em_otimizacao',
            'gerado',
            'conferido',
            'enviado_producao'
        )
    ),
    software_origem VARCHAR(50) DEFAULT 'ArtCAM',
    maquina_principal VARCHAR(100) DEFAULT 'Router CNC',
    arquivo_ou_link TEXT,
    total_chapas INTEGER DEFAULT 0,
    especificacao_chapas TEXT,
    metros_vinil_lona NUMERIC(10, 2) DEFAULT 0.00,
    metros_fita_borda NUMERIC(10, 2) DEFAULT 0.00,
    gabarito_pronto BOOLEAN DEFAULT false,
    fita_engrossada BOOLEAN DEFAULT false,
    aprovado_producao BOOLEAN DEFAULT false,
    data_conferencia TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_plano_os UNIQUE (os_id)
);

-- 4. Tabela de Itens de Materiais e Ferragens
CREATE TABLE IF NOT EXISTS itens_material (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    item_planta_id UUID REFERENCES itens_planta(id) ON DELETE SET NULL,
    categoria VARCHAR(30) NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unidade VARCHAR(20) NOT NULL DEFAULT 'un',
    status_separacao VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (
        status_separacao IN (
            'pendente',
            'separado',
            'falta_comprar',
            'consumido'
        )
    ),
    localizacao_estoque VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Historico / Linha do Tempo da OS
CREATE TABLE IF NOT EXISTS historico_os (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    etapa VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    autor VARCHAR(100) DEFAULT 'Projetista',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- SECAO 2: ATUALIZACAO / MIGRACAO DE TABELAS JA EXISTENTES
-- (Execute este bloco se voce ja havia criado as tabelas antes)
-- ============================================================

-- A. Atualizar check constraint de status em ordens_servico
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;
ALTER TABLE ordens_servico ADD CONSTRAINT ordens_servico_status_check CHECK (
    status IN (
        'rascunho',
        'medicao_visita',
        'layout_aprovado',
        'corte_pendente',
        'separacao_pendente',
        'em_producao',
        'pronto_entrega',
        'entregue',
        'cancelado',
        'projeto_aprovado'
    )
);
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS ambientes TEXT[] DEFAULT '{}';

-- B. Atualizar colunas de planos_corte para Comunicacao Visual
ALTER TABLE planos_corte ADD COLUMN IF NOT EXISTS maquina_principal VARCHAR(100) DEFAULT 'Router CNC';
ALTER TABLE planos_corte ADD COLUMN IF NOT EXISTS metros_vinil_lona NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE planos_corte ADD COLUMN IF NOT EXISTS gabarito_pronto BOOLEAN DEFAULT false;

-- C. Atualizar colunas de itens_planta para Comunicacao Visual
ALTER TABLE itens_planta ADD COLUMN IF NOT EXISTS tipo_elemento VARCHAR(100);
ALTER TABLE itens_planta ADD COLUMN IF NOT EXISTS maquina_corte VARCHAR(50) DEFAULT 'router_cnc';
ALTER TABLE itens_planta ADD COLUMN IF NOT EXISTS iluminado BOOLEAN DEFAULT false;
ALTER TABLE itens_planta ADD COLUMN IF NOT EXISTS gabarito_gerado BOOLEAN DEFAULT false;
ALTER TABLE itens_planta DROP CONSTRAINT IF EXISTS itens_planta_status_item_check;
ALTER TABLE itens_planta ADD CONSTRAINT itens_planta_status_item_check CHECK (
    status_item IN ('layout', 'projeto', 'corte_pendente', 'em_producao', 'teste_eletrico', 'pronto_instalacao', 'instalado', 'montado')
);

-- D. Atualizar categorias de itens_material para Comunicacao Visual
ALTER TABLE itens_material DROP CONSTRAINT IF EXISTS itens_material_categoria_check;
ALTER TABLE itens_material ADD CONSTRAINT itens_material_categoria_check CHECK (
    categoria IN (
        'chapa',
        'vinil_lona',
        'iluminacao',
        'estrutura',
        'fixacao_quimica',
        'gabarito',
        'fita_borda',
        'ferragem',
        'fixacao',
        'acessorio',
        'outro'
    )
);
ALTER TABLE itens_material ADD COLUMN IF NOT EXISTS item_planta_id UUID REFERENCES itens_planta(id) ON DELETE SET NULL;

-- ============================================================
-- SECAO 3: INDICES PARA ALTA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_os_numero ON ordens_servico(numero_os);
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_previsao ON ordens_servico(previsao_entrega);
CREATE INDEX IF NOT EXISTS idx_itens_planta_os ON itens_planta(os_id);
CREATE INDEX IF NOT EXISTS idx_plano_os_id ON planos_corte(os_id);
CREATE INDEX IF NOT EXISTS idx_materiais_os_id ON itens_material(os_id);
CREATE INDEX IF NOT EXISTS idx_historico_os_id ON historico_os(os_id);

-- ============================================================
-- SECAO 4: HABILITAR RLS E LIBERAR ACESSO PUBLICO / ANONIMO
-- ============================================================
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
CREATE POLICY "Permissao total anonima historico_os" ON historico_os FOR ALL USING (true) WITH CHECK (true);
