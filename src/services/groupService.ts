import {
  collection,
  doc,
  addDoc,
  writeBatch,
  getDocs,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Group, GroupStanding } from '@/types';

function groupsCol(tournamentId: string) {
  return collection(db, 'tournaments', tournamentId, 'groups');
}

function toGroup(id: string, tournamentId: string, data: Record<string, unknown>): Group {
  return { id, tournamentId, ...(data as Omit<Group, 'id' | 'tournamentId'>) };
}

export async function createGroup(
  tournamentId: string,
  data: Omit<Group, 'id' | 'tournamentId'>
): Promise<Group> {
  const ref = await addDoc(groupsCol(tournamentId), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, tournamentId, ...data };
}

export async function createGroupsBatch(
  tournamentId: string,
  groups: Array<Omit<Group, 'id' | 'tournamentId'>>
): Promise<void> {
  const batch = writeBatch(db);
  for (const g of groups) {
    const ref = doc(groupsCol(tournamentId));
    batch.set(ref, { ...g, createdAt: serverTimestamp() });
  }
  await batch.commit();
}

export async function getGroups(tournamentId: string): Promise<Group[]> {
  const snap = await getDocs(groupsCol(tournamentId));
  return snap.docs.map((d) => toGroup(d.id, tournamentId, d.data() as Record<string, unknown>));
}

export function subscribeGroups(
  tournamentId: string,
  callback: (groups: Group[]) => void
): Unsubscribe {
  return onSnapshot(groupsCol(tournamentId), (snap) => {
    callback(snap.docs.map((d) => toGroup(d.id, tournamentId, d.data() as Record<string, unknown>)));
  });
}

export async function updateGroupStandings(
  tournamentId: string,
  groupId: string,
  standings: Record<string, GroupStanding>
): Promise<void> {
  await updateDoc(doc(groupsCol(tournamentId), groupId), { standings });
}
