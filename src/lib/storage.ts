import { OrdemServico, PlanoCorte, ItemMaterial, ItemPlanta, HistoricoOS } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_KEY = 'fluxpro_orders_data_cv_v1';

// Dados iniciais reais para Projetista de Comunicação Visual
export const SEED_ORDERS: OrdemServico[] = [
  {
    id: 'os-1',
    numero_os: 'OS-2026-001',
    cliente: 'Rede Drogarias Vida Nova',
    telefone_cliente: '(11) 98765-4321',
    nome_projeto: 'Fachada em ACM e Letreiro Caixa com LED',
    ambiente: 'Fachada Principal (Av. Paulista, 1200)',
    ambientes: ['Fachada Principal', 'Recepção / Hall'],
    status: 'corte_pendente',
    prioridade: 'alta',
    data_inicio: '2026-10-10',
    previsao_entrega: '2026-10-18', // 4 dias
    observacoes: 'Fachada com 14 metros lineares. Subestrutura em tubos galvanizados 40x40. Iluminação frontal em LED Branco Frio 6500K com 2 fontes 12V 30A.',
    valor_total: 28500.0,
    tags: ['Fachada ACM', 'Letra Caixa', 'LED 12V', 'Router CNC'],
    created_at: '2026-10-10T09:00:00Z',
    updated_at: '2026-10-14T08:00:00Z',
    plano_corte: {
      id: 'pc-1',
      os_id: 'os-1',
      status_corte: 'nao_iniciado',
      software_origem: 'ArtCAM',
      maquina_principal: 'Router CNC',
      arquivo_ou_link: '',
      total_chapas: 8,
      especificacao_chapas: '6x ACM Azul Brilhante 3mm 5.00x1.22m (bandejas com rebaixo em V 90°) | 2x Acrílico Branco Leitoso 3mm (frentes das letras)',
      metros_vinil_lona: 14.0,
      gabarito_pronto: false,
      aprovado_producao: false,
      observacoes: 'Atenção ao sentido de pintura do ACM (setas de proteção). Rebaixo em V com fresa 90° deixando 0.8mm de polietileno para dobra perfeita.',
      created_at: '2026-10-10T09:15:00Z',
      updated_at: '2026-10-14T08:00:00Z',
    },
    itens_planta: [
      {
        id: 'it-1-1',
        os_id: 'os-1',
        codigo: 'FCH-01',
        nome: 'Revestimento de Fachada em Bandejas de ACM Azul',
        ambiente: 'Fachada Frontal',
        tipo_elemento: 'Fachada ACM',
        maquina_corte: 'router_cnc',
        largura_mm: 14000,
        altura_mm: 2200,
        profundidade_mm: 80,
        quantidade: 1,
        material_principal: 'ACM Azul Brilhante 3mm 0.21',
        iluminado: false,
        arquivo_corte_nome: 'bandejas_fachada_acm.dxf',
        arquivo_corte_url: '',
        gabarito_gerado: false,
        status_corte: 'pendente',
        status_item: 'corte_pendente',
        observacoes: 'Usinagem de 7 bandejas de 2.00x2.20m com abas de 40mm para fixação oculta.',
        created_at: '2026-10-10T09:20:00Z',
      },
      {
        id: 'it-1-2',
        os_id: 'os-1',
        codigo: 'LET-01',
        nome: 'Letreiro Caixa "DROGARIA VIDA NOVA" com LED',
        ambiente: 'Fachada Frontal',
        tipo_elemento: 'Letra Caixa',
        maquina_corte: 'laser',
        largura_mm: 8500,
        altura_mm: 750,
        profundidade_mm: 100,
        quantidade: 1,
        material_principal: 'Acrílico 3mm Leitoso (face) + Lateral em Alumínio Branco 100mm',
        iluminado: true,
        arquivo_corte_nome: 'letras_acrilico_laser.cdr',
        arquivo_corte_url: '',
        gabarito_gerado: false,
        status_corte: 'pendente',
        status_item: 'corte_pendente',
        observacoes: '140 módulos LED injetados 12V 1.5W IP68. Conexão paralela com cabo 2.5mm.',
        created_at: '2026-10-10T09:22:00Z',
      },
      {
        id: 'it-1-3',
        os_id: 'os-1',
        codigo: 'LOG-01',
        nome: 'Logotipo Cruz Farmacêutica em Relevo com Iluminação Traseira',
        ambiente: 'Fachada Frontal (Canto Direito)',
        tipo_elemento: 'Logo em Relevo',
        maquina_corte: 'router_cnc',
        largura_mm: 1200,
        altura_mm: 1200,
        profundidade_mm: 120,
        quantidade: 1,
        material_principal: 'PVC Expandido 20mm usinado na Router + Face em Acrílico Verde',
        iluminado: true,
        arquivo_corte_nome: 'cruz_pvc_router.dxf',
        status_corte: 'pendente',
        status_item: 'corte_pendente',
        observacoes: 'Efeito halo light (luz refletindo no ACM). Afastamento de 30mm com pinos rosqueados.',
        created_at: '2026-10-10T09:25:00Z',
      },
      {
        id: 'it-1-4',
        os_id: 'os-1',
        codigo: 'GAB-01',
        nome: 'Gabarito de Furação e Alinhamento 1:1 em Lona',
        ambiente: 'Instalação Obra',
        tipo_elemento: 'Gabarito',
        maquina_corte: 'impressao',
        largura_mm: 8500,
        altura_mm: 1000,
        quantidade: 1,
        material_principal: 'Lona Frontlight 280g rascunho com marcas de centro e furação',
        iluminado: false,
        status_corte: 'pendente',
        status_item: 'corte_pendente',
        observacoes: 'Essencial para a equipe de instaladores não errar a furação no ACM.',
        created_at: '2026-10-10T09:28:00Z',
      },
    ],
    materiais: [
      {
        id: 'mat-1-1',
        os_id: 'os-1',
        categoria: 'chapa',
        descricao: 'ACM Azul Brilhante 3mm (0.21) 5.00 x 1.22m',
        quantidade: 6,
        unidade: 'chapa',
        status_separacao: 'separado',
        localizacao_estoque: 'Cavalete de Chapas ACM A-01',
        created_at: '2026-10-10T09:30:00Z',
      },
      {
        id: 'mat-1-2',
        os_id: 'os-1',
        categoria: 'chapa',
        descricao: 'Acrílico Cast Branco Leitoso 3mm 2.00 x 1.00m',
        quantidade: 2,
        unidade: 'chapa',
        status_separacao: 'pendente',
        localizacao_estoque: 'Estoque Acrílico Prateleira 2',
        created_at: '2026-10-10T09:30:00Z',
      },
      {
        id: 'mat-1-3',
        os_id: 'os-1',
        categoria: 'chapa',
        descricao: 'PVC Expandido 20mm 2.44 x 1.22m',
        quantidade: 1,
        unidade: 'chapa',
        status_separacao: 'separado',
        localizacao_estoque: 'Estoque PVC Sala Router',
        created_at: '2026-10-10T09:30:00Z',
      },
      {
        id: 'mat-1-4',
        os_id: 'os-1',
        categoria: 'iluminacao',
        descricao: 'Módulo LED Injetado 12V 1.5W Branco Frio 6500K IP68 (Lente 160°)',
        quantidade: 180,
        unidade: 'módulo',
        status_separacao: 'separado',
        localizacao_estoque: 'Gaveteiro Elétrica E-03',
        created_at: '2026-10-10T09:30:00Z',
      },
      {
        id: 'mat-1-5',
        os_id: 'os-1',
        categoria: 'iluminacao',
        descricao: 'Fonte Chaveada Slim 12V 30A Bivolt Automática (Ventoinha Silenciosa)',
        quantidade: 2,
        unidade: 'un',
        status_separacao: 'falta_comprar',
        observacoes: 'Comprar com fornecedor Lumileds SP',
        created_at: '2026-10-10T09:30:00Z',
      },
      {
        id: 'mat-1-6',
        os_id: 'os-1',
        categoria: 'estrutura',
        descricao: 'Tubo de Aço Galvanizado 40 x 40 x 1.25mm (Barra 6 metros)',
        quantidade: 8,
        unidade: 'barra',
        status_separacao: 'separado',
        localizacao_estoque: 'Serralheria Prateleira Tubos',
        created_at: '2026-10-10T09:30:00Z',
      },
      {
        id: 'mat-1-7',
        os_id: 'os-1',
        categoria: 'fixacao_quimica',
        descricao: 'Selante PU 40 Estrutural Cinza (Tubo 400g)',
        quantidade: 6,
        unidade: 'tubo',
        status_separacao: 'separado',
        localizacao_estoque: 'Armário Químicos Q-01',
        created_at: '2026-10-10T09:30:00Z',
      },
      {
        id: 'mat-1-8',
        os_id: 'os-1',
        categoria: 'fixacao_quimica',
        descricao: 'Fita Dupla Face Estrutural VHB 3M 19mm x 20m',
        quantidade: 3,
        unidade: 'rolo',
        status_separacao: 'separado',
        localizacao_estoque: 'Gaveta Fitas Especiais',
        created_at: '2026-10-10T09:30:00Z',
      },
    ],
    historico: [
      {
        id: 'h-1-1',
        os_id: 'os-1',
        etapa: 'Visita Técnica e Medição',
        descricao: 'Medição da fachada feita com trena laser. Conferida a fiação elétrica de 220V no quadro.',
        autor: 'Projetista',
        created_at: '2026-10-10T09:00:00Z',
      },
      {
        id: 'h-1-2',
        os_id: 'os-1',
        etapa: 'Layout Aprovado',
        descricao: 'Cliente validou maquete 3D e cores azul e branco.',
        autor: 'Projetista',
        created_at: '2026-10-10T09:10:00Z',
      },
    ],
  },
  {
    id: 'os-2',
    numero_os: 'OS-2026-002',
    cliente: 'Hospital & Maternidade Santa Clara',
    telefone_cliente: '(11) 97123-9988',
    nome_projeto: 'Totem Dupla Face 4 Metros e Placas de Sinalização',
    ambiente: 'Entrada Principal e Recepção',
    ambientes: ['Totem / Entrada', 'Recepção / Hall', 'Sinalização Interna'],
    status: 'separacao_pendente',
    prioridade: 'normal',
    data_inicio: '2026-10-08',
    previsao_entrega: '2026-10-21', // 7 dias
    observacoes: 'Totem externo chumbado em base de concreto com 4 sapatas. Revestimento em ACM Grafite e letras em acrílico com iluminação interna.',
    valor_total: 34000.0,
    tags: ['Totem', 'Acrílico', 'Sinalização', 'Braille'],
    created_at: '2026-10-08T11:00:00Z',
    updated_at: '2026-10-13T16:00:00Z',
    plano_corte: {
      id: 'pc-2',
      os_id: 'os-2',
      status_corte: 'conferido',
      software_origem: 'Aspire / Vectric',
      maquina_principal: 'Router CNC',
      arquivo_ou_link: 'http://rede-cnc/cortes/totem_santa_clara_v2.crv',
      total_chapas: 6,
      especificacao_chapas: '4x ACM Grafite Escovado 4mm | 2x Acrílico Cristal 5mm',
      metros_vinil_lona: 8.0,
      gabarito_pronto: true,
      aprovado_producao: true,
      data_conferencia: '2026-10-13T15:30:00Z',
      observacoes: 'Arquivo de corte da Router conferido com folgas de 3mm para dilatação térmica do ACM.',
      created_at: '2026-10-08T11:30:00Z',
      updated_at: '2026-10-13T15:30:00Z',
    },
    itens_planta: [
      {
        id: 'it-2-1',
        os_id: 'os-2',
        codigo: 'TTM-01',
        nome: 'Totem Luminoso Dupla Face 4.00 x 1.40m',
        ambiente: 'Estacionamento / Entrada',
        tipo_elemento: 'Totem Externo',
        maquina_corte: 'router_cnc',
        largura_mm: 1400,
        altura_mm: 4000,
        profundidade_mm: 350,
        quantidade: 1,
        material_principal: 'ACM Grafite Escovado 4mm + Estrutura Tubo 50x50x2mm',
        iluminado: true,
        arquivo_corte_nome: 'corte_totem_router.dxf',
        arquivo_corte_url: 'http://rede-cnc/cortes/totem.dxf',
        gabarito_gerado: true,
        status_corte: 'cortado',
        status_item: 'em_producao',
        observacoes: 'Base com chapa de aço 3/8 pol com 4 chumbadores parabolt.',
        created_at: '2026-10-08T11:15:00Z',
      },
      {
        id: 'it-2-2',
        os_id: 'os-2',
        codigo: 'SIN-01',
        nome: 'Kit de 24 Placas de Sinalização de Porta em Acrílico com Braille',
        ambiente: 'Corredores e Consultórios',
        tipo_elemento: 'Sinalização Interna',
        maquina_corte: 'laser',
        largura_mm: 300,
        altura_mm: 150,
        profundidade_mm: 5,
        quantidade: 24,
        material_principal: 'Acrílico Cristal 5mm com fundo jateado e espaçadores inox',
        iluminado: false,
        arquivo_corte_nome: 'placas_portas_laser.cdr',
        status_corte: 'cortado',
        status_item: 'em_producao',
        observacoes: 'Esferas de Braille aplicadas conforme norma ABNT NBR 9050.',
        created_at: '2026-10-08T11:20:00Z',
      },
    ],
    materiais: [
      {
        id: 'mat-2-1',
        os_id: 'os-2',
        categoria: 'chapa',
        descricao: 'ACM Grafite Escovado 4mm 5.00 x 1.22m',
        quantidade: 4,
        unidade: 'chapa',
        status_separacao: 'separado',
        localizacao_estoque: 'Cavalete ACM 03',
        created_at: '2026-10-08T11:45:00Z',
      },
      {
        id: 'mat-2-2',
        os_id: 'os-2',
        categoria: 'chapa',
        descricao: 'Acrílico Cristal Puro 5mm 2.00 x 1.00m',
        quantidade: 2,
        unidade: 'chapa',
        status_separacao: 'separado',
        localizacao_estoque: 'Prateleira Acrílico P-01',
        created_at: '2026-10-08T11:45:00Z',
      },
      {
        id: 'mat-2-3',
        os_id: 'os-2',
        categoria: 'estrutura',
        descricao: 'Tubo de Aço Galvanizado 50 x 50 x 2.00mm',
        quantidade: 6,
        unidade: 'barra (6m)',
        status_separacao: 'separado',
        localizacao_estoque: 'Serralheria Tubos Pesados',
        created_at: '2026-10-08T11:45:00Z',
      },
      {
        id: 'mat-2-4',
        os_id: 'os-2',
        categoria: 'fixacao_quimica',
        descricao: 'Espaçador Prolongador Inox 25 x 25mm para Placas',
        quantidade: 96,
        unidade: 'un',
        status_separacao: 'falta_comprar',
        observacoes: 'Solicitar 24 conjuntos de 4 unidades',
        created_at: '2026-10-08T11:45:00Z',
      },
    ],
    historico: [
      {
        id: 'h-2-1',
        os_id: 'os-2',
        etapa: 'Corte CNC Liberado',
        descricao: 'Arquivos validados e aprovados para a Router e Laser.',
        autor: 'Projetista',
        created_at: '2026-10-13T15:30:00Z',
      },
    ],
  },
  {
    id: 'os-3',
    numero_os: 'OS-2026-003',
    cliente: 'Auto Peças e Centro Automotivo Brasil',
    telefone_cliente: '(11) 99111-2233',
    nome_projeto: 'Letreiro Neon LED Flex e Revestimento Pórtico',
    ambiente: 'Entrada dos Boxes de Atendimento',
    ambientes: ['Boxes / Atendimento', 'Pórtico Entrada'],
    status: 'em_producao',
    prioridade: 'normal',
    data_inicio: '2026-10-05',
    previsao_entrega: '2026-10-24', // 10 dias
    observacoes: 'Pórtico metálico com ACM Vermelho e letreiro estilo neon flex em silicone 12V.',
    valor_total: 16200.0,
    tags: ['Neon LED', 'Router CNC', 'Fachada'],
    created_at: '2026-10-05T08:00:00Z',
    updated_at: '2026-10-14T07:30:00Z',
    plano_corte: {
      id: 'pc-3',
      os_id: 'os-3',
      status_corte: 'enviado_producao',
      software_origem: 'CorelDraw',
      maquina_principal: 'Router CNC',
      arquivo_ou_link: 'http://rede-cnc/cortes/portico_autopeças.dxf',
      total_chapas: 5,
      especificacao_chapas: '4x ACM Vermelho Brilhante 3mm | 1x Acrílico Cristal 6mm canaletado',
      metros_vinil_lona: 0,
      gabarito_pronto: true,
      aprovado_producao: true,
      data_conferencia: '2026-10-07T10:00:00Z',
      created_at: '2026-10-05T08:30:00Z',
      updated_at: '2026-10-07T10:00:00Z',
    },
    itens_planta: [
      {
        id: 'it-3-1',
        os_id: 'os-3',
        codigo: 'NEO-01',
        nome: 'Logo "AUTO PEÇAS" em Fita Neon LED Flex 12V Amarelo e Branco',
        ambiente: 'Pórtico Entrada',
        tipo_elemento: 'Neon LED',
        maquina_corte: 'router_cnc',
        largura_mm: 3200,
        altura_mm: 800,
        profundidade_mm: 50,
        quantidade: 1,
        material_principal: 'Base Acrílico Cristal 6mm usinado na Router + Mangueira Neon Silicone 6x12mm',
        iluminado: true,
        arquivo_corte_nome: 'canaletado_neon_router.dxf',
        status_corte: 'cortado',
        status_item: 'em_producao',
        created_at: '2026-10-05T08:40:00Z',
      },
    ],
    materiais: [
      {
        id: 'mat-3-1',
        os_id: 'os-3',
        categoria: 'iluminacao',
        descricao: 'Fita LED Neon Flex Silicone 12V Amarela (Rolo 5m)',
        quantidade: 3,
        unidade: 'rolo',
        status_separacao: 'consumido',
        localizacao_estoque: 'Bancada Montagem Neon',
        created_at: '2026-10-05T09:00:00Z',
      },
      {
        id: 'mat-3-2',
        os_id: 'os-3',
        categoria: 'iluminacao',
        descricao: 'Fonte Blindada IP67 12V 15A para Área Externa',
        quantidade: 2,
        unidade: 'un',
        status_separacao: 'separado',
        localizacao_estoque: 'Gaveteiro Fontes F-02',
        created_at: '2026-10-05T09:00:00Z',
      },
    ],
    historico: [],
  },
  {
    id: 'os-4',
    numero_os: 'OS-2026-004',
    cliente: 'Academia FitPower 24h',
    telefone_cliente: '(11) 96543-2109',
    nome_projeto: 'Fachada Black Piano com Letras Caixa Inox Dourado',
    ambiente: 'Fachada e Hall de Entrada',
    ambientes: ['Fachada Principal', 'Recepção / Hall'],
    status: 'corte_pendente',
    prioridade: 'urgente',
    data_inicio: '2026-10-01',
    previsao_entrega: '2026-10-13', // Atrasado 1 dia
    observacoes: 'URGENTE: Inauguração da academia marcada. Falta finalizar o nesting do ACM Preto Brilho e mandar cortar as letras na máquina Laser.',
    valor_total: 21900.0,
    tags: ['Fachada ACM', 'Inox Dourado', 'Laser', 'Urgente'],
    created_at: '2026-10-01T14:00:00Z',
    updated_at: '2026-10-14T08:15:00Z',
    plano_corte: {
      id: 'pc-4',
      os_id: 'os-4',
      status_corte: 'nao_iniciado',
      software_origem: 'ArtCAM',
      maquina_principal: 'Router CNC',
      total_chapas: 5,
      especificacao_chapas: '4x ACM Preto Brilho 3mm | 1x Aço Inox Escovado Dourado (corte laser)',
      metros_vinil_lona: 0,
      gabarito_pronto: false,
      aprovado_producao: false,
      created_at: '2026-10-01T14:30:00Z',
      updated_at: '2026-10-14T08:15:00Z',
    },
    itens_planta: [
      {
        id: 'it-4-1',
        os_id: 'os-4',
        codigo: 'FCH-02',
        nome: 'Revestimento Pórtico em ACM Preto Black Piano',
        ambiente: 'Fachada Principal',
        tipo_elemento: 'Fachada ACM',
        maquina_corte: 'router_cnc',
        largura_mm: 9800,
        altura_mm: 2400,
        profundidade_mm: 70,
        quantidade: 1,
        material_principal: 'ACM Preto Brilho 3mm 0.21',
        iluminado: false,
        status_corte: 'pendente',
        status_item: 'corte_pendente',
        created_at: '2026-10-01T14:40:00Z',
      },
      {
        id: 'it-4-2',
        os_id: 'os-4',
        codigo: 'LET-02',
        nome: 'Letras Caixa Alta "FITPOWER 24H" em Inox Dourado',
        ambiente: 'Fachada Principal',
        tipo_elemento: 'Letra Caixa',
        maquina_corte: 'laser',
        largura_mm: 6500,
        altura_mm: 600,
        profundidade_mm: 80,
        quantidade: 1,
        material_principal: 'Inox Dourado espelhado com fundo PVC 10mm',
        iluminado: true,
        status_corte: 'pendente',
        status_item: 'corte_pendente',
        created_at: '2026-10-01T14:45:00Z',
      },
    ],
    materiais: [],
    historico: [],
  },
  {
    id: 'os-5',
    numero_os: 'OS-2026-005',
    cliente: 'Boutique Maria Flor',
    telefone_cliente: '(11) 97788-1122',
    nome_projeto: 'Adesivagem de Vitrine e Letreiro Backlight',
    ambiente: 'Shopping Center Piso L2',
    ambientes: ['Vitrine Shopping', 'Sinalização Interna'],
    status: 'layout_aprovado',
    prioridade: 'normal',
    data_inicio: '2026-10-12',
    previsao_entrega: '2026-10-28',
    valor_total: 8900.0,
    tags: ['Adesivagem', 'Shopping', 'Plotter Recorte'],
    created_at: '2026-10-12T10:00:00Z',
    updated_at: '2026-10-12T10:00:00Z',
    plano_corte: {
      id: 'pc-5',
      os_id: 'os-5',
      status_corte: 'nao_iniciado',
      software_origem: 'CorelDraw',
      maquina_principal: 'Plotter de Recorte',
      total_chapas: 1,
      especificacao_chapas: '1x Acrílico 3mm Leitoso | Vinil Adesivo Ouro Gold Oracal',
      metros_vinil_lona: 18.5,
      gabarito_pronto: false,
      aprovado_producao: false,
      created_at: '2026-10-12T10:30:00Z',
      updated_at: '2026-10-12T10:30:00Z',
    },
    itens_planta: [
      {
        id: 'it-5-1',
        os_id: 'os-5',
        codigo: 'ADV-01',
        nome: 'Adesivagem Decorativa de Vitrine com Vinil de Recorte Dourado',
        ambiente: 'Vitrine Shopping',
        tipo_elemento: 'Adesivagem',
        maquina_corte: 'plotter_recorte',
        largura_mm: 5200,
        altura_mm: 2600,
        quantidade: 1,
        material_principal: 'Vinil Adesivo Oracal Dourado Metálico 651',
        iluminado: false,
        status_corte: 'pendente',
        status_item: 'layout',
        created_at: '2026-10-12T10:35:00Z',
      },
    ],
    materiais: [],
    historico: [],
  },
];

