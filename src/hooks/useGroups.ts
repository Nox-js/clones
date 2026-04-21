import { useEffect, useState } from 'react';
import type { Group } from '@/types';
import { subscribeGroups } from '@/services/groupService';

export function useGroups(tournamentId: string) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;
    setLoading(true);
    const unsub = subscribeGroups(tournamentId, (data) => {
      setGroups(data.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
    return unsub;
  }, [tournamentId]);

  return { groups, loading };
}
