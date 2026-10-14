import React from 'react';
import { MapPin } from 'lucide-react';
import {
  OSStatus,
  OSPrioridade,
  StatusCorte,
  StatusSeparacao,
  StatusItemObra,
  TipoMaquinaCorte,
} from '../../types';
import { parseTag, TAG_COLORS_CONFIG } from '../../lib/tags';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, className = '', variant = 'neutral' }) => {
  const variantStyles = {
    neutral: 'bg-light-surface text-light-text border-light-border dark:bg-dark-surface dark:text-dark-text dark:border-dark-border',
    default: 'bg-black text-white dark:bg-white dark:text-black border-transparent',
    success: 'bg-neutral-100 text-neutral-900 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700',
    warning: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60',
    danger: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/60',
    info: 'bg-neutral-200 text-neutral-900 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const OSStatusBadge: React.FC<{ status: OSStatus }> = ({ status }) => {
  switch (status) {
    case 'medicao_visita':
      return <Badge variant="neutral">Visita / Medição</Badge>;
    case 'layout_aprovado':
      return <Badge variant="info">Layout Aprovado</Badge>;
    case 'corte_pendente':
      return <Badge variant="warning">Arquivos CNC Pendentes</Badge>;
    case 'separacao_pendente':
      return <Badge variant="warning">Separação Materiais</Badge>;
    case 'em_producao':
      return <Badge variant="default">Em Usinagem / Produção</Badge>;
    case 'pronto_entrega':
      return <Badge variant="success">Pronto p/ Instalação</Badge>;
    case 'entregue':
      return <Badge variant="neutral">Instalado na Obra</Badge>;
    case 'cancelado':
      return <Badge variant="danger">Cancelado</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const OSPrioridadeBadge: React.FC<{ prioridade: OSPrioridade }> = ({ prioridade }) => {
  switch (prioridade) {
    case 'urgente':
      return <Badge variant="danger">Urgente</Badge>;
    case 'alta':
      return <Badge variant="warning">Alta</Badge>;
    case 'normal':
      return <Badge variant="neutral">Normal</Badge>;
    case 'baixa':
      return <Badge variant="neutral">Baixa</Badge>;
    default:
      return null;
  }
};

export const StatusCorteBadge: React.FC<{ status: StatusCorte; aprovado: boolean }> = ({
  status,
  aprovado,
}) => {
  if (aprovado) {
    return <Badge variant="success">Arquivos CNC Liberados</Badge>;
  }
  switch (status) {
    case 'nao_iniciado':
      return <Badge variant="danger">Corte Não Iniciado</Badge>;
    case 'em_otimizacao':
      return <Badge variant="warning">Em Otimização / Nesting</Badge>;
    case 'gerado':
      return <Badge variant="info">Vetores Gerados</Badge>;
    case 'conferido':
      return <Badge variant="neutral">Vetores Conferidos</Badge>;
    case 'enviado_producao':
      return <Badge variant="success">Na Router / Laser</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const StatusSeparacaoBadge: React.FC<{ status: StatusSeparacao }> = ({ status }) => {
  switch (status) {
    case 'separado':
      return <Badge variant="success">Separado</Badge>;
    case 'falta_comprar':
      return <Badge variant="danger">Falta Comprar</Badge>;
    case 'consumido':
      return <Badge variant="neutral">Consumido</Badge>;
    case 'pendente':
    default:
      return <Badge variant="warning">A Separar</Badge>;
  }
};

export const STATUS_ITEM_OBRA_CONFIG: Record<
  StatusItemObra,
  { label: string; step: number; variant: 'info' | 'warning' | 'default' | 'success' | 'neutral' }
> = {
  layout: { label: '1. Em Layout', step: 1, variant: 'info' },
  corte_pendente: { label: '2. Corte Pendente', step: 2, variant: 'warning' },
  em_producao: { label: '3. Em Usinagem', step: 3, variant: 'default' },
  teste_eletrico: { label: '4. Teste LED 12V', step: 4, variant: 'warning' },
  pronto_instalacao: { label: '5. Pronto p/ Instalação', step: 5, variant: 'success' },
  instalado: { label: '6. Instalado na Obra', step: 6, variant: 'neutral' },
};

export const StatusItemObraBadge: React.FC<{ status?: StatusItemObra }> = ({ status = 'layout' }) => {
  const cfg = STATUS_ITEM_OBRA_CONFIG[status] || {
    label: status,
    step: 0,
    variant: 'neutral',
  };

  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

export const StatusItemObraSelector: React.FC<{
  currentStatus?: StatusItemObra;
  onChangeStatus: (newStatus: StatusItemObra) => void;
  disabled?: boolean;
}> = ({ currentStatus = 'layout', onChangeStatus, disabled = false }) => {
  return (
    <select
      value={currentStatus}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChangeStatus(e.target.value as StatusItemObra)}
      className="text-[11px] font-mono-code font-bold px-2 py-1 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white cursor-pointer hover:border-black dark:hover:border-white transition-colors"
      title="Clique para alterar a etapa desta peça na produção"
    >
      <option value="layout">1. Em Layout (Vetores)</option>
      <option value="corte_pendente">2. Corte Pendente (CNC)</option>
      <option value="em_producao">3. Em Usinagem / Dobra</option>
      <option value="teste_eletrico">4. Teste LED 12V</option>
      <option value="pronto_instalacao">5. Pronto p/ Instalação</option>
      <option value="instalado">6. Instalado na Obra</option>
    </select>
  );
};

export const StatusCorteItemBadge: React.FC<{ status: 'pendente' | 'cortado' | 'liberado' }> = ({
  status,
}) => {
  switch (status) {
    case 'liberado':
    case 'cortado':
      return <Badge variant="success">Corte Concluído</Badge>;
    case 'pendente':
    default:
      return <Badge variant="warning">Corte Pendente</Badge>;
  }
};

export const MaquinaCorteBadge: React.FC<{ maquina?: TipoMaquinaCorte }> = ({ maquina }) => {
  if (!maquina) return null;
  const labels: Record<TipoMaquinaCorte, string> = {
    router_cnc: 'Router CNC',
    laser: 'Laser',
    plotter_recorte: 'Plotter Recorte',
    impressao: 'Impressão Digital',
    manual: 'Manual',
  };
  return (
    <span className="font-mono-code text-[10px] px-1.5 py-0.2 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-neutral-600 dark:text-neutral-400">
      {labels[maquina]}
    </span>
  );
};

export const TagBadge: React.FC<{
  tag: string;
  onRemove?: () => void;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
}> = ({ tag, onRemove, onClick, selected, size = 'sm' }) => {
  const parsed = parseTag(tag);
  const colorCfg = TAG_COLORS_CONFIG[parsed.color] || TAG_COLORS_CONFIG.black;

  // Se a etiqueta não tiver nome, exibe apenas a barra colorida no estilo Trello
  if (!parsed.name) {
    return (
      <span
        onClick={onClick}
        title={colorCfg.label}
        className={`inline-block ${colorCfg.bgClass} rounded transition-all select-none ${
          size === 'sm' ? 'w-8 h-2.5 sm:h-3' : 'w-10 h-3.5'
        } ${onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''} ${
          selected ? 'ring-2 ring-black dark:ring-white ring-offset-1' : ''
        }`}
      />
    );
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-sans rounded border transition-all select-none shadow-sm ${
        colorCfg.bgClass
      } ${colorCfg.borderClass} ${colorCfg.textClass} ${
        size === 'sm'
          ? 'text-[10px] font-bold px-2 py-0.5 leading-tight'
          : 'text-xs font-bold px-2.5 py-1 leading-snug'
      } ${
        onClick
          ? 'cursor-pointer hover:brightness-110 active:scale-95'
          : ''
      } ${
        selected ? 'ring-2 ring-black dark:ring-white ring-offset-1' : ''
      }`}
    >
      <span className="truncate max-w-[180px]">{parsed.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-70 hover:opacity-100 transition-opacity ml-0.5 leading-none font-bold"
          title="Remover etiqueta"
        >
          &times;
        </button>
      )}
    </span>
  );
};


export const AmbienteBadge: React.FC<{
  ambiente: string;
  onRemove?: () => void;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
}> = ({ ambiente, onRemove, onClick, selected, size = 'sm' }) => {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-mono-code rounded border transition-colors select-none ${
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
      } ${
        onClick ? 'cursor-pointer' : ''
      } ${
        selected
          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold'
          : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:border-black dark:hover:border-white'
      }`}
    >
      <MapPin className={`${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} shrink-0 text-neutral-500`} />
      <span className="truncate max-w-[200px]">{ambiente}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 text-neutral-400 hover:text-black dark:hover:text-white ml-0.5"
          title="Remover ambiente"
        >
          &times;
        </button>
      )}
    </span>
  );
};