// Gerador de UUID v4 universal (Navegador e Node)
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Garante que qualquer ID seja convertido em um UUID v4 valido de forma deterministica
export function ensureValidUUID(id: string | undefined | null): string {
  if (!id) return generateUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id.toLowerCase();

  // Hash deterministico para compatibilidade com dados legados ('os-1', 'it-1', etc.)
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d, h3 = 0x9e3779b9, h4 = 0x85ebca6b;
  for (let i = 0; i < id.length; i++) {
    const ch = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 2246822507);
  }
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const hex = toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
  const p1 = hex.substring(0, 8);
  const p2 = hex.substring(8, 12);
  const p3 = '4' + hex.substring(13, 16);
  const p4 = '8' + hex.substring(17, 20);
  const p5 = hex.substring(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

// Retorna a lista unificada e limpa de ambientes de uma OS
export function getOrderAmbientes(order: Partial<OrdemServico>): string[] {
  const set = new Set<string>();

  // 1. Array explícito de ambientes
  if (Array.isArray(order.ambientes)) {
    for (const amb of order.ambientes) {
      if (amb && typeof amb === 'string' && amb.trim()) {
        set.add(amb.trim());
      }
    }
  }

  // 2. Campo legado 'ambiente' (ex: "Fachada Principal, Recepção")
  if (order.ambiente && typeof order.ambiente === 'string') {
    const parts = order.ambiente.split(/[,;/+]+/).map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      set.add(p);
    }
  }

  // 3. Ambientes dos itens da planta cadastrados
  if (Array.isArray(order.itens_planta)) {
    for (const item of order.itens_planta) {
      if (item.ambiente && typeof item.ambiente === 'string' && item.ambiente.trim()) {
        set.add(item.ambiente.trim());
      }
    }
  }

  return Array.from(set);
}

