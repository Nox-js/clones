import {
  collection,
  doc,
  addDoc,
  writeBatch,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Match, MatchPhase } from '@/types';

function matchesCol(tournamentId: string) {
  return collection(db, 'tournaments', tournamentId, 'matches');
}

function toMatch(id: string, tournamentId: string, data: Record<string, unknown>): Match {
  return { id, tournamentId, ...(data as Omit<Match, 'id' | 'tournamentId'>) };
}

export async function createMatch(
  tournamentId: string,
  data: Omit<Match, 'id' | 'tournamentId' | 'createdAt'>
): Promise<Match> {
  const ref = await addDoc(matchesCol(tournamentId), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, tournamentId, ...data, createdAt: serverTimestamp() as never };
}

export async function createMatchesBatch(
  tournamentId: string,
  matches: Array<Omit<Match, 'id' | 'tournamentId' | 'createdAt'>>
): Promise<void> {
  const batch = writeBatch(db);
  for (const m of matches) {
    const ref = doc(matchesCol(tournamentId));
    batch.set(ref, { ...m, createdAt: serverTimestamp() });
  }
  await batch.commit();
}

export async function getMatches(
  tournamentId: string,
  phase?: MatchPhase
): Promise<Match[]> {
  const constraints = phase
    ? [where('phase', '==', phase), orderBy('round', 'asc')]
    : [orderBy('round', 'asc')];
  const q = query(matchesCol(tournamentId), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => toMatch(d.id, tournamentId, d.data() as Record<string, unknown>));
}

export function subscribeMatches(
  tournamentId: string,
  callback: (matches: Match[]) => void
): Unsubscribe {
  const q = query(matchesCol(tournamentId), orderBy('round', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toMatch(d.id, tournamentId, d.data() as Record<string, unknown>)));
  });
}

export async function recordMatchResult(
  tournamentId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
  homeId: string,
  awayId: string
): Promise<void> {
  const winnerId = homeScore > awayScore ? homeId : homeScore < awayScore ? awayId : null;
  await updateDoc(doc(matchesCol(tournamentId), matchId), {
    homeScore,
    awayScore,
    winnerId,
    status: 'played',
  });
}
