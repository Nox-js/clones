import { describe, it, expect } from 'vitest';
import { calculateStandings, sortStandings, initializeStandings } from '@/algorithms/standings';
import type { Participant, Match } from '@/types';

function makeP(id: string, name: string): Participant {
  return { id, tournamentId: 't1', name, elo: null, seed: 0, createdAt: null as never };
}

function makeMatch(
  id: string,
  homeId: string,
  awayId: string,
  homeScore: number | null,
  awayScore: number | null,
  groupId = 'g1'
): Match {
  const status = homeScore !== null ? 'played' : 'pending';
  const winnerId =
    homeScore !== null && awayScore !== null
      ? homeScore > awayScore ? homeId : awayScore > homeScore ? awayId : null
      : null;
  return {
    id, tournamentId: 't1', phase: 'groups', groupId, round: 1,
    homeId, awayId,
    homeName: homeId, awayName: awayId,
    homeScore, awayScore, winnerId, status,
    createdAt: null as never,
  };
}

const [A, B, C, D] = ['A', 'B', 'C', 'D'].map((n) => makeP(n, n));
const participants = [A, B, C, D];

describe('initializeStandings', () => {
  it('creates zero-value standings for all participants', () => {
    const s = initializeStandings(participants);
    expect(Object.keys(s)).toHaveLength(4);
    for (const st of Object.values(s)) {
      expect(st.points).toBe(0);
      expect(st.played).toBe(0);
    }
  });
});

describe('calculateStandings', () => {
  it('correctly awards 3 points for a win', () => {
    const matches = [makeMatch('m1', 'A', 'B', 2, 0)];
    const s = calculateStandings(participants, matches);
    expect(s['A'].points).toBe(3);
    expect(s['B'].points).toBe(0);
    expect(s['A'].won).toBe(1);
    expect(s['B'].lost).toBe(1);
  });

  it('awards 1 point each for a draw', () => {
    const matches = [makeMatch('m1', 'A', 'B', 1, 1)];
    const s = calculateStandings(participants, matches);
    expect(s['A'].points).toBe(1);
    expect(s['B'].points).toBe(1);
    expect(s['A'].drawn).toBe(1);
  });

  it('tracks goals correctly', () => {
    const matches = [makeMatch('m1', 'A', 'B', 3, 1)];
    const s = calculateStandings(participants, matches);
    expect(s['A'].goalsFor).toBe(3);
    expect(s['A'].goalsAgainst).toBe(1);
    expect(s['A'].goalDiff).toBe(2);
    expect(s['B'].goalsFor).toBe(1);
    expect(s['B'].goalsAgainst).toBe(3);
    expect(s['B'].goalDiff).toBe(-2);
  });

  it('ignores pending matches', () => {
    const matches = [makeMatch('m1', 'A', 'B', null, null)];
    const s = calculateStandings(participants, matches);
    expect(s['A'].played).toBe(0);
  });
});

describe('sortStandings', () => {
  it('sorts by points descending', () => {
    const matches = [
      makeMatch('m1', 'A', 'B', 2, 0),
      makeMatch('m2', 'C', 'D', 1, 0),
    ];
    const s = Object.values(calculateStandings(participants, matches));
    const sorted = sortStandings(s, matches);
    expect(sorted[0].participantId).toBe('A');
    expect(sorted[1].participantId).toBe('C');
  });

  it('uses goal difference as tiebreaker', () => {
    const matches = [
      makeMatch('m1', 'A', 'C', 3, 0), // A: 3pts, +3 GD
      makeMatch('m2', 'B', 'D', 1, 0), // B: 3pts, +1 GD
    ];
    const s = Object.values(calculateStandings(participants, matches));
    const sorted = sortStandings(s, matches);
    expect(sorted[0].participantId).toBe('A');
    expect(sorted[1].participantId).toBe('B');
  });
});
