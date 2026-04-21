import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

const statusConfig = {
  draft: { label: 'Borrador', color: 'gray' as const },
  groups: { label: 'Fase de Grupos', color: 'indigo' as const },
  playoffs: { label: 'Eliminatorias', color: 'amber' as const },
  finished: { label: 'Finalizado', color: 'green' as const },
};

const formatLabel = {
  'groups+playoffs': 'Grupos + Eliminatorias',
  'playoffs_only': 'Solo Eliminatorias',
  'groups_only': 'Solo Grupos',
};

const pairingLabel = {
  balanced: 'Equilibrado',
  snake: 'Snake',
  random: 'Aleatorio',
};

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament, loading } = useTournament(id ?? '');

  if (loading) return <Layout><LoadingSpinner text="Cargando torneo..." /></Layout>;
  if (!tournament) return <Layout><EmptyState title="Torneo no encontrado" description="Este torneo no existe o no tienes acceso." /></Layout>;

  const status = statusConfig[tournament.status];

  const tabs = [
    {
      label: '👥 Participantes',
      href: `/tournaments/${id}/participants`,
      visible: true,
    },
    {
      label: '📊 Fase de Grupos',
      href: `/tournaments/${id}/groups`,
      visible: tournament.format !== 'playoffs_only',
    },
    {
      label: '🏅 Eliminatorias',
      href: `/tournaments/${id}/bracket`,
      visible: tournament.format !== 'groups_only',
    },
    {
      label: '🏆 Clasificación Final',
      href: `/tournaments/${id}/standings`,
      visible: true,
    },
  ].filter((t) => t.visible);

  return (
    <Layout>
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Mis torneos
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{tournament.gameIcon}</span>
            <div>
              <Badge color={status.color}>{status.label}</Badge>
              <h1 className="text-2xl font-bold mt-1">{tournament.name}</h1>
              <p className="text-indigo-200 text-sm mt-0.5">{tournament.gameName}</p>
              {tournament.description && (
                <p className="text-indigo-100/80 text-sm mt-1">{tournament.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-indigo-200">
          <span>📋 {formatLabel[tournament.format]}</span>
          <span>🎯 Emparejamiento {pairingLabel[tournament.pairingMethod]}</span>
          {tournament.hasElo && <span>📈 Sistema ELO activo</span>}
        </div>
      </div>

      {/* Navigation tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            to={tab.href}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all group"
          >
            <p className="text-2xl mb-2">{tab.label.split(' ')[0]}</p>
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">
              {tab.label.substring(tab.label.indexOf(' ') + 1)}
            </p>
          </Link>
        ))}
      </div>

      {/* Status guide */}
      <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3">
          Estado actual: <span className="font-bold">{status.label}</span>
        </h3>
        <div className="text-sm text-indigo-700 dark:text-indigo-400 space-y-1">
          {tournament.status === 'draft' && (
            <>
              <p>→ Ve a <strong>Participantes</strong> para añadir equipos o jugadores.</p>
              <p>→ Cuando tengas todos los participantes, genera la fase de grupos o el bracket.</p>
            </>
          )}
          {tournament.status === 'groups' && (
            <>
              <p>→ Ve a <strong>Fase de Grupos</strong> para registrar los resultados.</p>
              <p>→ Cuando todos los partidos tengan resultado, avanza a Eliminatorias.</p>
            </>
          )}
          {tournament.status === 'playoffs' && (
            <>
              <p>→ Ve a <strong>Eliminatorias</strong> para registrar los resultados de los cruces.</p>
              <p>→ Los ganadores de semifinales avanzan automáticamente a la final.</p>
            </>
          )}
          {tournament.status === 'finished' && (
            <p>→ Ve a <strong>Clasificación Final</strong> para ver el podio y la clasificación completa.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Silence unused import
void Button;
