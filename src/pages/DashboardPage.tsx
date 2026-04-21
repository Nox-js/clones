import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { subscribeUserTournaments, deleteTournament } from '@/services/tournamentService';
import type { Tournament } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

export function DashboardPage() {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserTournaments(user.uid, (data) => {
      setTournaments(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este torneo? Esta acción no se puede deshacer.')) return;
    await deleteTournament(id);
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Torneos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {tournaments.length > 0
              ? `${tournaments.length} torneo${tournaments.length !== 1 ? 's' : ''} creado${tournaments.length !== 1 ? 's' : ''}`
              : 'Crea tu primer torneo'}
          </p>
        </div>
        <Button onClick={() => navigate('/tournaments/new')} size="lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo torneo
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Cargando torneos..." />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No tienes torneos aún"
          description="Crea tu primer torneo para organizar partidos, clasificaciones y eliminatorias."
          action={
            <Button onClick={() => navigate('/tournaments/new')} size="lg">
              Crear primer torneo
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </Layout>
  );
}
