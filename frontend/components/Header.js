'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Header({ user }) {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-greeting">
          Xush kelibsiz, <span>{user?.firstName}</span>!
        </div>
      </div>

      <div className="header-right">
        <div className="header-user">
          <div className="header-avatar">{initials}</div>
          <div className="header-user-info">
            <div className="header-user-name">{user?.firstName} {user?.lastName}</div>
            <div className="header-user-role">{user?.role}</div>
          </div>
        </div>

        <div className="header-divider" />

        <button className="header-logout" onClick={handleLogout} title="Chiqish">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Chiqish</span>
        </button>
      </div>
    </header>
  );
}
