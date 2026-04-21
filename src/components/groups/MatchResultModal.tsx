import { useState } from 'react';
import type { Match } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface MatchResultModalProps {
  match: Match | null;
  open: boolean;
  onClose: () => void;
  onSave: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
}

export function MatchResultModal({ match, open, onClose, onSave }: MatchResultModalProps) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => {
    if (match?.homeScore != null) setHomeScore(String(match.homeScore));
    else setHomeScore('');
    if (match?.awayScore != null) setAwayScore(String(match.awayScore));
    else setAwayScore('');
    setError('');
  };

  const handleSave = async () => {
    if (!match) return;
    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      setError('Introduce marcadores válidos (números ≥ 0).');
      return;
    }
    setLoading(true);
    try {
      await onSave(match.id, hs, as_);
      onClose();
    } catch {
      setError('Error al guardar el resultado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar resultado"
      size="sm"
    >
      <div onTransitionEnd={handleOpen}>
        {match && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {/* Home */}
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 text-center">Local</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center mb-2 truncate">
                  {match.homeName}
                </p>
                <input
                  type="number"
                  min={0}
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-full text-center text-2xl font-bold py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-0"
                  placeholder="0"
                />
              </div>

              <div className="text-2xl font-black text-gray-300 dark:text-gray-600 pb-2">–</div>

              {/* Away */}
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 text-center">Visitante</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center mb-2 truncate">
                  {match.awayName}
                </p>
                <input
                  type="number"
                  min={0}
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-full text-center text-2xl font-bold py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-0"
                  placeholder="0"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button className="flex-1" loading={loading} onClick={handleSave}>
                Guardar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Silence unused import warning
void Input;
