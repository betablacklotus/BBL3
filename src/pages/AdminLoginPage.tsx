import { useState, useEffect } from 'react';
import { login, isLoggedIn, logout, isDefaultPassword } from '../adminAuth';
import {
  getClientIP,
  recordAttempt,
  isAccountLocked,
  isIPBlocked,
  shouldLockAccount,
  shouldBlockIP,
  lockAccount,
  blockIP,
  getRecentFailedAttempts,
  getIPFailedAttempts,
} from '../security';
import { useMeta } from '../seo';
import { AdminPanel } from './AdminPanel';

export function AdminLoginPage() {
  useMeta({ title: 'Admin', description: 'Admin login.' });

  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockInfo, setLockInfo] = useState<{ locked: boolean; until?: number }>(isAccountLocked());
  const [ipBlockInfo, setIpBlockInfo] = useState<{ blocked: boolean; until?: number }>(
    isIPBlocked(getClientIP())
  );

  useEffect(() => {
    if (lockInfo.locked && lockInfo.until) {
      const timer = setTimeout(() => {
        setLockInfo(isAccountLocked());
      }, lockInfo.until - Date.now() + 1000);
      return () => clearTimeout(timer);
    }
  }, [lockInfo]);

  useEffect(() => {
    if (ipBlockInfo.blocked && ipBlockInfo.until) {
      const timer = setTimeout(() => {
        setIpBlockInfo(isIPBlocked(getClientIP()));
      }, ipBlockInfo.until - Date.now() + 1000);
      return () => clearTimeout(timer);
    }
  }, [ipBlockInfo]);

  if (loggedIn) {
    return <AdminPanel onLogout={() => { logout(); setLoggedIn(false); }} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check IP block
    const ip = getClientIP();
    const ipBlocked = isIPBlocked(ip);
    if (ipBlocked.blocked) {
      const mins = ipBlocked.until ? Math.ceil((ipBlocked.until - Date.now()) / 60000) : 60;
      setError(`Your IP has been blocked due to too many failed attempts. Try again in ${mins} minute(s).`);
      setIpBlockInfo(ipBlocked);
      return;
    }

    // Check account lock
    const locked = isAccountLocked();
    if (locked.locked) {
      const mins = locked.until ? Math.ceil((locked.until - Date.now()) / 60000) : 30;
      setError(`Account is locked due to too many failed attempts. Try again in ${mins} minute(s).`);
      setLockInfo(locked);
      return;
    }

    setLoading(true);
    const result = await login(password);
    recordAttempt(ip, result.success);

    if (result.success) {
      setLoggedIn(true);
      setPassword('');
    } else {
      // Check if we should lock the account
      if (shouldLockAccount()) {
        lockAccount();
        setLockInfo(isAccountLocked());
        setError('Too many failed attempts. Account locked for 30 minutes.');
      } else if (shouldBlockIP(ip)) {
        blockIP(ip, 'Too many failed login attempts');
        setIpBlockInfo(isIPBlocked(ip));
        setError('Too many failed attempts from your IP. IP blocked for 1 hour.');
      } else {
        const recent = getRecentFailedAttempts().length;
        const ipFails = getIPFailedAttempts(ip);
        setError(`Invalid password. ${5 - recent} attempt(s) remaining before account lock.`);
        if (ipFails > 5) {
          setError(`Invalid password. ${10 - ipFails} attempt(s) remaining before IP block.`);
        }
      }
    }
    setLoading(false);
  };

  const formatTime = (until?: number) => {
    if (!until) return '';
    const mins = Math.ceil((until - Date.now()) / 60000);
    return `${mins} minute(s)`;
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
      <div className="border rule bg-white p-6 sm:p-8">
        <h1 className="text-xl font-semibold mb-1">Admin Login</h1>
        <p className="text-xs text-muted mb-6">Authorized personnel only.</p>

        {isDefaultPassword() && (
          <div className="border border-warning p-3 mb-4 text-sm" style={{ background: '#f5ecdc' }}>
            <strong>Warning:</strong> You are using the default password. Change it immediately after logging in.
          </div>
        )}

        {lockInfo.locked && (
          <div className="border border-error p-3 mb-4 text-sm" style={{ background: '#f5e0e0' }}>
            Account locked. Try again in {formatTime(lockInfo.until)}.
          </div>
        )}

        {ipBlockInfo.blocked && !lockInfo.locked && (
          <div className="border border-error p-3 mb-4 text-sm" style={{ background: '#f5e0e0' }}>
            Your IP is blocked. Try again in {formatTime(ipBlockInfo.until)}.
          </div>
        )}

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
              disabled={lockInfo.locked || ipBlockInfo.blocked}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || lockInfo.locked || ipBlockInfo.blocked}
          >
            {loading ? 'Checking…' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t rule text-xs text-muted">
          <p>Rate limiting: 5 failed attempts locks the account for 30 minutes.</p>
          <p>IP blocking: 10 failed attempts from one IP blocks it for 1 hour.</p>
          <p className="mt-2">
            <strong>Default password:</strong> <code>ChangeMe!Str0ngP@ss</code> — change it after first login.
          </p>
        </div>
      </div>
    </div>
  );
}
