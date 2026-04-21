import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { signUp, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await signUp(email, password, name.trim());
      navigate('/dashboard', { replace: true });
    } catch {
      // error handled in store
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-gray-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-white font-black text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">TourneyHub</h1>
          <p className="text-gray-400 text-sm mt-1">Crea tu cuenta gratuita</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Crear cuenta</h2>

          {displayError && (
            <div className="mb-4">
              <Alert type="error" onClose={() => { clearError(); setLocalError(''); }}>
                {displayError}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(['Nombre', 'Correo electrónico', 'Contraseña', 'Repetir contraseña'] as const).map(
              (_, idx) => {
                const configs = [
                  { label: 'Nombre', type: 'text', value: name, onChange: setName, placeholder: 'Tu nombre' },
                  { label: 'Correo electrónico', type: 'email', value: email, onChange: setEmail, placeholder: 'tu@correo.com' },
                  { label: 'Contraseña', type: 'password', value: password, onChange: setPassword, placeholder: '••••••••' },
                  { label: 'Repetir contraseña', type: 'password', value: confirmPassword, onChange: setConfirmPassword, placeholder: '••••••••' },
                ];
                const cfg = configs[idx];
                return (
                  <div key={cfg.label}>
                    <label className="text-sm font-medium text-gray-300 block mb-1.5">{cfg.label}</label>
                    <input
                      type={cfg.type}
                      value={cfg.value}
                      onChange={(e) => cfg.onChange(e.target.value)}
                      required
                      placeholder={cfg.placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    />
                  </div>
                );
              }
            )}

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
