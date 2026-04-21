import { useEffect, useState, useCallback } from 'react';
import type { Participant, ParticipantInput } from '@/types';
import {
  subscribeParticipants,
  addParticipant,
  updateParticipant,
  deleteParticipant,
} from '@/services/participantService';

export function useParticipants(tournamentId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    setLoading(true);
    const unsub = subscribeParticipants(tournamentId, (data) => {
      setParticipants(data);
      setLoading(false);
    });
    return unsub;
  }, [tournamentId]);

  const add = useCallback(
    async (input: ParticipantInput) => {
      try {
        const seed = participants.length + 1;
        await addParticipant(tournamentId, input, seed);
      } catch {
        setError('Error al añadir participante.');
      }
    },
    [tournamentId, participants.length]
  );

  const update = useCallback(
    async (id: string, data: Partial<ParticipantInput>) => {
      try {
        await updateParticipant(tournamentId, id, data);
      } catch {
        setError('Error al actualizar participante.');
      }
    },
    [tournamentId]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteParticipant(tournamentId, id);
      } catch {
        setError('Error al eliminar participante.');
      }
    },
    [tournamentId]
  );

  return { participants, loading, error, add, update, remove };
}
