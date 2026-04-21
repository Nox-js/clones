import { useEffect, useState } from 'react';
import type { Tournament } from '@/types';
import { subscribeTournament } from '@/services/tournamentService';

export function useTournament(id: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsub = subscribeTournament(id, (data) => {
      setTournament(data);
      setLoading(false);
      if (!data) setError('Torneo no encontrado.');
    });
    return unsub;
  }, [id]);

  return { tournament, loading, error };
}
