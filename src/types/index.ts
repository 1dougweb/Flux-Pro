export type OSStatus =
  | 'medicao_visita'
  | 'layout_aprovado'
  | 'corte_pendente'
  | 'separacao_pendente'
  | 'em_producao'
  | 'pronto_entrega'
  | 'entregue'
  | 'cancelado';

export type OSPrioridade = 'baixa' | 'normal' | 'alta' | 'urgente';

export type StatusCorte =
  | 'nao_iniciado'
  | 'em_otimizacao'
  | 'gerado'
  | 'conferido'
  | 'enviado_producao';

export type CategoriaMaterial =
  | 'chapa' // ACM, Acrílico, PVC Expandido, PS, Policarbonato
  | 'vinil_lona' // Vinil adesivo, Lona Front/Back, Máscara, Laminação
  | 'iluminacao' // Módulos LED, Fita Neon, Fontes 12V, Cabos
  | 'estrutura' // Tubos galvanizados, Cantoneiras de alumínio, Metalon
  | 'fixacao_quimica' // PU 40, Fita VHB 3M, Rebites, Parafusos Brocantes, Cola Acrílica
  | 'gabarito' // Papel Kraft, Lona de Furação 1:1
  | 'outro';

export type TipoMaquinaCorte =
  | 'router_cnc'
  | 'laser'
  | 'plotter_recorte'
  | 'impressao'
  | 'manual';

export type StatusSeparacao =
  | 'pendente'
  | 'separado'
  | 'falta_comprar'
  | 'consumido';

export type StatusItemObra =
  | 'layout'
  | 'corte_pendente'
  | 'em_producao'
  | 'teste_eletrico'
  | 'pronto_instalacao'
  | 'instalado';

export interface ItemPlanta {
  id: string;
  os_id: string;
  codigo: string; // Ex: FA-01 (Fachada), LT-01 (Letreiro), TM-01 (Totem), PL-01 (Placa)
  nome: string; // Ex: Fachada em Bandejas ACM, Letreiro Caixa com LED, Totem Luminoso
  ambiente: string; // Ex: Fachada Principal, Recepção, Vitrine, Estacionamento
  tipo_elemento?: string; // Fachada ACM, Letra Caixa, Totem, Sinalização, Adesivo, Neon
  maquina_corte?: TipoMaquinaCorte; // Router CNC, Laser, Plotter, Impressão
  largura_mm?: number;
  altura_mm?: number;
  profundidade_mm?: number;
  quantidade: number;
  material_principal?: string; // Ex: ACM Azul 3mm, Acrílico Branco 3mm, PVC 20mm
  iluminado?: boolean; // Leva LED e fonte?
  foto_url?: string; // Foto da fachada/local ou Render 3D da comunicação visual
  arquivo_corte_nome?: string; // Ex: "corte_fachada_router.dxf", "letras_laser.cdr"
  arquivo_corte_url?: string; // Link web ou Data URL do arquivo de corte
  gabarito_gerado?: boolean; // Gabarito 1:1 de instalação impresso?
  status_corte: 'pendente' | 'cortado' | 'liberado';
  status_item: StatusItemObra;
  observacoes?: string;
  created_at: string;
}

export interface PlanoCorte {
  id: string;
  os_id: string;
  status_corte: StatusCorte;
  software_origem: string; // ArtCAM, Aspire (Vectric), CorelDraw, AutoCAD, LightBurn
  maquina_principal?: string; // Router CNC, Laser CO2/Fibra, Plotter
  arquivo_ou_link?: string;
  total_chapas: number; // Total chapas ACM, Acrílico, PVC
  especificacao_chapas: string; // Ex: 4x ACM Azul 3mm 5.00x1.22m, 2x Acrílico 3mm Leitoso
  metros_vinil_lona?: number; // Metragem linear de vinil/lona
  gabarito_pronto: boolean; // Gabarito de instalação 1:1 impresso/separado?
  aprovado_producao: boolean;
  data_conferencia?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemMaterial {
  id: string;
  os_id: string;
  item_planta_id?: string; // ID da peça/elemento da OS destinada a este insumo
  categoria: CategoriaMaterial;
  descricao: string;
  quantidade: number;
  unidade: string;
  status_separacao: StatusSeparacao;
  localizacao_estoque?: string;
  observacoes?: string;
  created_at: string;
}

export interface HistoricoOS {
  id: string;
  os_id: string;
  etapa: string;
  descricao: string;
  autor: string;
  created_at: string;
}

export interface OrdemServico {
  id: string;
  numero_os: string;
  cliente: string;
  telefone_cliente?: string;
  nome_projeto: string; // Ex: Fachada Comercial e Letreiro Luminoso
  ambiente?: string; // Ex: Fachada Externa, Recepção, Vitrine
  ambientes?: string[]; // Lista de ambientes da obra (ex: ['Fachada Principal', 'Recepção', 'Totem'])
  status: OSStatus;
  prioridade: OSPrioridade;
  data_inicio: string;
  previsao_entrega: string;
  observacoes?: string;
  valor_total?: number;
  created_at: string;
  updated_at: string;
  plano_corte?: PlanoCorte;
  materiais?: ItemMaterial[];
  itens_planta?: ItemPlanta[];
  historico?: HistoricoOS[];
  tags?: string[];
}

export const SUGESTOES_AMBIENTES_CV = [
  'Fachada Principal',
  'Fachada Lateral',
  'Recepção / Hall',
  'Totem / Entrada',
  'Vitrine Shopping',
  'Sinalização Interna',
  'Corredores / Acesso',
  'Boxes / Atendimento',
  'Área Externa',
  'Área Interna',
  'Estacionamento',
];

export const SUGESTOES_TAGS_CV = [
  'ACM 3mm',
  'Acrílico',
  'LED 12V',
  'Neon LED',
  'PVC 20mm',
  'Inox',
  'Totem',
  'Fachada',
  'Serralheria',
  'Adesivagem',
  'Instalação Noturna',
  'Shopping',
  'Gabarito 1:1',
  'Urgente',
  'Cliente VIP',
];

export type ViewFilter =
  | 'todas'
  | 'itens_planta'
  | 'corte_pendente'
  | 'separacao_pendente'
  | 'em_producao'
  | 'urgentes_atrasadas'
  | 'kanban';
