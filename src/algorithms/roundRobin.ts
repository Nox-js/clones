/**
 * Generates a complete round-robin schedule using the polygon rotation method.
 * Each element in the returned matrix is a round; each round contains match pairs
 * as indices into the original participants array.
 */
export interface RoundRobinMatch {
  homeIndex: number;
  awayIndex: number;
}

export function generateRoundRobin(count: number): RoundRobinMatch[][] {
  if (count < 2) return [];

  const hasBye = count % 2 !== 0;
  const n = hasBye ? count + 1 : count;
  const numRounds = n - 1;
  const matchesPerRound = n / 2;

  // team[n-1] is the virtual "bye" team when count is odd
  const teams = Array.from({ length: n }, (_, i) => i);
  const rounds: RoundRobinMatch[][] = [];

  for (let round = 0; round < numRounds; round++) {
    const roundMatches: RoundRobinMatch[] = [];

    for (let slot = 0; slot < matchesPerRound; slot++) {
      const homeIdx = teams[slot];
      const awayIdx = teams[n - 1 - slot];

      // Skip slots that involve the bye position
      if (!hasBye || (homeIdx !== n - 1 && awayIdx !== n - 1)) {
        roundMatches.push({ homeIndex: homeIdx, awayIndex: awayIdx });
      }
    }

    rounds.push(roundMatches);

    // Rotate: keep teams[0] fixed, rotate the rest clockwise
    const last = teams[n - 1];
    for (let i = n - 1; i > 1; i--) {
      teams[i] = teams[i - 1];
    }
    teams[1] = last;
  }

  return rounds;
}

export function totalRoundRobinMatches(n: number): number {
  return (n * (n - 1)) / 2;
}
