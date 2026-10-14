import React from 'react';
import { AlertCircle, Clock, Check } from 'lucide-react';

interface DeliveryCountdownProps {
  dateStr: string;
  isDelivered?: boolean;
}

export const DeliveryCountdown: React.FC<DeliveryCountdownProps> = ({ dateStr, isDelivered }) => {
  if (isDelivered) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
        <Check className="w-3.5 h-3.5" />
        Entregue
      </span>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border border-red-300 bg-red-100 text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">
        <AlertCircle className="w-3.5 h-3.5" />
        Atrasado {daysLate} {daysLate === 1 ? 'dia' : 'dias'} ({formattedDate})
      </span>
    );
  }

  if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
        <Clock className="w-3.5 h-3.5" />
        Entrega Hoje ({formattedDate})
      </span>
    );
  }

  if (diffDays === 1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-neutral-900 dark:text-amber-300">
        <Clock className="w-3.5 h-3.5" />
        Amanhã ({formattedDate})
      </span>
    );
  }

  if (diffDays <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
        <Clock className="w-3.5 h-3.5" />
        Em {diffDays} dias ({formattedDate})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
      <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
      Em {diffDays} dias ({formattedDate})
    </span>
  );
};
