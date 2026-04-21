import {
  collection,
  doc,
  writeBatch,
  getDocs,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { BracketSlot } from '@/types';

function bracketCol(tournamentId: string) {
  return collection(db, 'tournaments', tournamentId, 'bracket');
}

function toSlot(id: string, tournamentId: string, data: Record<string, unknown>): BracketSlot {
  return { id, tournamentId, ...(data as Omit<BracketSlot, 'id' | 'tournamentId'>) };
}

export async function saveBracketSlots(
  tournamentId: string,
  slots: Array<Omit<BracketSlot, 'tournamentId'>>
): Promise<void> {
  const batch = writeBatch(db);
  for (const s of slots) {
    const ref = doc(bracketCol(tournamentId), s.id);
    batch.set(ref, { ...s, tournamentId });
  }
  await batch.commit();
}

export async function getBracketSlots(tournamentId: string): Promise<BracketSlot[]> {
  const snap = await getDocs(bracketCol(tournamentId));
  return snap.docs.map((d) => toSlot(d.id, tournamentId, d.data() as Record<string, unknown>));
}

export function subscribeBracket(
  tournamentId: string,
  callback: (slots: BracketSlot[]) => void
): Unsubscribe {
  return onSnapshot(bracketCol(tournamentId), (snap) => {
    callback(snap.docs.map((d) => toSlot(d.id, tournamentId, d.data() as Record<string, unknown>)));
  });
}

export async function updateBracketSlot(
  tournamentId: string,
  slotId: string,
  data: Partial<Pick<BracketSlot, 'participantId' | 'participantName' | 'matchId'>>
): Promise<void> {
  await updateDoc(doc(bracketCol(tournamentId), slotId), data);
}