// Normaliza todos os IDs de uma Ordem de Servico para UUIDs compativeis com PostgreSQL
export function normalizeOrder(order: OrdemServico): OrdemServico {
  const osId = ensureValidUUID(order.id);
  const normalizedAmbientes = getOrderAmbientes(order);
  return {
    ...order,
    id: osId,
    tags: Array.isArray(order.tags) ? order.tags : [],
    ambientes: normalizedAmbientes,
    ambiente: order.ambiente || (normalizedAmbientes.length > 0 ? normalizedAmbientes.join(', ') : undefined),
    plano_corte: order.plano_corte
      ? {
          ...order.plano_corte,
          id: ensureValidUUID(order.plano_corte.id),
          os_id: osId,
          software_origem: order.plano_corte.software_origem || 'ArtCAM',
          maquina_principal: order.plano_corte.maquina_principal || 'Router CNC',
          total_chapas: Number(order.plano_corte.total_chapas || 0),
          especificacao_chapas: order.plano_corte.especificacao_chapas || '',
          metros_vinil_lona: Number(order.plano_corte.metros_vinil_lona || 0),
          gabarito_pronto: Boolean(order.plano_corte.gabarito_pronto),
          aprovado_producao: Boolean(order.plano_corte.aprovado_producao),
        }
      : undefined,
    itens_planta: (order.itens_planta || []).map((it) => ({
      ...it,
      id: ensureValidUUID(it.id),
      os_id: osId,
      quantidade: Number(it.quantidade || 1),
      iluminado: Boolean(it.iluminado),
      gabarito_gerado: Boolean(it.gabarito_gerado),
    })),
    materiais: (order.materiais || []).map((mat) => ({
      ...mat,
      id: ensureValidUUID(mat.id),
      os_id: osId,
      quantidade: Number(mat.quantidade || 1),
    })),
    historico: (order.historico || []).map((h) => ({
      ...h,
      id: ensureValidUUID(h.id),
      os_id: osId,
    })),
  };
}

