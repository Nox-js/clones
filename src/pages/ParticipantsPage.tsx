import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import { useParticipants } from '@/hooks/useParticipants';
import { updateTournamentStatus } from '@/services/tournamentService';
import { createGroupsBatch } from '@/services/groupService';
import { createMatchesBatch } from '@/services/matchService';
import { saveBracketSlots } from '@/services/bracketService';
import { generateRoundRobin } from '@/algorithms/roundRobin';
import { generateBracket } from '@/algorithms/bracket';
import { initializeStandings } from '@/algorithms/standings';
import type { Match, Group } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';

export function ParticipantsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament } = useTournament(id);
  const { participants, loading, add, update, remove } = useParticipants(id);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formElo, setFormElo] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [numGroups, setNumGroups] = useState(2);
  const [showGroupSetup, setShowGroupSetup] = useState(false);

  const openAdd = () => {
    setFormName(''); setFormElo(''); setFormError('');
    setShowAddModal(true);
  };

  const openEdit = (id: string) => {
    const p = participants.find((p) => p.id === id);
    if (!p) return;
    setFormName(p.name);
    setFormElo(p.elo != null ? String(p.elo) : '');
    setFormError('');
    setEditingId(id);
  };

  const handleSaveParticipant = async () => {
    if (!formName.trim()) { setFormError('El nombre es obligatorio.'); return; }
    const elo = formElo.trim() ? parseInt(formElo) : null;
    if (formElo.trim() && (isNaN(elo!) || elo! < 0)) {
      setFormError('El ELO debe ser un número positivo.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await update(editingId, { name: formName.trim(), elo });
        setEditingId(null);
      } else {
        await add({ name: formName.trim(), elo });
        setShowAddModal(false);
      }
    } catch {
      setFormError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  // Generate group phase
  const handleGenerateGroups = async () => {
    if (participants.length < 2) { setActionError('Necesitas al menos 2 participantes.'); return; }
    setSaving(true);
    setActionError('');
    try {
      const groups: Omit<Group, 'id' | 'tournamentId'>[] = [];
      const groupParticipants: string[][] = Array.from({ length: numGroups }, () => []);

      // Snake distribution: 1→G0, 2→G1, 3→G1, 4→G0 (snake)
      participants.forEach((p, i) => {
        const chunk = Math.floor(i / numGroups);
        const posInChunk = i % numGroups;
        const groupIdx = chunk % 2 === 0 ? posInChunk : numGroups - 1 - posInChunk;
        groupParticipants[groupIdx].push(p.id);
      });

      for (let g = 0; g < numGroups; g++) {
        const pIds = groupParticipants[g];
        const pList = participants.filter((p) => pIds.includes(p.id));
        const standings = initializeStandings(pList);
        groups.push({
          name: `Grupo ${String.fromCharCode(65 + g)}`,
          participantIds: pIds,
          standings,
        });
      }

      await createGroupsBatch(id, groups);

      // Generate round-robin matches for each group
      const allMatches: Omit<Match, 'id' | 'tournamentId' | 'createdAt'>[] = [];
      groups.forEach((g, gIdx) => {
        const pIds = g.participantIds;
        const pList = participants.filter((p) => pIds.includes(p.id));
        const rounds = generateRoundRobin(pList.length);
        rounds.forEach((round, roundIdx) => {
          round.forEach((match) => {
            allMatches.push({
              phase: 'groups',
              groupId: `group_${gIdx}`,
              round: roundIdx + 1,
              homeId: pList[match.homeIndex].id,
              awayId: pList[match.awayIndex].id,
              homeName: pList[match.homeIndex].name,
              awayName: pList[match.awayIndex].name,
              homeScore: null,
              awayScore: null,
              winnerId: null,
              status: 'pending',
            });
          });
        });
      });

      await createMatchesBatch(id, allMatches);
      await updateTournamentStatus(id, 'groups');
      navigate(`/tournaments/${id}/groups`);
    } catch (err) {
      console.error(err);
      setActionError('Error al generar los grupos. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // Generate bracket directly (playoffs_only)
  const handleGenerateBracket = async () => {
    if (participants.length < 2) { setActionError('Necesitas al menos 2 participantes.'); return; }
    setSaving(true);
    setActionError('');
    try {
      const { slots } = generateBracket(participants, id);
      await saveBracketSlots(id, slots);

      // Create playoff matches
      await createPlayoffMatches(id, slots, participants);
      await updateTournamentStatus(id, 'playoffs');
      navigate(`/tournaments/${id}/bracket`);
    } catch (err) {
      console.error(err);
      setActionError('Error al generar el bracket.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(`/tournaments/${id}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al torneo
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Participantes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {participants.length} participante{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
          {tournament?.status === 'draft' && (
            <Button onClick={openAdd}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Añadir
            </Button>
          )}
        </div>

        {actionError && (
          <div className="mb-4">
            <Alert type="error" onClose={() => setActionError('')}>{actionError}</Alert>
          </div>
        )}

        {/* Participant list */}
        {participants.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Sin participantes"
            description="Añade los equipos o jugadores que participarán en el torneo."
            action={
              tournament?.status === 'draft' ? (
                <Button onClick={openAdd}>Añadir participante</Button>
              ) : undefined
            }
          />
        ) : (
          <Card padding="none" className="mb-6 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {participants.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 font-medium text-gray-900 dark:text-gray-100 text-sm">{p.name}</span>
                  {tournament?.hasElo && (
                    <span className="text-xs font-mono bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800/50">
                      {p.elo != null ? `ELO ${p.elo}` : 'Sin ELO'}
                    </span>
                  )}
                  {tournament?.status === 'draft' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(p.id)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Start tournament section */}
        {tournament?.status === 'draft' && participants.length >= 2 && (
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              ¿Listo para empezar?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Tienes {participants.length} participantes. Genera la siguiente fase del torneo.
            </p>

            {tournament.format === 'groups+playoffs' || tournament.format === 'groups_only' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Número de grupos:
                  </label>
                  <select
                    value={numGroups}
                    onChange={(e) => setNumGroups(Number(e.target.value))}
                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n} grupo{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={() => setShowGroupSetup(true)} loading={saving} size="lg" className="w-full">
                  🏁 Generar fase de grupos
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerateBracket} loading={saving} size="lg" className="w-full">
                🏅 Generar bracket de eliminatorias
              </Button>
            )}
          </Card>
        )}

        {/* Modals */}
        <Modal
          open={showAddModal || editingId !== null}
          onClose={() => { setShowAddModal(false); setEditingId(null); }}
          title={editingId ? 'Editar participante' : 'Añadir participante'}
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Nombre"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Equipo Rojo"
              error={formError}
              required
            />
            {tournament?.hasElo && (
              <Input
                label="ELO (opcional)"
                type="number"
                value={formElo}
                onChange={(e) => setFormElo(e.target.value)}
                placeholder="Ej: 1500"
                min={0}
              />
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowAddModal(false); setEditingId(null); }}>
                Cancelar
              </Button>
              <Button className="flex-1" loading={saving} onClick={handleSaveParticipant}>
                Guardar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Confirm group setup */}
        <Modal
          open={showGroupSetup}
          onClose={() => setShowGroupSetup(false)}
          title="Confirmar fase de grupos"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Se crearán <strong>{numGroups} grupo{numGroups > 1 ? 's' : ''}</strong> con los <strong>{participants.length} participantes</strong> distribuidos de forma equilibrada (método snake).
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              ⚠️ Una vez generados los grupos, no podrás añadir ni eliminar participantes.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowGroupSetup(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" loading={saving} onClick={() => { setShowGroupSetup(false); handleGenerateGroups(); }}>
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}

// Helper: create playoff match entries for the bracket
async function createPlayoffMatches(
  tournamentId: string,
  slots: { round: string; position: number; participantId: string | null; participantName: string | null }[],
  _participants: { id: string; name: string }[]
) {
  const batch = createMatchesBatch;
  const matches: Omit<Match, 'id' | 'tournamentId' | 'createdAt'>[] = [];

  const semifinalPairs = [
    { homePos: 0, awayPos: 1 }, // SF1
    { homePos: 2, awayPos: 3 }, // SF2
  ];

  const hasSemis = slots.some((s) => s.round === 'semifinal');

  if (hasSemis) {
    for (const pair of semifinalPairs) {
      const home = slots.find((s) => s.round === 'semifinal' && s.position === pair.homePos);
      const away = slots.find((s) => s.round === 'semifinal' && s.position === pair.awayPos);
      if (home?.participantId && away?.participantId) {
        matches.push({
          phase: 'semifinal',
          groupId: null,
          round: 1,
          homeId: home.participantId,
          awayId: away.participantId,
          homeName: home.participantName!,
          awayName: away.participantName!,
          homeScore: null,
          awayScore: null,
          winnerId: null,
          status: 'pending',
        });
      }
    }
    // Placeholder final + 3rd place
    matches.push(
      { phase: 'final', groupId: null, round: 2, homeId: 'tbd', awayId: 'tbd', homeName: 'Por determinar', awayName: 'Por determinar', homeScore: null, awayScore: null, winnerId: null, status: 'pending' },
      { phase: 'third_place', groupId: null, round: 2, homeId: 'tbd', awayId: 'tbd', homeName: 'Por determinar', awayName: 'Por determinar', homeScore: null, awayScore: null, winnerId: null, status: 'pending' }
    );
  } else {
    const home = slots.find((s) => s.round === 'final' && s.position === 0);
    const away = slots.find((s) => s.round === 'final' && s.position === 1);
    if (home?.participantId && away?.participantId) {
      matches.push({
        phase: 'final', groupId: null, round: 1,
        homeId: home.participantId, awayId: away.participantId,
        homeName: home.participantName!, awayName: away.participantName!,
        homeScore: null, awayScore: null, winnerId: null, status: 'pending',
      });
    }
  }

  await batch(tournamentId, matches);
}
