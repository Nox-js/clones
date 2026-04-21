import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import { useMatches } from '@/hooks/useMatches';
import { updateTournamentStatus } from '@/services/tournamentService';
import { updateBracketSlot } from '@/services/bracketService';
import { updateDoc, doc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Match, BracketSlot } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BracketView } from '@/components/bracket/BracketView';
import { MatchResultModal } from '@/components/groups/MatchResultModal';
import { Alert } from '@/components/ui/Alert';
import { subscribeBracket } from '@/services/bracketService';

export function BracketPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament } = useTournament(id);
  const { matches, recordResult } = useMatches(id);

  const [slots, setSlots] = useState<BracketSlot[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    return subscribeBracket(id, setSlots);
  }, [id]);

  const playoffMatches = matches.filter(
    (m) => m.phase === 'semifinal' || m.phase === 'final' || m.phase === 'third_place'
  );

  const allPlayoffDone = (() => {
    const hasSemis = slots.some((s) => s.round === 'semifinal');
    if (hasSemis) {
      const finalM = playoffMatches.find((m) => m.phase === 'final');
      const thirdM = playoffMatches.find((m) => m.phase === 'third_place');
      return finalM?.status === 'played' && thirdM?.status === 'played';
    } else {
      const finalM = playoffMatches.find((m) => m.phase === 'final');
      return finalM?.status === 'played';
    }
  })();

  const handleMatchClick = (match: Match) => {
    if (match.homeId === 'tbd' || match.awayId === 'tbd') return;
    if (tournament?.status !== 'playoffs') return;
    setSelectedMatch(match);
  };

  const handleSaveResult = async (matchId: string, homeScore: number, awayScore: number) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    await recordResult(matchId, homeScore, awayScore);

    // Propagate winners for semis
    if (match.phase === 'semifinal') {
      const winnerId = homeScore > awayScore ? match.homeId : match.awayId;
      const winnerName = homeScore > awayScore ? match.homeName : match.awayName;
      const loserId = homeScore > awayScore ? match.awayId : match.homeId;
      const loserName = homeScore > awayScore ? match.awayName : match.homeName;

      // Determine which SF this is (SF1 or SF2)
      const allSemis = matches.filter((m) => m.phase === 'semifinal');
      const sfIndex = allSemis.findIndex((m) => m.id === matchId) as 0 | 1;

      // Final slot positions: 0=winner SF1, 1=winner SF2
      // Third place slot positions: 0=loser SF1, 1=loser SF2
      await updateBracketSlot(id, `final_${sfIndex}`, { participantId: winnerId, participantName: winnerName });
      await updateBracketSlot(id, `third_place_${sfIndex}`, { participantId: loserId, participantName: loserName });

      // Update the actual final/third_place matches with the real participants
      const matchesSnap = await getDocs(
        query(collection(db, 'tournaments', id, 'matches'),
          where('phase', '==', sfIndex === 0 ? 'final' : 'final'))
      );
      // Update the final match placeholder
      const finalMatchQuery = await getDocs(
        query(collection(db, 'tournaments', id, 'matches'), where('phase', '==', 'final'))
      );
      const thirdMatchQuery = await getDocs(
        query(collection(db, 'tournaments', id, 'matches'), where('phase', '==', 'third_place'))
      );

      if (!finalMatchQuery.empty) {
        const finalDoc = finalMatchQuery.docs[0];
        const finalData = finalDoc.data() as Match;
        if (sfIndex === 0) {
          await updateDoc(doc(db, 'tournaments', id, 'matches', finalDoc.id), {
            homeId: winnerId, homeName: winnerName,
          });
        } else {
          await updateDoc(doc(db, 'tournaments', id, 'matches', finalDoc.id), {
            awayId: winnerId, awayName: winnerName,
          });
        }
        void finalData;
      }

      if (!thirdMatchQuery.empty) {
        const thirdDoc = thirdMatchQuery.docs[0];
        if (sfIndex === 0) {
          await updateDoc(doc(db, 'tournaments', id, 'matches', thirdDoc.id), {
            homeId: loserId, homeName: loserName,
          });
        } else {
          await updateDoc(doc(db, 'tournaments', id, 'matches', thirdDoc.id), {
            awayId: loserId, awayName: loserName,
          });
        }
      }
      void matchesSnap;
    }

    setSelectedMatch(null);
  };

  const handleFinishTournament = async () => {
    setFinishing(true);
    try {
      await updateTournamentStatus(id, 'finished');
      navigate(`/tournaments/${id}/standings`);
    } catch {
      setError('Error al finalizar el torneo.');
    } finally {
      setFinishing(false);
    }
  };

  if (!tournament) return <Layout><LoadingSpinner text="Cargando eliminatorias..." /></Layout>;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Eliminatorias</h1>
          {allPlayoffDone && tournament.status === 'playoffs' && (
            <Button onClick={handleFinishTournament} loading={finishing} size="lg">
              🏆 Finalizar torneo
            </Button>
          )}
        </div>

        {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}

        {allPlayoffDone && tournament.status === 'playoffs' && (
          <div className="mb-6">
            <Alert type="success">
              ¡Todos los partidos han sido jugados! Haz clic en "Finalizar torneo" para ver el podio.
            </Alert>
          </div>
        )}

        {tournament.status === 'playoffs' && (
          <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl">
            <p className="text-sm text-indigo-700 dark:text-indigo-400">
              💡 Haz clic en un partido para registrar el resultado. Los ganadores avanzan automáticamente.
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <BracketView
            slots={slots}
            matches={playoffMatches}
            onMatchClick={tournament.status === 'playoffs' ? handleMatchClick : undefined}
          />
        </div>
      </div>

      <MatchResultModal
        match={selectedMatch}
        open={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
        onSave={handleSaveResult}
      />
    </Layout>
  );
}
