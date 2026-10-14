import React from 'react';
import { X, ExternalLink, Download, Image as ImageIcon } from 'lucide-react';

interface PhotoViewerModalProps {
  photoUrl: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  photoUrl,
  title,
  subtitle,
  onClose,
}) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Topo */}
        <div className="p-3 sm:p-4 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-light-text dark:text-dark-text truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-light-muted dark:text-dark-muted truncate">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              title="Abrir imagem original"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Imagem Centralizada */}
        <div className="flex-1 bg-black/90 p-4 flex items-center justify-center overflow-auto min-h-[300px] max-h-[75vh]">
          <img
            src={photoUrl}
            alt={title}
            className="max-h-full max-w-full object-contain rounded select-none"
          />
        </div>

        {/* Rodapé */}
        <div className="p-3 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex justify-between items-center text-xs text-light-muted dark:text-dark-muted">
          <span>Foto / Render do Item da Planta</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-black text-white dark:bg-white dark:text-black text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
