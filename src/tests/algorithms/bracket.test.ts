import { describe, it, expect } from 'vitest';
import { generateBracket, propagateSemifinalResult } from '@/algorithms/bracket';
import type { Participant, BracketSlot } from '@/types';

function makeP(id: string, name: string): Participant {
  return { id, tournamentId: 't1', name, elo: null, seed: 0, createdAt: null as never };
}

const [p1, p2, p3, p4] = ['1', '2', '3', '4'].map((id) => makeP(id, `Team ${id}`));

describe('generateBracket', () => {
  it('throws for < 2 participants', () => {
    expect(() => generateBracket([], 't1')).toThrow();
    expect(() => generateBracket([p1], 't1')).toThrow();
  });

  it('generates direct final for 2 participants', () => {
    const { slots, hasThirdPlace } = generateBracket([p1, p2], 't1');
    expect(hasThirdPlace).toBe(false);
    const finalSlots = slots.filter((s) => s.round === 'final');
    expect(finalSlots).toHaveLength(2);
    expect(finalSlots[0].participantId).toBe('1');
    expect(finalSlots[1].participantId).toBe('2');
  });

  it('generates semis + final + 3rd for 4 participants', () => {
    const { slots, hasThirdPlace } = generateBracket([p1, p2, p3, p4], 't1');
    expect(hasThirdPlace).toBe(true);
    expect(slots.filter((s) => s.round === 'semifinal')).toHaveLength(4);
    expect(slots.filter((s) => s.round === 'final')).toHaveLength(2);
    expect(slots.filter((s) => s.round === 'third_place')).toHaveLength(2);
  });

  it('seeds 1st vs 4th and 2nd vs 3rd', () => {
    const { slots } = generateBracket([p1, p2, p3, p4], 't1');
    const sf1Home = slots.find((s) => s.round === 'semifinal' && s.position === 0);
    const sf1Away = slots.find((s) => s.round === 'semifinal' && s.position === 1);
    expect(sf1Home?.participantId).toBe('1'); // seed 1
    expect(sf1Away?.participantId).toBe('4'); // seed 4
  });
});

describe('propagateSemifinalResult', () => {
  it('propagates SF1 winner to final position 0 and loser to 3rd place position 0', () => {
    const { slots } = generateBracket([p1, p2, p3, p4], 't1');
    const fullSlots = slots as BracketSlot[];

    const updated = propagateSemifinalResult(
      fullSlots,
      0,
      '1', 'Team 1',
      '4', 'Team 4'
    );

    const finalSlot0 = updated.find((s) => s.round === 'final' && s.position === 0);
    const thirdSlot0 = updated.find((s) => s.round === 'third_place' && s.position === 0);

    expect(finalSlot0?.participantId).toBe('1');
    expect(thirdSlot0?.participantId).toBe('4');
  });

  it('propagates SF2 winner to final position 1 and loser to 3rd place position 1', () => {
    const { slots } = generateBracket([p1, p2, p3, p4], 't1');
    const fullSlots = slots as BracketSlot[];

    const updated = propagateSemifinalResult(
      fullSlots,
      1,
      '2', 'Team 2',
      '3', 'Team 3'
    );

    const finalSlot1 = updated.find((s) => s.round === 'final' && s.position === 1);
    const thirdSlot1 = updated.find((s) => s.round === 'third_place' && s.position === 1);

    expect(finalSlot1?.participantId).toBe('2');
    expect(thirdSlot1?.participantId).toBe('3');
  });
});
