import { describe, it, expect } from 'vitest';
import { generateRoundRobin, totalRoundRobinMatches } from '@/algorithms/roundRobin';

describe('generateRoundRobin', () => {
  it('returns empty for count < 2', () => {
    expect(generateRoundRobin(0)).toHaveLength(0);
    expect(generateRoundRobin(1)).toHaveLength(0);
  });

  it('generates correct number of rounds for even count', () => {
    // n=4 → 3 rounds
    expect(generateRoundRobin(4)).toHaveLength(3);
    // n=6 → 5 rounds
    expect(generateRoundRobin(6)).toHaveLength(5);
  });

  it('generates correct number of rounds for odd count', () => {
    // n=3 (odd) → 3 rounds (with bye)
    expect(generateRoundRobin(3)).toHaveLength(3);
    // n=5 → 5 rounds
    expect(generateRoundRobin(5)).toHaveLength(5);
  });

  it('total matches equals n*(n-1)/2', () => {
    for (const n of [4, 5, 6, 7, 8]) {
      const rounds = generateRoundRobin(n);
      const totalMatches = rounds.reduce((sum, r) => sum + r.length, 0);
      expect(totalMatches).toBe(totalRoundRobinMatches(n));
    }
  });

  it('each pair of participants meets exactly once', () => {
    const n = 6;
    const rounds = generateRoundRobin(n);
    const meetMap = new Map<string, number>();

    for (const round of rounds) {
      for (const { homeIndex, awayIndex } of round) {
        const key = [homeIndex, awayIndex].sort().join('-');
        meetMap.set(key, (meetMap.get(key) ?? 0) + 1);
      }
    }

    for (const count of meetMap.values()) {
      expect(count).toBe(1);
    }

    // Total unique pairs
    expect(meetMap.size).toBe(totalRoundRobinMatches(n));
  });

  it('all indices are valid for n=4', () => {
    const rounds = generateRoundRobin(4);
    for (const round of rounds) {
      for (const { homeIndex, awayIndex } of round) {
        expect(homeIndex).toBeGreaterThanOrEqual(0);
        expect(homeIndex).toBeLessThan(4);
        expect(awayIndex).toBeGreaterThanOrEqual(0);
        expect(awayIndex).toBeLessThan(4);
        expect(homeIndex).not.toBe(awayIndex);
      }
    }
  });
});

describe('totalRoundRobinMatches', () => {
  it('returns n*(n-1)/2', () => {
    expect(totalRoundRobinMatches(2)).toBe(1);
    expect(totalRoundRobinMatches(4)).toBe(6);
    expect(totalRoundRobinMatches(8)).toBe(28);
  });
});
