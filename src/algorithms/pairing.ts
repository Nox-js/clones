import type { Participant, PairingMethod } from '@/types';

export interface Pair {
  home: Participant;
  away: Participant;
  eloDiff: number | null;
}

function eloDiff(a: Participant, b: Participant): number | null {
  if (a.elo === null || b.elo === null) return null;
  return Math.abs(a.elo - b.elo);
}

function sortByEloDesc(participants: Participant[]): Participant[] {
  return [...participants].sort((a, b) => {
    if (a.elo === null && b.elo === null) return 0;
    if (a.elo === null) return 1;
    if (b.elo === null) return -1;
    return b.elo - a.elo;
  });
}

function makePairs(ordered: Participant[]): Pair[] {
  const pairs: Pair[] = [];
  for (let i = 0; i + 1 < ordered.length; i += 2) {
    const home = ordered[i];
    const away = ordered[i + 1];
    pairs.push({ home, away, eloDiff: eloDiff(home, away) });
  }
  return pairs;
}

/**
 * Balanced: sort by ELO desc, pair adjacent (1st-2nd, 3rd-4th…).
 * Minimizes ELO difference within each pair.
 */
export function balancedPairing(participants: Participant[]): Pair[] {
  return makePairs(sortByEloDesc(participants));
}

/**
 * Snake: sort by ELO desc, pair 1st with last, 2nd with second-to-last, etc.
 * Distributes strength evenly (1+N, 2+N-1, …).
 */
export function snakePairing(participants: Participant[]): Pair[] {
  const sorted = sortByEloDesc(participants);
  const n = sorted.length;
  const pairs: Pair[] = [];
  for (let i = 0; i < Math.floor(n / 2); i++) {
    const home = sorted[i];
    const away = sorted[n - 1 - i];
    pairs.push({ home, away, eloDiff: eloDiff(home, away) });
  }
  return pairs;
}

/**
 * Random: shuffle participants, pair sequentially.
 */
export function randomPairing(participants: Participant[]): Pair[] {
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  return makePairs(shuffled);
}

export function getPairs(participants: Participant[], method: PairingMethod): Pair[] {
  if (participants.length < 2) return [];
  switch (method) {
    case 'balanced':
      return balancedPairing(participants);
    case 'snake':
      return snakePairing(participants);
    case 'random':
      return randomPairing(participants);
  }
}
