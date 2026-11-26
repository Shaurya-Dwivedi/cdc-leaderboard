import { useState } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { useAuth } from '../../hooks/useAuth';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 text-sm text-text-primary focus:outline-none focus:border-accent';

export function AdminLoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Admin login" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          autoFocus
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-xs text-negative">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-2 text-xs font-bold bg-accent hover:bg-accent-hover text-white rounded-lg disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </Modal>
  );
}
