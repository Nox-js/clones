import { Link } from 'react-router-dom';
import type { Tournament } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface TournamentCardProps {
  tournament: Tournament;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  draft: { label: 'Borrador', color: 'gray' as const },
  groups: { label: 'Fase de Grupos', color: 'indigo' as const },
  playoffs: { label: 'Eliminatorias', color: 'amber' as const },
  finished: { label: 'Finalizado', color: 'green' as const },
};

export function TournamentCard({ tournament, onDelete }: TournamentCardProps) {
  const status = statusConfig[tournament.status];

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Decorative top bar */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />

      <div className="p-5">
        {/* Icon + status */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{tournament.gameIcon}</span>
          <Badge color={status.color}>{status.label}</Badge>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
          {tournament.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tournament.gameName}</p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {tournament.format === 'groups+playoffs' ? 'Grupos + Eliminatorias' :
             tournament.format === 'playoffs_only' ? 'Solo Eliminatorias' : 'Solo Grupos'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/tournaments/${tournament.id}`}
            className="flex-1 text-center px-3 py-2 text-sm font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            Ver torneo
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(tournament.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Eliminar torneo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
