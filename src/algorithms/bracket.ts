import type { Participant, BracketSlot, BracketRound } from '@/types';

export interface BracketData {
  slots: Array<Omit<BracketSlot, 'id'> & { id: string }>;
  hasThirdPlace: boolean;
}

function slot(
  tournamentId: string,
  round: BracketRound,
  position: number,
  participant: Participant | null
): BracketData['slots'][number] {
  return {
    id: `${round}_${position}`,
    tournamentId,
    round,
    position,
    participantId: participant?.id ?? null,
    participantName: participant?.name ?? null,
    matchId: null,
  };
}

/**
 * Generates initial bracket slots from ordered qualifiers.
 * Seeding: 1st vs 4th, 2nd vs 3rd in semis.
 *
 * ≥ 4 qualifiers → semifinals + final + 3rd-place match
 * 2-3 qualifiers → direct final
 */
export function generateBracket(qualifiers: Participant[], tournamentId: string): BracketData {
  const n = qualifiers.length;
  if (n < 2) throw new Error('Se necesitan al menos 2 participantes para el bracket.');

  if (n >= 4) {
    return {
      slots: [
        // Semifinal 1: seed 1 vs seed 4
        slot(tournamentId, 'semifinal', 0, qualifiers[0]),
        slot(tournamentId, 'semifinal', 1, qualifiers[3] ?? null),
        // Semifinal 2: seed 2 vs seed 3
        slot(tournamentId, 'semifinal', 2, qualifiers[1]),
        slot(tournamentId, 'semifinal', 3, qualifiers[2] ?? null),
        // Final (TBD)
        slot(tournamentId, 'final', 0, null),
        slot(tournamentId, 'final', 1, null),
        // 3rd place (TBD)
        slot(tournamentId, 'third_place', 0, null),
        slot(tournamentId, 'third_place', 1, null),
      ],
      hasThirdPlace: true,
    };
  }

  // Direct final
  return {
    slots: [
      slot(tournamentId, 'final', 0, qualifiers[0]),
      slot(tournamentId, 'final', 1, qualifiers[1] ?? null),
    ],
    hasThirdPlace: false,
  };
}

/**
 * After a semifinal result, propagates winner to the Final and loser to the 3rd-place match.
 * semifinalIndex: 0 = SF1 (positions 0-1), 1 = SF2 (positions 2-3)
 */
export function propagateSemifinalResult(
  slots: BracketSlot[],
  semifinalIndex: 0 | 1,
  winnerId: string,
  winnerName: string,
  loserId: string,
  loserName: string
): BracketSlot[] {
  const updated = slots.map((s) => ({ ...s }));

  const finalPos = semifinalIndex; // SF1 winner → final pos 0, SF2 winner → final pos 1
  const thirdPos = semifinalIndex; // SF1 loser → 3rd pos 0, SF2 loser → 3rd pos 1

  const finalSlot = updated.find((s) => s.round === 'final' && s.position === finalPos);
  const thirdSlot = updated.find(
    (s) => s.round === 'third_place' && s.position === thirdPos
  );

  if (finalSlot) {
    finalSlot.participantId = winnerId;
    finalSlot.participantName = winnerName;
  }
  if (thirdSlot) {
    thirdSlot.participantId = loserId;
    thirdSlot.participantName = loserName;
  }

  return updated;
}

/**
 * Returns the final ranking [1st, 2nd, 3rd, 4th] from resolved bracket slots.
 * Requires all matches to be played.
 */
export interface FinalRanking {
  position: number;
  participantId: string;
  participantName: string;
}

export function getFinalRanking(_slots: BracketSlot[], matches: import('@/types').Match[]): FinalRanking[] {
  const finalMatch = matches.find((m) => m.phase === 'final' && m.status === 'played');
  const thirdMatch = matches.find((m) => m.phase === 'third_place' && m.status === 'played');

  const ranking: FinalRanking[] = [];

  if (finalMatch?.winnerId) {
    const winner = finalMatch.winnerId === finalMatch.homeId
      ? { id: finalMatch.homeId, name: finalMatch.homeName }
      : { id: finalMatch.awayId, name: finalMatch.awayName };
    const loser = finalMatch.winnerId === finalMatch.homeId
      ? { id: finalMatch.awayId, name: finalMatch.awayName }
      : { id: finalMatch.homeId, name: finalMatch.homeName };

    ranking.push({ position: 1, participantId: winner.id, participantName: winner.name });
    ranking.push({ position: 2, participantId: loser.id, participantName: loser.name });
  }

  if (thirdMatch?.winnerId) {
    const winner = thirdMatch.winnerId === thirdMatch.homeId
      ? { id: thirdMatch.homeId, name: thirdMatch.homeName }
      : { id: thirdMatch.awayId, name: thirdMatch.awayName };
    const loser = thirdMatch.winnerId === thirdMatch.homeId
      ? { id: thirdMatch.awayId, name: thirdMatch.awayName }
      : { id: thirdMatch.homeId, name: thirdMatch.homeName };

    ranking.push({ position: 3, participantId: winner.id, participantName: winner.name });
    ranking.push({ position: 4, participantId: loser.id, participantName: loser.name });
  }

  return ranking;
}
