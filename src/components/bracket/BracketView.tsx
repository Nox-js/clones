import type { BracketSlot, Match } from '@/types';

interface BracketViewProps {
  slots: BracketSlot[];
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}

export function BracketView({ slots, matches, onMatchClick }: BracketViewProps) {
  const sf1Home = slots.find((s) => s.round === 'semifinal' && s.position === 0);
  const sf1Away = slots.find((s) => s.round === 'semifinal' && s.position === 1);
  const sf2Home = slots.find((s) => s.round === 'semifinal' && s.position === 2);
  const sf2Away = slots.find((s) => s.round === 'semifinal' && s.position === 3);
  const finalHome = slots.find((s) => s.round === 'final' && s.position === 0);
  const finalAway = slots.find((s) => s.round === 'final' && s.position === 1);
  const thirdHome = slots.find((s) => s.round === 'third_place' && s.position === 0);
  const thirdAway = slots.find((s) => s.round === 'third_place' && s.position === 1);

  const sf1Match = matches.find((m) => m.phase === 'semifinal' && m.homeId === (sf1Home?.participantId ?? ''));
  const sf2Match = matches.find((m) => m.phase === 'semifinal' && m.homeId === (sf2Home?.participantId ?? ''));
  const finalMatch = matches.find((m) => m.phase === 'final');
  const thirdMatch = matches.find((m) => m.phase === 'third_place');

  const hasSemifinals = sf1Home !== undefined;

  if (!hasSemifinals) {
    // Direct final
    return (
      <div className="flex flex-col items-center py-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">🏆 Final</h3>
        <BracketMatch
          match={finalMatch}
          homeSlot={finalHome}
          awaySlot={finalAway}
          label="FINAL"
          onClick={onMatchClick ? () => finalMatch && onMatchClick(finalMatch) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto py-6">
      <div className="min-w-[640px] flex items-center justify-center gap-4 px-4">
        {/* Semis column */}
        <div className="flex flex-col gap-8 w-56">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
              Semifinal 1
            </p>
            <BracketMatch
              match={sf1Match}
              homeSlot={sf1Home}
              awaySlot={sf1Away}
              label="SF1"
              onClick={onMatchClick ? () => sf1Match && onMatchClick(sf1Match) : undefined}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
              Semifinal 2
            </p>
            <BracketMatch
              match={sf2Match}
              homeSlot={sf2Home}
              awaySlot={sf2Away}
              label="SF2"
              onClick={onMatchClick ? () => sf2Match && onMatchClick(sf2Match) : undefined}
            />
          </div>
        </div>

        {/* Connector arrows */}
        <div className="flex flex-col items-center gap-4 text-gray-300 dark:text-gray-700">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Final + 3rd */}
        <div className="flex flex-col gap-8 w-56">
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 text-center">
              🏆 Final
            </p>
            <BracketMatch
              match={finalMatch}
              homeSlot={finalHome}
              awaySlot={finalAway}
              label="FINAL"
              highlight
              onClick={onMatchClick ? () => finalMatch && onMatchClick(finalMatch) : undefined}
            />
          </div>
          {thirdHome && (
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 text-center">
                🥉 3.er puesto
              </p>
              <BracketMatch
                match={thirdMatch}
                homeSlot={thirdHome}
                awaySlot={thirdAway}
                label="3RD"
                onClick={onMatchClick ? () => thirdMatch && onMatchClick(thirdMatch) : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface BracketMatchProps {
  match: Match | undefined;
  homeSlot: BracketSlot | undefined;
  awaySlot: BracketSlot | undefined;
  label: string;
  highlight?: boolean;
  onClick?: () => void;
}

function BracketMatch({ match, homeSlot, awaySlot, highlight, onClick }: BracketMatchProps) {
  const homeName = homeSlot?.participantName ?? 'Por determinar';
  const awayName = awaySlot?.participantName ?? 'Por determinar';
  const isPlayed = match?.status === 'played';
  const homeWin = match?.winnerId === match?.homeId;
  const awayWin = match?.winnerId === match?.awayId;

  return (
    <button
      onClick={onClick}
      disabled={!onClick || !homeSlot?.participantId || !awaySlot?.participantId}
      className={[
        'w-full rounded-xl border-2 overflow-hidden text-left transition-all',
        highlight
          ? 'border-amber-400/60 dark:border-amber-500/40 shadow-lg shadow-amber-500/10'
          : 'border-gray-200 dark:border-gray-700',
        onClick && homeSlot?.participantId && awaySlot?.participantId
          ? 'hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer hover:shadow-md'
          : 'cursor-default',
      ].join(' ')}
    >
      {/* Home */}
      <div
        className={[
          'flex items-center justify-between px-4 py-3 border-b',
          isPlayed && homeWin
            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'
            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800',
        ].join(' ')}
      >
        <span
          className={`text-sm font-semibold truncate ${
            homeSlot?.participantId
              ? isPlayed && homeWin
                ? 'text-green-700 dark:text-green-400'
                : 'text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-600 italic'
          }`}
        >
          {homeName}
        </span>
        {isPlayed && (
          <span className={`text-sm font-bold ml-2 ${homeWin ? 'text-green-700 dark:text-green-400' : 'text-gray-400'}`}>
            {match?.homeScore}
          </span>
        )}
      </div>
      {/* Away */}
      <div
        className={[
          'flex items-center justify-between px-4 py-3',
          isPlayed && awayWin
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-white dark:bg-gray-900',
        ].join(' ')}
      >
        <span
          className={`text-sm font-semibold truncate ${
            awaySlot?.participantId
              ? isPlayed && awayWin
                ? 'text-green-700 dark:text-green-400'
                : 'text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-600 italic'
          }`}
        >
          {awayName}
        </span>
        {isPlayed && (
          <span className={`text-sm font-bold ml-2 ${awayWin ? 'text-green-700 dark:text-green-400' : 'text-gray-400'}`}>
            {match?.awayScore}
          </span>
        )}
      </div>
    </button>
  );
}
