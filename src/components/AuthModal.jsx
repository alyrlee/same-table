import { useState } from 'react';
import { useApp } from '../hooks/useAppContext';

export default function AuthModal({ isOpen, onClose }) {
  const { register, login, loginAsGuest, t } = useApp();
  const [tab, setTab] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError(t('auth_fields_required'));
      return;
    }
    if (tab === 'signup' && !name.trim()) {
      setError(t('auth_name_required'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth_password_short'));
      return;
    }

    setLoading(true);
    try {
      if (tab === 'signup') {
        await register(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      reset();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
      reset();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="auth-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>&times;</button>

        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
            onClick={() => switchTab('signup')}
          >
            {t('sign_up')}
          </button>
          <button
            className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => switchTab('login')}
          >
            {t('log_in')}
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {tab === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-name">{t('auth_name')}</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">{t('auth_email')}</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">{t('auth_password')}</label>
            <input
              id="auth-password"
              type="password"
              placeholder={tab === 'signup' ? 'Min 8 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? '...' : tab === 'signup' ? t('sign_up') : t('log_in')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('auth_or')}</span>
        </div>

        <button className="auth-guest" onClick={handleGuest} disabled={loading}>
          {t('auth_guest')}
        </button>

        <p className="auth-terms">
          {t('auth_terms_prefix')}{' '}
          <a href="/terms" onClick={onClose}>{t('auth_terms_link')}</a>{' & '}
          <a href="/privacy" onClick={onClose}>{t('auth_privacy_link')}</a>
        </p>
      </div>
    </div>
  );
}
