import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import { useMatches } from '@/hooks/useMatches';
import { useParticipants } from '@/hooks/useParticipants';
import { useGroups } from '@/hooks/useGroups';
import { getFinalRanking } from '@/algorithms/bracket';
import { calculateStandings, sortStandings } from '@/algorithms/standings';
import { useState, useEffect } from 'react';
import type { BracketSlot } from '@/types';
import { subscribeBracket } from '@/services/bracketService';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const MEDAL = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
const MEDAL_STYLE = [
  'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/30',
  'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 shadow-md shadow-gray-400/30',
  'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/30',
  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
];

export function StandingsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament } = useTournament(id);
  const { matches } = useMatches(id);
  const { participants } = useParticipants(id);
  const { groups } = useGroups(id);
  const [slots, setSlots] = useState<BracketSlot[]>([]);

  useEffect(() => {
    if (!id) return;
    return subscribeBracket(id, setSlots);
  }, [id]);

  if (!tournament) return <Layout><LoadingSpinner /></Layout>;

  const isFinished = tournament.status === 'finished';
  const finalRanking = getFinalRanking(slots, matches);
  const hasFinalRanking = finalRanking.length > 0;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(`/tournaments/${id}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al torneo
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Clasificación Final
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {isFinished ? '¡Torneo finalizado!' : 'El torneo aún está en curso.'}
        </p>

        {/* Podium */}
        {isFinished && hasFinalRanking && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🏆 Podio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {finalRanking.slice(0, 3).map((r) => (
                <PodiumCard key={r.position} ranking={r} />
              ))}
            </div>
            {finalRanking.length > 3 && (
              <div className="space-y-2">
                {finalRanking.slice(3).map((r) => (
                  <div
                    key={r.position}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <span className="text-xl w-8 text-center">{MEDAL[r.position - 1] ?? r.position}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{r.participantName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Group standings */}
        {groups.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fase de Grupos</h2>
            {groups.map((group) => {
              const gParticipants = participants.filter((p) => group.participantIds.includes(p.id));
              const gMatches = matches.filter((m) => m.groupId === group.id && m.phase === 'groups');
              const standings = sortStandings(Object.values(calculateStandings(gParticipants, gMatches)), gMatches);

              return (
                <Card key={group.id}>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{group.name}</h3>
                  <div className="space-y-1">
                    {standings.map((s, idx) => (
                      <div key={s.participantId} className="flex items-center gap-3 py-2 text-sm">
                        <span className="w-5 text-center font-bold text-gray-400">{idx + 1}</span>
                        <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">{s.participantName}</span>
                        <span className="text-gray-500">{s.played} PJ</span>
                        <span className="text-green-600">{s.won}G</span>
                        <span className="text-red-500">{s.lost}P</span>
                        <span className="font-bold text-gray-900 dark:text-white">{s.points} pts</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* All participants if no groups */}
        {groups.length === 0 && !hasFinalRanking && (
          <Card>
            <p className="text-center text-gray-400 dark:text-gray-500 py-4">
              La clasificación se mostrará cuando el torneo haya finalizado.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function PodiumCard({ ranking }: { ranking: { position: number; participantId: string; participantName: string } }) {
  const style = MEDAL_STYLE[ranking.position - 1] ?? MEDAL_STYLE[3];
  const medal = MEDAL[ranking.position - 1] ?? ranking.position;
  const heights = ['min-h-36', 'min-h-28', 'min-h-24'];
  const height = heights[ranking.position - 1] ?? 'min-h-20';

  return (
    <div
      className={`${height} ${style} rounded-2xl p-5 flex flex-col items-center justify-center text-center`}
    >
      <span className="text-4xl mb-2">{medal}</span>
      <span className="font-bold text-lg leading-tight">{ranking.participantName}</span>
      <span className="text-sm mt-1 opacity-80">
        {ranking.position === 1 ? 'Campeón' : ranking.position === 2 ? 'Subcampeón' : '3.er puesto'}
      </span>
    </div>
  );
}