// Helper para ler do localStorage
export function loadLocalOrders(): OrdemServico[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const normalizedSeeds = SEED_ORDERS.map(normalizeOrder);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizedSeeds));
      return normalizedSeeds;
    }
    const parsed: OrdemServico[] = JSON.parse(raw);
    return parsed.map(normalizeOrder);
  } catch (err) {
    console.error('Erro ao ler ordens do localStorage:', err);
    return SEED_ORDERS.map(normalizeOrder);
  }
}

// Helper para salvar no localStorage
export function saveLocalOrders(orders: OrdemServico[]): void {
  try {
    const normalized = orders.map(normalizeOrder);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.error('Erro ao salvar ordens no localStorage:', err);
  }
}

// Salva uma OS completa diretamente no Supabase com tratamento rigoroso de erros
export async function saveOrderToSupabase(order: OrdemServico, client = getSupabaseClient()): Promise<void> {
  if (!client || !isSupabaseConfigured()) return;

  const normalized = normalizeOrder(order);
  const { plano_corte, materiais, itens_planta, historico, ...osRow } = normalized;

  // 1. Upsert da OS principal (com retry defensivo caso a coluna tags ainda não exista no Supabase)
  let toSendOS: any = {
    ...osRow,
    updated_at: new Date().toISOString(),
  };

  let { error: osError } = await client.from('ordens_servico').upsert(toSendOS);

  if (osError && (osError.message.includes('ambientes') || osError.code === '42703')) {
    console.warn('Coluna ambientes não encontrada no Supabase. Retentando sem o campo ambientes...', osError.message);
    delete toSendOS.ambientes;
    const retry = await client.from('ordens_servico').upsert(toSendOS);
    osError = retry.error;
  }

  if (osError && (osError.message.includes('tags') || osError.code === '42703')) {
    console.warn('Coluna tags não encontrada no Supabase. Retentando sem o campo tags...', osError.message);
    delete toSendOS.tags;
    const retry = await client.from('ordens_servico').upsert(toSendOS);
    osError = retry.error;
  }

  if (osError) {
    console.error('Erro no Supabase ao salvar ordens_servico:', osError);
    throw new Error(`Erro ao salvar OS: ${osError.message}`);
  }

  // 2. Upsert do Plano de Corte
  if (plano_corte) {
    const { error: pcError } = await client.from('planos_corte').upsert({
      ...plano_corte,
      os_id: normalized.id,
      updated_at: new Date().toISOString(),
    });

    if (pcError) {
      console.error('Erro no Supabase ao salvar planos_corte:', pcError);
      throw new Error(`Erro ao salvar Plano de Corte: ${pcError.message}`);
    }
  }

  // 3. Upsert e exclusão de Itens da Planta / Obra
  if (itens_planta && itens_planta.length > 0) {
    for (const item of itens_planta) {
      const { error: itError } = await client.from('itens_planta').upsert({
        ...item,
        os_id: normalized.id,
      });
      if (itError) {
        console.error('Erro no Supabase ao salvar itens_planta:', itError);
      }
    }
    // Remove do banco os itens que foram deletados no app
    const activeItemIds = itens_planta.map((i) => i.id);
    await client
      .from('itens_planta')
      .delete()
      .eq('os_id', normalized.id)
      .not('id', 'in', `(${activeItemIds.join(',')})`);
  } else {
    await client.from('itens_planta').delete().eq('os_id', normalized.id);
  }

  // 4. Upsert e exclusão de Materiais
  if (materiais && materiais.length > 0) {
    for (const mat of materiais) {
      const { error: matError } = await client.from('itens_material').upsert({
        ...mat,
        os_id: normalized.id,
      });
      if (matError) {
        console.error('Erro no Supabase ao salvar itens_material:', matError);
      }
    }
    const activeMatIds = materiais.map((m) => m.id);
    await client
      .from('itens_material')
      .delete()
      .eq('os_id', normalized.id)
      .not('id', 'in', `(${activeMatIds.join(',')})`);
  } else {
    await client.from('itens_material').delete().eq('os_id', normalized.id);
  }

  // 5. Upsert de Histórico
  if (historico && historico.length > 0) {
    for (const h of historico) {
      await client.from('historico_os').upsert({
        ...h,
        os_id: normalized.id,
      });
    }
  }
}

