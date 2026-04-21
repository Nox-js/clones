import type { Timestamp } from 'firebase/firestore';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: Timestamp;
}

// ─── Tournament ───────────────────────────────────────────────────────────────

export type TournamentStatus = 'draft' | 'groups' | 'playoffs' | 'finished';
export type TournamentFormat = 'groups+playoffs' | 'playoffs_only' | 'groups_only';
export type PairingMethod = 'balanced' | 'snake' | 'random';

export interface Tournament {
  id: string;
  name: string;
  gameName: string;
  gameIcon: string;
  description: string;
  status: TournamentStatus;
  format: TournamentFormat;
  pairingMethod: PairingMethod;
  hasElo: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TournamentCreateInput = Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Participant ──────────────────────────────────────────────────────────────

export interface Participant {
  id: string;
  tournamentId: string;
  name: string;
  elo: number | null;
  seed: number;
  createdAt: Timestamp;
}

export type ParticipantInput = {
  name: string;
  elo: number | null;
};

// ─── Group ────────────────────────────────────────────────────────────────────

export interface GroupStanding {
  participantId: string;
  participantName: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
}

export interface Group {
  id: string;
  tournamentId: string;
  name: string;
  participantIds: string[];
  standings: Record<string, GroupStanding>;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export type MatchPhase = 'groups' | 'semifinal' | 'third_place' | 'final';
export type MatchStatus = 'pending' | 'played';

export interface Match {
  id: string;
  tournamentId: string;
  phase: MatchPhase;
  groupId: string | null;
  round: number;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  status: MatchStatus;
  createdAt: Timestamp;
}

// ─── Bracket ──────────────────────────────────────────────────────────────────

export type BracketRound = 'semifinal' | 'third_place' | 'final';

export interface BracketSlot {
  id: string;
  tournamentId: string;
  round: BracketRound;
  position: number;
  participantId: string | null;
  participantName: string | null;
  matchId: string | null;
}
