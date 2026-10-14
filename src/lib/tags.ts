/**
 * Sistema de Etiquetas (Tags) Visual no Estilo Trello para o FLUXPRO
 * Suporte a cores sólidas vibrantes, nomes opcionais e compatibilidade retroativa com arrays de strings.
 */

export type TagColor =
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'purple'
  | 'blue'
  | 'sky'
  | 'lime'
  | 'pink'
  | 'black';

export interface TagColorConfig {
  id: TagColor;
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  hex: string;
}

export interface ParsedTag {
  name: string;
  color: TagColor;
  raw: string;
}

export const TAG_COLORS: TagColor[] = [
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
  'black',
];

export const TAG_COLORS_CONFIG: Record<TagColor, TagColorConfig> = {
  green: {
    id: 'green',
    label: 'Verde',
    bgClass: 'bg-emerald-600 dark:bg-emerald-600',
    borderClass: 'border-emerald-700 dark:border-emerald-500',
    textClass: 'text-white',
    hex: '#059669',
  },
  yellow: {
    id: 'yellow',
    label: 'Amarelo',
    bgClass: 'bg-amber-400 dark:bg-amber-400',
    borderClass: 'border-amber-500 dark:border-amber-400',
    textClass: 'text-neutral-950 font-bold',
    hex: '#fbbf24',
  },
  orange: {
    id: 'orange',
    label: 'Laranja',
    bgClass: 'bg-orange-500 dark:bg-orange-500',
    borderClass: 'border-orange-600 dark:border-orange-400',
    textClass: 'text-white',
    hex: '#f97316',
  },
  red: {
    id: 'red',
    label: 'Vermelho',
    bgClass: 'bg-red-600 dark:bg-red-600',
    borderClass: 'border-red-700 dark:border-red-500',
    textClass: 'text-white',
    hex: '#dc2626',
  },
  purple: {
    id: 'purple',
    label: 'Roxo',
    bgClass: 'bg-purple-600 dark:bg-purple-600',
    borderClass: 'border-purple-700 dark:border-purple-500',
    textClass: 'text-white',
    hex: '#9333ea',
  },
  blue: {
    id: 'blue',
    label: 'Azul',
    bgClass: 'bg-blue-600 dark:bg-blue-600',
    borderClass: 'border-blue-700 dark:border-blue-500',
    textClass: 'text-white',
    hex: '#2563eb',
  },
  sky: {
    id: 'sky',
    label: 'Celeste',
    bgClass: 'bg-sky-500 dark:bg-sky-500',
    borderClass: 'border-sky-600 dark:border-sky-400',
    textClass: 'text-white',
    hex: '#0284c7',
  },
  lime: {
    id: 'lime',
    label: 'Lima',
    bgClass: 'bg-lime-500 dark:bg-lime-500',
    borderClass: 'border-lime-600 dark:border-lime-400',
    textClass: 'text-neutral-950 font-bold',
    hex: '#84cc16',
  },
  pink: {
    id: 'pink',
    label: 'Rosa',
    bgClass: 'bg-pink-600 dark:bg-pink-600',
    borderClass: 'border-pink-700 dark:border-pink-500',
    textClass: 'text-white',
    hex: '#db2777',
  },
  black: {
    id: 'black',
    label: 'Grafite',
    bgClass: 'bg-neutral-800 dark:bg-neutral-800',
    borderClass: 'border-neutral-900 dark:border-neutral-600',
    textClass: 'text-white',
    hex: '#262626',
  },
};

/**
 * Sugestões padrão de etiquetas para Projetistas e Comunicação Visual
 */
export const DEFAULT_TRELLO_TAGS: Array<{ name: string; color: TagColor }> = [
  { name: 'Urgente', color: 'red' },
  { name: 'Aguardando Arquivo', color: 'yellow' },
  { name: 'Material Pendente', color: 'orange' },
  { name: 'Layout Aprovado', color: 'green' },
  { name: 'Router CNC', color: 'blue' },
  { name: 'Corte Laser', color: 'sky' },
  { name: 'Letra Caixa', color: 'purple' },
  { name: 'Iluminação LED', color: 'pink' },
  { name: 'Adesivagem / Plotter', color: 'lime' },
  { name: 'Fachada ACM', color: 'black' },
];

/**
 * Determina deterministicamente uma cor para strings legadas sem cor especificada
 */
function getDeterministicColor(str: string): TagColor {
  const lower = str.toLowerCase().trim();
  if (lower.includes('urgent') || lower.includes('atras') || lower.includes('parado')) return 'red';
  if (lower.includes('aguard') || lower.includes('pendent') || lower.includes('arquiv') || lower.includes('esper')) return 'yellow';
  if (lower.includes('material') || lower.includes('compr') || lower.includes('falta')) return 'orange';
  if (lower.includes('aprov') || lower.includes('pront') || lower.includes('concluid') || lower.includes('ok')) return 'green';
  if (lower.includes('router') || lower.includes('cnc') || lower.includes('usin')) return 'blue';
  if (lower.includes('laser') || lower.includes('acril') || lower.includes('cristal')) return 'sky';
  if (lower.includes('letra') || lower.includes('caixa') || lower.includes('inox') || lower.includes('shopping')) return 'purple';
  if (lower.includes('led') || lower.includes('neon') || lower.includes('ilumin') || lower.includes('12v')) return 'pink';
  if (lower.includes('adesiv') || lower.includes('plotter') || lower.includes('vinil') || lower.includes('recorte')) return 'lime';
  if (lower.includes('fachada') || lower.includes('acm') || lower.includes('totem') || lower.includes('noturn')) return 'black';

  // Hash code simples para consistência
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

/**
 * Serializa nome e cor no formato persistível "nome::cor"
 */
export function formatTag(name: string, color: TagColor): string {
  const cleanName = name.trim();
  return `${cleanName}::${color}`;
}

/**
 * Faz o parse de qualquer tag (legada ou no formato "nome::cor")
 */
export function parseTag(raw: string): ParsedTag {
  if (!raw || typeof raw !== 'string') {
    return { name: '', color: 'black', raw: '' };
  }

  const clean = raw.trim();
  if (clean.includes('::')) {
    const parts = clean.split('::');
    const colorCandidate = parts[parts.length - 1].trim() as TagColor;
    const name = parts.slice(0, -1).join('::').trim();
    if (TAG_COLORS.includes(colorCandidate)) {
      return {
        name,
        color: colorCandidate,
        raw: clean,
      };
    }
  }

  // Tag sem delimitador de cor: extrai cor sugerida/determinística
  const color = getDeterministicColor(clean);
  return {
    name: clean,
    color,
    raw: clean,
  };
}

/**
 * Compara se duas tags são idênticas (pelo nome e/ou raw)
 */
export function areTagsEqual(tagA: string, tagB: string): boolean {
  if (tagA === tagB) return true;
  const pA = parseTag(tagA);
  const pB = parseTag(tagB);
  if (pA.name && pB.name) {
    return pA.name.toLowerCase() === pB.name.toLowerCase();
  }
  return pA.color === pB.color;
}