// Camada Unificada de Dados (Supabase ou LocalStorage)
export async function fetchAllOrders(): Promise<{ orders: OrdemServico[]; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();

  if (!client || !isSupabaseConfigured()) {
    return { orders: loadLocalOrders(), source: 'local' };
  }

  try {
    const { data: osData, error: osError } = await client
      .from('ordens_servico')
      .select('*')
      .order('created_at', { ascending: false });

    if (osError || !osData) {
      console.warn('Erro ao consultar Supabase, utilizando dados locais:', osError);
      return { orders: loadLocalOrders(), source: 'local' };
    }

    // Se o Supabase estiver conectado porem sem nenhum registro, semeia os dados iniciais
    if (osData.length === 0) {
      const localOrders = loadLocalOrders();
      const toSeed = localOrders.length > 0 ? localOrders : SEED_ORDERS.map(normalizeOrder);
      console.log('Supabase conectado com 0 registros. Enviando dados iniciais para o banco...');
      
      for (const order of toSeed) {
        try {
          await saveOrderToSupabase(order, client);
        } catch (seedErr) {
          console.error('Erro ao semear ordem inicial:', seedErr);
        }
      }

      // Consulta novamente apos semeadura
      const { data: reloadedData } = await client
        .from('ordens_servico')
        .select('*')
        .order('created_at', { ascending: false });

      if (reloadedData && reloadedData.length > 0) {
        osData.push(...reloadedData);
      } else {
        return { orders: toSeed, source: 'supabase' };
      }
    }

    // Carrega tabelas relacionadas
    const { data: cortesData } = await client.from('planos_corte').select('*');
    const { data: matsData } = await client.from('itens_material').select('*');
    const { data: itensPlantaData } = await client
      .from('itens_planta')
      .select('*')
      .order('codigo', { ascending: true });
    const { data: histData } = await client
      .from('historico_os')
      .select('*')
      .order('created_at', { ascending: true });

    const mergedOrders: OrdemServico[] = osData.map((os) => {
      const pc = cortesData?.find((c) => c.os_id === os.id);
      const mats = matsData?.filter((m) => m.os_id === os.id) || [];
      const itensPlanta = itensPlantaData?.filter((ip) => ip.os_id === os.id) || [];
      const hist = histData?.filter((h) => h.os_id === os.id) || [];
      return normalizeOrder({
        ...os,
        plano_corte: pc || undefined,
        materiais: mats,
        itens_planta: itensPlanta,
        historico: hist,
      });
    });

    // Atualiza o cache local para modo offline
    saveLocalOrders(mergedOrders);

    return { orders: mergedOrders, source: 'supabase' };
  } catch (err) {
    console.error('Falha de comunicacao com Supabase, fallback para local:', err);
    return { orders: loadLocalOrders(), source: 'local' };
  }
}

