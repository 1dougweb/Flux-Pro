import React from 'react';
import { ItemMaterial } from '../../types';
import { AlertCircle } from 'lucide-react';

interface MaterialProgressBarProps {
  materiais?: ItemMaterial[];
  compact?: boolean;
}

export const MaterialProgressBar: React.FC<MaterialProgressBarProps> = ({
  materiais = [],
  compact = false,
}) => {
  if (!materiais || materiais.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 italic">
        Sem materiais cadastrados
      </div>
    );
  }

  const total = materiais.length;
  const separados = materiais.filter((m) => m.status_separacao === 'separado' || m.status_separacao === 'consumido').length;
  const emFalta = materiais.filter((m) => m.status_separacao === 'falta_comprar').length;
  const percentage = Math.round((separados / total) * 100);

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between text-[11px] mb-1 font-mono-code text-neutral-600 dark:text-neutral-400">
          <span>
            {separados}/{total} separados
          </span>
          {emFalta > 0 && (
            <span className="text-red-700 dark:text-red-400 font-semibold flex items-center gap-0.5">
              <AlertCircle className="w-3 h-3" /> {emFalta} em falta
            </span>
          )}
          {emFalta === 0 && <span>{percentage}%</span>}
        </div>
        <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              percentage === 100
                ? 'bg-neutral-900 dark:bg-neutral-100'
                : emFalta > 0
                ? 'bg-red-600 dark:bg-red-500'
                : 'bg-neutral-700 dark:bg-neutral-300'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-medium text-light-text dark:text-dark-text">
          Status de Separação de Materiais
        </span>
        <div className="flex items-center gap-2 font-mono-code">
          <span className="text-neutral-600 dark:text-neutral-400">
            {separados} de {total} itens prontos ({percentage}%)
          </span>
          {emFalta > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200 border border-red-300 dark:border-red-900">
              {emFalta} em falta
            </span>
          )}
        </div>
      </div>

      <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            percentage === 100
              ? 'bg-neutral-900 dark:bg-neutral-100'
              : emFalta > 0
              ? 'bg-red-600 dark:bg-red-500'
              : 'bg-neutral-800 dark:bg-neutral-200'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
