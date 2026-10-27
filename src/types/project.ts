import { OrdemServico, ItemPlanta, ItemMaterial, OSStatus, OSPrioridade } from './index';

export type ProjectHealth = 'on_track' | 'at_risk' | 'delayed' | 'completed';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  code?: string;
  phase: 'layout' | 'corte' | 'producao' | 'acabamento' | 'instalacao' | 'geral';
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  environment?: string;
  assignee?: string;
  dueDate?: string;
  hasCutFile?: boolean;
  cutFileName?: string;
  cutFileUrl?: string;
  notes?: string;
  photoUrl?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  rawItem?: ItemPlanta;
}

export interface ProjectFileItem {
  id: string;
  projectId: string;
  name: string;
  type: 'vector' | 'cad' | 'image' | 'pdf' | 'other';
  url: string;
  size?: string;
  relatedTask?: string;
  uploadedAt: string;
}

// Converte status antigo de OS para chave amigável
export function mapOSStatusToModern(status: OSStatus): {
  key: string;
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'medicao_visita':
      return {
        key: 'medicao',
        label: 'Medição & Visita',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
        dotClass: 'bg-sky-500',
      };
    case 'layout_aprovado':
      return {
        key: 'planejamento',
        label: 'Layout Aprovado',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        dotClass: 'bg-indigo-500',
      };
    case 'corte_pendente':
      return {
        key: 'corte',
        label: 'Corte CNC & Arquivos',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        dotClass: 'bg-purple-500',
      };
    case 'separacao_pendente':
      return {
        key: 'materiais',
        label: 'Separação de Materiais',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500',
      };
    case 'em_producao':
      return {
        key: 'producao',
        label: 'Em Produção',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
        dotClass: 'bg-orange-500',
      };
    case 'pronto_entrega':
      return {
        key: 'pronto',
        label: 'Pronto / Instalação',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
      };
    case 'entregue':
      return {
        key: 'concluido',
        label: 'Entregue / Concluído',
        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        dotClass: 'bg-zinc-500',
      };
    case 'cancelado':
      return {
        key: 'cancelado',
        label: 'Cancelado',
        badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
        dotClass: 'bg-red-500',
      };
    default:
      return {
        key: 'outro',
        label: 'Em Andamento',
        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        dotClass: 'bg-zinc-500',
      };
  }
}

// Converte prioridade para estilo visual
export function mapPriorityStyle(priority: OSPrioridade): {
  label: string;
  badgeClass: string;
  iconColor: string;
} {
  switch (priority) {
    case 'urgente':
      return {
        label: 'Urgente',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900',
        iconColor: 'text-rose-600 dark:text-rose-400',
      };
    case 'alta':
      return {
        label: 'Alta',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
        iconColor: 'text-amber-600 dark:text-amber-400',
      };
    case 'normal':
      return {
        label: 'Normal',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900',
        iconColor: 'text-blue-600 dark:text-blue-400',
      };
    case 'baixa':
    default:
      return {
        label: 'Baixa',
        badgeClass: 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
        iconColor: 'text-zinc-400',
      };
  }
}

// Calcula saúde do projeto
export function getProjectHealth(order: OrdemServico): {
  health: ProjectHealth;
  label: string;
  badgeClass: string;
  daysRemaining: number;
} {
  if (order.status === 'entregue') {
    return {
      health: 'completed',
      label: 'Concluído',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800',
      daysRemaining: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(order.previsao_entrega);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      health: 'delayed',
      label: `${Math.abs(diffDays)}d atrasado`,
      badgeClass: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/40 dark:border-red-800 animate-pulse',
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 3) {
    return {
      health: 'at_risk',
      label: diffDays === 0 ? 'Entrega hoje' : `${diffDays}d restantes`,
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800',
      daysRemaining: diffDays,
    };
  }

  return {
    health: 'on_track',
    label: `${diffDays}d restantes`,
    badgeClass: 'text-zinc-600 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800',
    daysRemaining: diffDays,
  };
}

// Calcula progresso percentual do projeto baseado nos itens da obra
export function calculateProjectProgress(order: OrdemServico): number {
  if (order.status === 'entregue') return 100;
  if (order.status === 'cancelado') return 0;

  const items = order.itens_planta || [];
  if (items.length > 0) {
    let completedPoints = 0;
    items.forEach((item) => {
      // Se a peça está na etapa final (Pronto / Instalado ou Instalado), conta como 100% concluída
      if (item.status_item === 'pronto_instalacao' || item.status_item === 'instalado') {
        completedPoints += 100;
      } else if (item.status_item === 'teste_eletrico') {
        completedPoints += 75;
      } else if (item.status_item === 'em_producao') {
        completedPoints += 50;
      } else if (item.status_item === 'corte_pendente') {
        completedPoints += 25;
      } else {
        // layout inicial
        completedPoints += 10;
      }
    });
    return Math.round(completedPoints / items.length);
  }

  // Fallback baseado no status macro caso ainda não tenha peças cadastradas
  switch (order.status) {
    case 'medicao_visita':
      return 15;
    case 'layout_aprovado':
      return 30;
    case 'corte_pendente':
      return 45;
    case 'separacao_pendente':
      return 60;
    case 'em_producao':
      return 75;
    case 'pronto_entrega':
      return 100;
    default:
      return 20;
  }
}