// Salvar / Atualizar uma OS
export async function saveOrder(order: OrdemServico): Promise<void> {
  const normalized = normalizeOrder(order);

  // 1. Sempre salva no localStorage imediatamente
  const currentLocal = loadLocalOrders();
  const existingIdx = currentLocal.findIndex((o) => o.id === normalized.id);
  let updatedLocal: OrdemServico[];

  if (existingIdx >= 0) {
    updatedLocal = [...currentLocal];
    updatedLocal[existingIdx] = normalized;
  } else {
    updatedLocal = [normalized, ...currentLocal];
  }
  saveLocalOrders(updatedLocal);

  // 2. Se o Supabase estiver configurado, persiste no banco com tratamento de erro
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await saveOrderToSupabase(normalized, client);
    } catch (err) {
      console.error('Erro critico ao salvar no Supabase:', err);
      // Dispara evento para o frontend exibir aviso visual
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fluxpro_sync_error', {
            detail: { message: err instanceof Error ? err.message : String(err) },
          })
        );
      }
      throw err;
    }
  }
}

// Excluir uma OS
export async function deleteOrder(orderId: string): Promise<void> {
  const validId = ensureValidUUID(orderId);
  const currentLocal = loadLocalOrders();
  saveLocalOrders(currentLocal.filter((o) => o.id !== validId && o.id !== orderId));

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('ordens_servico').delete().eq('id', validId);
    } catch (err) {
      console.error('Erro ao deletar no Supabase:', err);
    }
  }
}

