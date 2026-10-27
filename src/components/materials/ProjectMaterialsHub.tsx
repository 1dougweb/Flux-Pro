import React, { useState } from 'react';
import {
  Package,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ItemMaterial, StatusSeparacao, CategoriaMaterial } from '../../types';

interface ProjectMaterialsHubProps {
  materials: ItemMaterial[];
  onAddMaterial: (mat: Omit<ItemMaterial, 'id' | 'created_at'>) => void;
  onUpdateMaterial: (id: string, updates: Partial<ItemMaterial>) => void;
  onRemoveMaterial: (id: string) => void;
  onCycleStatus: (id: string) => void;
}

export const ProjectMaterialsHub: React.FC<ProjectMaterialsHubProps> = ({
  materials,
  onAddMaterial,
  onUpdateMaterial,
  onRemoveMaterial,
  onCycleStatus,
}) => {
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<CategoriaMaterial>('iluminacao');
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState('un');

  const separados = materials.filter((m) => m.status_separacao === 'separado').length;
  const faltam = materials.filter((m) => m.status_separacao === 'falta_comprar').length;
  const total = materials.length;
  const progress = total > 0 ? Math.round((separados / total) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    onAddMaterial({
      os_id: '',
      descricao: descricao.trim(),
      categoria,
      quantidade: parseFloat(quantidade) || 1,
      unidade,
      status_separacao: 'pendente',
    });

    setDescricao('');
  };

  const insertStandardKit = () => {
    const kit = [
      {
        descricao: 'Módulos LED 12V Injetados Branco Frio IP67',
        categoria: 'iluminacao' as CategoriaMaterial,
        quantidade: 50,
        unidade: 'un',
      },
      {
        descricao: 'Fonte Chaveada Slim 12V 20A 240W',
        categoria: 'iluminacao' as CategoriaMaterial,
        quantidade: 2,
        unidade: 'un',
      },
      {
        descricao: 'Selante PU 40 Fixação e Vedação (Cinza/Preto)',
        categoria: 'fixacao_quimica' as CategoriaMaterial,
        quantidade: 3,
        unidade: 'tubo',
      },
      {
        descricao: 'Fita Dupla Face Estrutural 3M VHB 19mm',
        categoria: 'fixacao_quimica' as CategoriaMaterial,
        quantidade: 1,
        unidade: 'rolo',
      },
    ];

    kit.forEach((item) => {
      onAddMaterial({
        os_id: '',
        ...item,
        status_separacao: 'pendente',
      });
    });
  };

  const getStatusBadge = (status: StatusSeparacao) => {
    switch (status) {
      case 'separado':
        return {
          label: 'Separado',
          cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'falta_comprar':
        return {
          label: 'Falta Comprar',
          cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        };
      case 'consumido':
        return {
          label: 'Consumido',
          cls: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200',
        };
      case 'pendente':
      default:
        return {
          label: 'Pendente',
          cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Barra de Progresso e Ação de Kit Padrão */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <span>Separação de Materiais e Insumos</span>
            </h3>
            <span className="font-mono-code text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {separados}/{total} itens prontos ({progress}%)
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {faltam > 0 && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{faltam} insumo(s) marcados como &quot;Falta Comprar&quot;</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={insertStandardKit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Inserir Kit CV Padrão (LED + Fontes + PU)</span>
        </button>
      </div>

      {/* Tabela de Insumos com Formulário Inline */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        {/* Formulário Rápido */}
        <form
          onSubmit={handleAdd}
          className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex flex-wrap items-center gap-2 text-xs"
        >
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Nome do material (ex: PU 40 Preto, Cantoneira de Alumínio...)"
            className="flex-1 min-w-[220px] px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaMaterial)}
            className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="iluminacao">Iluminação (LED/Fontes)</option>
            <option value="chapa">Chapas (ACM/Acrílico)</option>
            <option value="fixacao_quimica">Fixação Química (PU/VHB)</option>
            <option value="estrutura">Estrutura (Metalon/Tubos)</option>
            <option value="vinil_lona">Vinis & Lonas</option>
            <option value="outro">Outro Insumo</option>
          </select>

          <input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className="w-16 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
          />

          <input
            type="text"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            placeholder="un, barras..."
            className="w-16 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
          />

          <button
            type="submit"
            className="px-3 py-1.5 font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Adicionar Insumo
          </button>
        </form>

        {materials.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            Nenhum material adicionado a este projeto ainda. Use o botão de kit padrão ou cadastre acima.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-mono-code uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4 font-semibold">Descrição do Material</th>
                  <th className="py-2.5 px-4 font-semibold">Categoria</th>
                  <th className="py-2.5 px-4 font-semibold">Quantidade</th>
                  <th className="py-2.5 px-4 font-semibold">Status de Separação (Clique para alternar)</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                {materials.map((m) => {
                  const badge = getStatusBadge(m.status_separacao);

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-850/60 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {m.descricao}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-500 capitalize">
                        {m.categoria.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-4 font-mono-code font-bold">
                        {m.quantidade} {m.unidade}
                      </td>
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => onCycleStatus(m.id)}
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-transform hover:scale-105 ${badge.cls}`}
                          title="Clique para alternar status: Pendente → Separado → Falta Comprar"
                        >
                          {badge.label}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => onRemoveMaterial(m.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
