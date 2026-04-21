import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import { useGroups } from '@/hooks/useGroups';
import { useMatches } from '@/hooks/useMatches';
import { useParticipants } from '@/hooks/useParticipants';
import { calculateStandings } from '@/algorithms/standings';
import { generateBracket } from '@/algorithms/bracket';
import { updateGroupStandings } from '@/services/groupService';
import { updateTournamentStatus } from '@/services/tournamentService';
import { createMatchesBatch } from '@/services/matchService';
import { saveBracketSlots } from '@/services/bracketService';
import type { Match } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GroupTable } from '@/components/groups/GroupTable';
import { MatchResultModal } from '@/components/groups/MatchResultModal';
import { Alert } from '@/components/ui/Alert';

export function GroupsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament } = useTournament(id);
  const { groups, loading: groupsLoading } = useGroups(id);
  const { matches, loading: matchesLoading, recordResult } = useMatches(id);
  const { participants } = useParticipants(id);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState('');

  const groupMatches = matches.filter((m) => m.phase === 'groups');
  const allPlayed = groupMatches.length > 0 && groupMatches.every((m) => m.status === 'played');

  // Update standings whenever a match result changes
  useEffect(() => {
    if (groups.length === 0 || participants.length === 0) return;

    groups.forEach(async (group) => {
      const groupParticipants = participants.filter((p) =>
        group.participantIds.includes(p.id)
      );
      const groupMatchList = matches.filter((m) => m.groupId === group.id);
      const standings = calculateStandings(groupParticipants, groupMatchList);
      await updateGroupStandings(id, group.id, standings).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches]);

  const handleRecordResult = async (matchId: string, homeScore: number, awayScore: number) => {
    await recordResult(matchId, homeScore, awayScore);
    setSelectedMatch(null);
  };

  const handleAdvanceToPlayoffs = async () => {
    if (!tournament) return;
    setAdvancing(true);
    setError('');

    try {
      // Collect top 2 from each group as qualifiers
      const qualifiers = groups.flatMap((group) => {
        const sorted = Object.values(group.standings).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.goalDiff - a.goalDiff;
        });
        return sorted.slice(0, 2).map((s) => {
          const p = participants.find((p) => p.id === s.participantId);
          return p ?? null;
        }).filter(Boolean) as NonNullable<typeof participants[0]>[];
      });

      if (qualifiers.length < 2) {
        setError('No hay suficientes participantes clasificados.');
        return;
      }

      const { slots } = generateBracket(qualifiers, id);
      await saveBracketSlots(id, slots);

      // Create playoff matches
      const sfMatches: Omit<Match, 'id' | 'tournamentId' | 'createdAt'>[] = [];
      const hasSemis = slots.some((s) => s.round === 'semifinal');

      if (hasSemis) {
        const sf1h = slots.find((s) => s.round === 'semifinal' && s.position === 0);
        const sf1a = slots.find((s) => s.round === 'semifinal' && s.position === 1);
        const sf2h = slots.find((s) => s.round === 'semifinal' && s.position === 2);
        const sf2a = slots.find((s) => s.round === 'semifinal' && s.position === 3);

        if (sf1h?.participantId && sf1a?.participantId) {
          sfMatches.push({ phase: 'semifinal', groupId: null, round: 1, homeId: sf1h.participantId, awayId: sf1a.participantId, homeName: sf1h.participantName!, awayName: sf1a.participantName!, homeScore: null, awayScore: null, winnerId: null, status: 'pending' });
        }
        if (sf2h?.participantId && sf2a?.participantId) {
          sfMatches.push({ phase: 'semifinal', groupId: null, round: 1, homeId: sf2h.participantId, awayId: sf2a.participantId, homeName: sf2h.participantName!, awayName: sf2a.participantName!, homeScore: null, awayScore: null, winnerId: null, status: 'pending' });
        }
        sfMatches.push(
          { phase: 'final', groupId: null, round: 2, homeId: 'tbd', awayId: 'tbd', homeName: 'Por determinar', awayName: 'Por determinar', homeScore: null, awayScore: null, winnerId: null, status: 'pending' },
          { phase: 'third_place', groupId: null, round: 2, homeId: 'tbd', awayId: 'tbd', homeName: 'Por determinar', awayName: 'Por determinar', homeScore: null, awayScore: null, winnerId: null, status: 'pending' }
        );
      } else {
        const fh = slots.find((s) => s.round === 'final' && s.position === 0);
        const fa = slots.find((s) => s.round === 'final' && s.position === 1);
        if (fh?.participantId && fa?.participantId) {
          sfMatches.push({ phase: 'final', groupId: null, round: 1, homeId: fh.participantId, awayId: fa.participantId, homeName: fh.participantName!, awayName: fa.participantName!, homeScore: null, awayScore: null, winnerId: null, status: 'pending' });
        }
      }

      await createMatchesBatch(id, sfMatches);
      await updateTournamentStatus(id, 'playoffs');
      navigate(`/tournaments/${id}/bracket`);
    } catch (err) {
      console.error(err);
      setError('Error al avanzar a eliminatorias.');
    } finally {
      setAdvancing(false);
    }
  };

  if (groupsLoading || matchesLoading) return <Layout><LoadingSpinner text="Cargando fase de grupos..." /></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/tournaments/${id}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al torneo
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fase de Grupos</h1>
          {allPlayed && tournament?.format !== 'groups_only' && (
            <Button onClick={handleAdvanceToPlayoffs} loading={advancing} size="lg">
              🏅 Avanzar a Eliminatorias
            </Button>
          )}
        </div>

        {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}

        {allPlayed && (
          <div className="mb-6">
            <Alert type="success">
              Todos los partidos han sido jugados.
              {tournament?.format !== 'groups_only'
                ? ' Puedes avanzar a la fase de eliminatorias.'
                : ' ¡Fase de grupos completada!'}
            </Alert>
          </div>
        )}

        {/* Groups */}
        <div className="space-y-8">
          {groups.map((group) => {
            const gMatches = groupMatches.filter((m) => m.groupId === group.id);
            const gParticipants = participants.filter((p) => group.participantIds.includes(p.id));

            return (
              <div key={group.id}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {group.name}
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Standings table */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Clasificación
                    </p>
                    <GroupTable
                      group={{ ...group, standings: calculateStandings(gParticipants, gMatches) }}
                      matches={gMatches}
                    />
                  </div>

                  {/* Matches */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Partidos
                    </p>
                    <div className="space-y-2">
                      {gMatches.map((match) => (
                        <MatchRow
                          key={match.id}
                          match={match}
                          canEdit={tournament?.status === 'groups'}
                          onClick={() => tournament?.status === 'groups' && setSelectedMatch(match)}
                        />
                      ))}
                      {gMatches.length === 0 && (
                        <Card>
                          <p className="text-sm text-gray-400 text-center">Sin partidos generados</p>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {groups.length === 0 && (
            <Card>
              <p className="text-center text-gray-400 py-6">
                Los grupos aún no han sido generados.
              </p>
            </Card>
          )}
        </div>
      </div>

      <MatchResultModal
        match={selectedMatch}
        open={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
        onSave={handleRecordResult}
      />
    </Layout>
  );
}

function MatchRow({
  match,
  canEdit,
  onClick,
}: {
  match: Match;
  canEdit: boolean;
  onClick: () => void;
}) {
  const isPlayed = match.status === 'played';

  return (
    <button
      onClick={onClick}
      disabled={!canEdit}
      className={[
        'w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-left transition-all text-sm',
        isPlayed
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
        canEdit ? 'hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm cursor-pointer' : 'cursor-default',
      ].join(' ')}
    >
      <span className="flex-1 font-medium text-gray-900 dark:text-gray-100 text-right truncate">
        {match.homeName}
      </span>
      <span className={`font-bold px-3 py-1 rounded-lg text-xs ${
        isPlayed
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
      }`}>
        {isPlayed ? `${match.homeScore} – ${match.awayScore}` : '? – ?'}
      </span>
      <span className="flex-1 font-medium text-gray-900 dark:text-gray-100 truncate">{match.awayName}</span>
      <Badge color={isPlayed ? 'green' : 'gray'}>{isPlayed ? 'Jugado' : 'Pendiente'}</Badge>
    </button>
  );
}
