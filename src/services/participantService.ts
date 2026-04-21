import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Participant, ParticipantInput } from '@/types';

function participantsCol(tournamentId: string) {
  return collection(db, 'tournaments', tournamentId, 'participants');
}

function toParticipant(id: string, tournamentId: string, data: Record<string, unknown>): Participant {
  return { id, tournamentId, ...(data as Omit<Participant, 'id' | 'tournamentId'>) };
}

export async function addParticipant(
  tournamentId: string,
  input: ParticipantInput,
  seed: number
): Promise<Participant> {
  const ref = await addDoc(participantsCol(tournamentId), {
    ...input,
    seed,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, tournamentId, ...input, seed, createdAt: serverTimestamp() as never };
}

export async function getParticipants(tournamentId: string): Promise<Participant[]> {
  const q = query(participantsCol(tournamentId), orderBy('seed', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toParticipant(d.id, tournamentId, d.data() as Record<string, unknown>));
}

export function subscribeParticipants(
  tournamentId: string,
  callback: (participants: Participant[]) => void
): Unsubscribe {
  const q = query(participantsCol(tournamentId), orderBy('seed', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => toParticipant(d.id, tournamentId, d.data() as Record<string, unknown>))
    );
  });
}

export async function updateParticipant(
  tournamentId: string,
  participantId: string,
  data: Partial<ParticipantInput>
): Promise<void> {
  await updateDoc(doc(participantsCol(tournamentId), participantId), data);
}

export async function deleteParticipant(
  tournamentId: string,
  participantId: string
): Promise<void> {
  await deleteDoc(doc(participantsCol(tournamentId), participantId));
}

export async function reorderSeeds(
  tournamentId: string,
  participants: Participant[]
): Promise<void> {
  const updates = participants.map((p, i) =>
    updateDoc(doc(participantsCol(tournamentId), p.id), { seed: i + 1 })
  );
  await Promise.all(updates);
}
