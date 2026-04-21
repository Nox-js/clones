import type { Match, Participant, GroupStanding } from '@/types';

export function initializeStandings(participants: Participant[]): Record<string, GroupStanding> {
  return Object.fromEntries(
    participants.map((p) => [
      p.id,
      {
        participantId: p.id,
        participantName: p.name,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
      } satisfies GroupStanding,
    ])
  );
}

export function calculateStandings(
  participants: Participant[],
  matches: Match[]
): Record<string, GroupStanding> {
  const standings = initializeStandings(participants);

  for (const match of matches) {
    if (match.status !== 'played' || match.homeScore === null || match.awayScore === null) {
      continue;
    }

    const home = standings[match.homeId];
    const away = standings[match.awayId];
    if (!home || !away) continue;

    const hg = match.homeScore;
    const ag = match.awayScore;

    home.played++;
    away.played++;
    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;
    home.goalDiff = home.goalsFor - home.goalsAgainst;
    away.goalDiff = away.goalsFor - away.goalsAgainst;

    if (hg > ag) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (ag > hg) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  return standings;
}

function h2hPoints(teamId: string, opponentId: string, matches: Match[]): number {
  let pts = 0;
  for (const m of matches) {
    if (m.status !== 'played') continue;
    if (m.homeId === teamId && m.awayId === opponentId) {
      if (m.homeScore! > m.awayScore!) pts += 3;
      else if (m.homeScore! === m.awayScore!) pts += 1;
    } else if (m.awayId === teamId && m.homeId === opponentId) {
      if (m.awayScore! > m.homeScore!) pts += 3;
      else if (m.awayScore! === m.homeScore!) pts += 1;
    }
  }
  return pts;
}

/**
 * Sorts standings with tiebreakers:
 * 1. Points
 * 2. Head-to-head points
 * 3. Goal difference
 * 4. Goals scored
 * 5. Alphabetical (deterministic)
 */
export function sortStandings(standings: GroupStanding[], matches: Match[]): GroupStanding[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    const h2hDiff =
      h2hPoints(b.participantId, a.participantId, matches) -
      h2hPoints(a.participantId, b.participantId, matches);
    if (h2hDiff !== 0) return h2hDiff;

    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    return a.participantName.localeCompare(b.participantName);
  });
}
