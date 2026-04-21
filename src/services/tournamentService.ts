import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Tournament, TournamentCreateInput, TournamentStatus } from '@/types';

const COL = 'tournaments';

function toTournament(id: string, data: Record<string, unknown>): Tournament {
  return { id, ...(data as Omit<Tournament, 'id'>) };
}

export async function createTournament(
  input: TournamentCreateInput
): Promise<Tournament> {
  const ref = await addDoc(collection(db, COL), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return toTournament(snap.id, snap.data() as Record<string, unknown>);
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return toTournament(snap.id, snap.data() as Record<string, unknown>);
}

export async function getUserTournaments(userId: string): Promise<Tournament[]> {
  const q = query(
    collection(db, COL),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toTournament(d.id, d.data() as Record<string, unknown>));
}

export function subscribeUserTournaments(
  userId: string,
  callback: (tournaments: Tournament[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COL),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toTournament(d.id, d.data() as Record<string, unknown>)));
  });
}

export function subscribeTournament(
  id: string,
  callback: (tournament: Tournament | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, COL, id), (snap) => {
    callback(snap.exists() ? toTournament(snap.id, snap.data() as Record<string, unknown>) : null);
  });
}

export async function updateTournamentStatus(
  id: string,
  status: TournamentStatus
): Promise<void> {
  await updateDoc(doc(db, COL, id), { status, updatedAt: serverTimestamp() });
}

export async function updateTournament(
  id: string,
  data: Partial<Omit<Tournament, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTournament(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
