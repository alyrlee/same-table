import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useAppContext';
import Logo from './Logo';
import AuthModal from './AuthModal';

export default function Navbar() {
  const navigate = useNavigate();
  const { t, user, isAuthenticated, logout } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <nav>
        <div className="nav-logo" onClick={() => navigate('/')}>
          <div className="logo-svg-wrap">
            <Logo size={42} />
          </div>
          <div className="nav-brand">
            <span className="nav-brand-top">Same Table</span>
            <span className="nav-brand-sub">by Health + Heritage</span>
          </div>
        </div>
        <div className="nav-right">
          <button className="nav-btn nav-btn-ghost" onClick={() => navigate('/pantry')}>
            🥦 {t('my_pantry')}
          </button>
          {isAuthenticated ? (
            <div className="nav-user">
              <span className="nav-user-name">{user.name}</span>
              <button className="nav-btn nav-btn-ghost" onClick={logout}>
                {t('auth_logout')}
              </button>
            </div>
          ) : (
            <button className="nav-btn nav-btn-primary" onClick={() => setShowAuth(true)}>
              {t('sign_up')}
            </button>
          )}
        </div>
      </nav>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
