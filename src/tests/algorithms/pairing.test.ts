import { describe, it, expect } from 'vitest';
import { balancedPairing, snakePairing, randomPairing, getPairs } from '@/algorithms/pairing';
import type { Participant } from '@/types';

function makeParticipant(id: string, name: string, elo: number | null = null): Participant {
  return { id, tournamentId: 't1', name, elo, seed: 0, createdAt: null as never };
}

const p = [
  makeParticipant('1', 'A', 2000),
  makeParticipant('2', 'B', 1800),
  makeParticipant('3', 'C', 1600),
  makeParticipant('4', 'D', 1400),
  makeParticipant('5', 'E', 1200),
  makeParticipant('6', 'F', 1000),
  makeParticipant('7', 'G', 800),
  makeParticipant('8', 'H', 600),
];

describe('balancedPairing', () => {
  it('produces n/2 pairs from n participants', () => {
    expect(balancedPairing(p)).toHaveLength(4);
  });

  it('pairs adjacent ELOs (smallest difference within pair)', () => {
    const pairs = balancedPairing(p);
    // Pair 1: 2000 vs 1800 → diff 200
    expect(pairs[0].eloDiff).toBe(200);
    // Pair 2: 1600 vs 1400 → diff 200
    expect(pairs[1].eloDiff).toBe(200);
  });

  it('each participant appears exactly once', () => {
    const pairs = balancedPairing(p);
    const ids = pairs.flatMap((pair) => [pair.home.id, pair.away.id]);
    expect(new Set(ids).size).toBe(p.length);
  });

  it('handles 2 participants', () => {
    const pairs = balancedPairing(p.slice(0, 2));
    expect(pairs).toHaveLength(1);
  });

  it('handles participants without ELO', () => {
    const noElo = [
      makeParticipant('a', 'X'),
      makeParticipant('b', 'Y'),
    ];
    const pairs = balancedPairing(noElo);
    expect(pairs[0].eloDiff).toBeNull();
  });
});

describe('snakePairing', () => {
  it('pairs 1st with last, 2nd with second-to-last', () => {
    const pairs = snakePairing(p);
    expect(pairs[0].home.id).toBe('1'); // highest ELO
    expect(pairs[0].away.id).toBe('8'); // lowest ELO
    expect(pairs[1].home.id).toBe('2');
    expect(pairs[1].away.id).toBe('7');
  });

  it('produces n/2 pairs', () => {
    expect(snakePairing(p)).toHaveLength(4);
  });

  it('each participant appears exactly once', () => {
    const pairs = snakePairing(p);
    const ids = pairs.flatMap((pair) => [pair.home.id, pair.away.id]);
    expect(new Set(ids).size).toBe(p.length);
  });
});

describe('randomPairing', () => {
  it('produces n/2 pairs', () => {
    expect(randomPairing(p)).toHaveLength(4);
  });

  it('each participant appears exactly once', () => {
    const pairs = randomPairing(p);
    const ids = pairs.flatMap((pair) => [pair.home.id, pair.away.id]);
    expect(new Set(ids).size).toBe(p.length);
  });
});

describe('getPairs', () => {
  it('returns empty array for < 2 participants', () => {
    expect(getPairs([p[0]], 'balanced')).toHaveLength(0);
    expect(getPairs([], 'random')).toHaveLength(0);
  });

  it('delegates to correct algorithm', () => {
    const balanced = getPairs(p, 'balanced');
    const snake = getPairs(p, 'snake');
    expect(balanced[0].eloDiff).toBe(200);
    expect(snake[0].home.id).toBe('1');
    expect(snake[0].away.id).toBe('8');
  });
});
