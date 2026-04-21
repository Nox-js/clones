import { useEffect, useState, useCallback } from 'react';
import type { Match } from '@/types';
import { subscribeMatches, recordMatchResult } from '@/services/matchService';

export function useMatches(tournamentId: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    setLoading(true);
    const unsub = subscribeMatches(tournamentId, (data) => {
      setMatches(data);
      setLoading(false);
    });
    return unsub;
  }, [tournamentId]);

  const recordResult = useCallback(
    async (matchId: string, homeScore: number, awayScore: number) => {
      const match = matches.find((m) => m.id === matchId);
      if (!match) return;
      try {
        await recordMatchResult(
          tournamentId,
          matchId,
          homeScore,
          awayScore,
          match.homeId,
          match.awayId
        );
      } catch {
        setError('Error al guardar el resultado.');
      }
    },
    [tournamentId, matches]
  );

  return { matches, loading, error, recordResult };
}
