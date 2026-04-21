import type { Group, GroupStanding, Match } from '@/types';
import { sortStandings } from '@/algorithms/standings';

interface GroupTableProps {
  group: Group;
  matches: Match[];
}

export function GroupTable({ group, matches }: GroupTableProps) {
  const groupMatches = matches.filter((m) => m.groupId === group.id);
  const standingsList = Object.values(group.standings);
  const sorted = sortStandings(standingsList, groupMatches);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-8">#</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Equipo</th>
            <th className="text-center px-2 py-3 font-semibold text-gray-600 dark:text-gray-400">PJ</th>
            <th className="text-center px-2 py-3 font-semibold text-gray-600 dark:text-gray-400">G</th>
            <th className="text-center px-2 py-3 font-semibold text-gray-600 dark:text-gray-400">P</th>
            <th className="text-center px-2 py-3 font-semibold text-gray-600 dark:text-gray-400">GF</th>
            <th className="text-center px-2 py-3 font-semibold text-gray-600 dark:text-gray-400">GC</th>
            <th className="text-center px-2 py-3 font-semibold text-gray-600 dark:text-gray-400">DG</th>
            <th className="text-center px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((standing, idx) => (
            <StandingRow key={standing.participantId} standing={standing} position={idx + 1} />
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center py-6 text-gray-400 dark:text-gray-500">
                Sin resultados aún
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StandingRow({ standing, position }: { standing: GroupStanding; position: number }) {
  const isTop2 = position <= 2;

  return (
    <tr
      className={`border-b last:border-0 border-gray-100 dark:border-gray-800 transition-colors ${
        isTop2
          ? 'bg-indigo-50/50 dark:bg-indigo-900/10'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
      }`}
    >
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
            position === 1
              ? 'bg-yellow-400 text-yellow-900'
              : position === 2
              ? 'bg-gray-300 text-gray-700'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {position}
        </span>
      </td>
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
        {standing.participantName}
      </td>
      <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-400">{standing.played}</td>
      <td className="px-2 py-3 text-center text-green-600 dark:text-green-400 font-medium">{standing.won}</td>
      <td className="px-2 py-3 text-center text-red-500 dark:text-red-400">{standing.lost}</td>
      <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-400">{standing.goalsFor}</td>
      <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-400">{standing.goalsAgainst}</td>
      <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-400">
        {standing.goalDiff > 0 ? `+${standing.goalDiff}` : standing.goalDiff}
      </td>
      <td className="px-3 py-3 text-center">
        <span className="font-bold text-gray-900 dark:text-white">{standing.points}</span>
      </td>
    </tr>
  );
}
