import { useState, useEffect } from 'react';
import { login, isLoggedIn, logout, isDefaultPassword, changePassword, clearToken } from '../adminAuth';
import { checkPasswordStrength } from '../security';
import { useMeta } from '../seo';
import { AdminPanel } from './AdminPanel';

export function AdminLoginPage() {
  useMeta({ title: 'Admin', description: 'Admin login.' });

  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Re-check token expiry every 30 seconds so the panel drops to login automatically
  useEffect(() => {
    if (!loggedIn) return;
    const id = setInterval(() => {
      if (!isLoggedIn()) setLoggedIn(false);
    }, 30_000);
    return () => clearInterval(id);
  }, [loggedIn]);

  if (loggedIn && !mustChangePassword) {
    return <AdminPanel onLogout={() => { logout(); setLoggedIn(false); }} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const result = await login(password);
      if (result.success) {
        setLoggedIn(true);
        setPassword('');
        if (result.mustChangePassword) {
          setMustChangePassword(true);
        } else {
          setMustChangePassword(false);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not connect to the server. Please try again.';
      setError(msg);
    }
    setLoading(false);
  };

  if (mustChangePassword) {
    return (
      <ForceChangePassword
        onChangeComplete={() => setMustChangePassword(false)}
        onCancel={() => { clearToken(); setLoggedIn(false); setMustChangePassword(false); }}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
      <div className="border rule bg-white p-6 sm:p-8">
        <h1 className="text-xl font-semibold mb-1">Admin Login</h1>
        <p className="text-xs text-muted mb-6">Authorized personnel only.</p>

        <DefaultPasswordWarning />

        {error && <p className="text-sm text-error mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm block mb-1" htmlFor="pw">Password</label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              required
              autoFocus
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DefaultPasswordWarning() {
  const [isDefault, setIsDefault] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    isDefaultPassword().then((result) => {
      setIsDefault(result);
      setLoaded(true);
    });
  }, []);

  if (!loaded || !isDefault) return null;

  return (
    <div className="border border-warning p-3 mb-4 text-sm" style={{ background: '#f5ecdc' }}>
      <strong>Warning:</strong> You are using the default password. Change it immediately after logging in.
    </div>
  );
}

function ForceChangePassword({
  onChangeComplete,
  onCancel,
}: {
  onChangeComplete: () => void;
  onCancel: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirmPw) { setMsg('New passwords do not match.'); return; }
    const strength = checkPasswordStrength(next);
    if (!strength.strong) { setMsg(strength.message); return; }
    setLoading(true);
    try {
      const result = await changePassword(current, next);
      if (result.success) {
        setMsg('Password changed successfully.');
        setTimeout(onChangeComplete, 800);
      } else {
        setMsg(result.message);
      }
    } catch {
      setMsg('Could not change password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
      <div className="border rule bg-white p-6 sm:p-8">
        <h1 className="text-xl font-semibold mb-1">Change Default Password</h1>
        <p className="text-xs text-muted mb-6">
          You must change your password before continuing.
        </p>

        {msg && <p className="text-sm mb-4" style={{ color: msg.includes('successfully') ? '#5a9e5a' : '#c00' }}>{msg}</p>}

        <form onSubmit={handleChange} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="field"
            required
            autoFocus
            autoComplete="current-password"
          />
          <input
            type="password"
            placeholder="New password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="field"
            required
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="field"
            required
            autoComplete="new-password"
          />
          <p className="text-xs text-muted">12+ chars with upper, lower, number, and symbol.</p>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Changing…' : 'Change password'}
            </button>
            <button type="button" className="btn" onClick={onCancel}>Log out</button>
          </div>
        </form>
      </div>
    </div>
  );
}
