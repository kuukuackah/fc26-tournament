import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',             label: 'Home'        },
  { to: '/register',    label: 'Register'    },
  { to: '/groups',      label: 'Groups'      },
  { to: '/bracket',     label: 'Bracket'     },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/admin',       label: '⚙ Admin'     },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { settings } = useTournament();
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo" onClick={() => setOpen(false)}>
          <span className="logo-icon">⚽</span>
          <span className="logo-text">
            {settings?.tournamentName || 'FC 26 Tournament'}
          </span>
        </Link>

        <ul className="navbar-links">
          {NAV_LINKS.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={pathname === link.to ? 'active' : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className={`hamburger ${open ? 'open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`mobile-menu ${open ? 'open' : ''}`}>
        {NAV_LINKS.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={pathname === link.to ? 'active' : ''}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}