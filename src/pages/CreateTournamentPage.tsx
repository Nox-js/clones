import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { createTournament } from '@/services/tournamentService';
import type { TournamentFormat, PairingMethod } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const PRESET_GAMES = [
  { icon: '⚽', name: 'FIFA / FC' },
  { icon: '🎮', name: 'Call of Duty' },
  { icon: '🏀', name: 'NBA 2K' },
  { icon: '⚔️', name: 'Age of Empires' },
  { icon: '♟️', name: 'Ajedrez' },
  { icon: '🎯', name: 'Dardos' },
  { icon: '🏓', name: 'Ping Pong' },
  { icon: '🃏', name: 'Poker' },
  { icon: '🎱', name: 'Billar' },
  { icon: '🏆', name: 'Personalizado' },
];

export function CreateTournamentPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [selectedGame, setSelectedGame] = useState<{ icon: string; name: string } | null>(null);
  const [customGameName, setCustomGameName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('groups+playoffs');
  const [pairingMethod, setPairingMethod] = useState<PairingMethod>('balanced');
  const [hasElo, setHasElo] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gameName = selectedGame?.name === 'Personalizado' ? customGameName : selectedGame?.name ?? '';
  const gameIcon = selectedGame?.icon ?? '🏆';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('El nombre del torneo es obligatorio.'); return; }
    if (!gameName.trim()) { setError('Elige o escribe el nombre del juego.'); return; }

    setLoading(true);
    try {
      const tournament = await createTournament({
        name: name.trim(),
        gameName: gameName.trim(),
        gameIcon,
        description: description.trim(),
        status: 'draft',
        format,
        pairingMethod,
        hasElo,
        createdBy: user!.uid,
      });
      navigate(`/tournaments/${tournament.id}`);
    } catch {
      setError('No se pudo crear el torneo. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Crear torneo</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          Configura los detalles de tu torneo. Podrás añadir participantes después.
        </p>

        {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <Card>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Información básica</h2>
            <div className="space-y-4">
              <Input
                label="Nombre del torneo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Copa de Verano 2025"
                required
              />
              <Input
                label="Descripción (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Torneo amistoso entre amigos"
              />
            </div>
          </Card>

          {/* Game */}
          <Card>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Juego</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
              {PRESET_GAMES.map((game) => (
                <button
                  key={game.name}
                  type="button"
                  onClick={() => setSelectedGame(game)}
                  className={[
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium',
                    selectedGame?.name === game.name
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400',
                  ].join(' ')}
                >
                  <span className="text-2xl">{game.icon}</span>
                  <span className="text-center leading-tight">{game.name}</span>
                </button>
              ))}
            </div>
            {selectedGame?.name === 'Personalizado' && (
              <Input
                label="Nombre del juego"
                value={customGameName}
                onChange={(e) => setCustomGameName(e.target.value)}
                placeholder="Ej: Dominó"
                required
              />
            )}
          </Card>

          {/* Format */}
          <Card>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Formato del torneo</h2>
            <div className="space-y-4">
              <Select
                label="Estructura"
                value={format}
                onChange={(e) => setFormat(e.target.value as TournamentFormat)}
                options={[
                  { value: 'groups+playoffs', label: 'Fase de grupos + Eliminatorias' },
                  { value: 'playoffs_only', label: 'Solo eliminatorias (bracket)' },
                  { value: 'groups_only', label: 'Solo fase de grupos' },
                ]}
              />

              <Select
                label="Método de emparejamiento"
                value={pairingMethod}
                onChange={(e) => setPairingMethod(e.target.value as PairingMethod)}
                options={[
                  { value: 'balanced', label: 'Equilibrado (diferencia mínima de ELO)' },
                  { value: 'snake', label: 'Snake (1.º vs último, 2.º vs penúltimo…)' },
                  { value: 'random', label: 'Aleatorio' },
                ]}
              />

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <input
                  type="checkbox"
                  id="hasElo"
                  checked={hasElo}
                  onChange={(e) => setHasElo(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <label htmlFor="hasElo" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                    Usar sistema ELO
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Permite registrar y mostrar la puntuación ELO de cada participante
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1" size="lg">
              Crear torneo
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