// Sincroniza todos os dados do LocalStorage para o Supabase
export async function syncAllLocalToSupabase(): Promise<{ success: number; errors: string[] }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    throw new Error('Supabase nao esta configurado.');
  }

  const localOrders = loadLocalOrders();
  let success = 0;
  const errors: string[] = [];

  for (const o of localOrders) {
    try {
      await saveOrderToSupabase(o, client);
      success++;
    } catch (err) {
      errors.push(`OS ${o.numero_os}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { success, errors };
}

// Diagnostico rapido da saude do banco de dados Supabase
export async function testSupabaseHealth(): Promise<{
  ok: boolean;
  message: string;
  details?: Record<string, boolean | string>;
}> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return { ok: false, message: 'Supabase nao configurado ou URL invalida.' };
  }

  const details: Record<string, boolean | string> = {};

  try {
    // 1. Testa tabela ordens_servico
    const { error: osErr } = await client.from('ordens_servico').select('id, status').limit(1);
    details['Tabela ordens_servico'] = !osErr ? 'OK' : osErr.message;

    // 2. Testa tabela planos_corte
    const { error: pcErr } = await client.from('planos_corte').select('id, maquina_principal, metros_vinil_lona, gabarito_pronto').limit(1);
    details['Tabela planos_corte (Campos CNC)'] = !pcErr ? 'OK' : pcErr.message;

    // 3. Testa tabela itens_planta
    const { error: itErr } = await client.from('itens_planta').select('id, tipo_elemento, maquina_corte, iluminado, gabarito_gerado').limit(1);
    details['Tabela itens_planta (Fotos e Maquinas)'] = !itErr ? 'OK' : itErr.message;

    // 4. Testa tabela itens_material
    const { error: matErr } = await client.from('itens_material').select('id, categoria').limit(1);
    details['Tabela itens_material'] = !matErr ? 'OK' : matErr.message;

    const allOk = Object.values(details).every((val) => val === 'OK');
    return {
      ok: allOk,
      message: allOk ? 'Banco de dados Supabase 100% operacional e atualizado!' : 'Algumas tabelas precisam de atualizacao no SQL Editor.',
      details,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Falha de conexao: ${err instanceof Error ? err.message : String(err)}`,
      details,
    };
  }
}
