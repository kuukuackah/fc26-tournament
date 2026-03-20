import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import './Home.css';

const STATUS_LABELS = {
  registration: { label: 'Registration Open',   badge: 'badge-green' },
  groups:       { label: 'Group Stage',         badge: 'badge-cyan'  },
  knockout:     { label: 'Knockout Stage',      badge: 'badge-gold'  },
  completed:    { label: 'Tournament Complete', badge: 'badge-gray'  },
};

export default function Home() {
  const { settings, players, loading, getTournamentStats } = useTournament();
  const stats = getTournamentStats();
  const statusInfo = STATUS_LABELS[settings?.status] || STATUS_LABELS.registration;

  if (loading) return (
    <div className="loading-center" style={{ paddingTop: '30vh' }}>
      <div className="spinner" />
      Loading...
    </div>
  );

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-content animate-fade-up">
          <span className={`badge ${statusInfo.badge}`} style={{ marginBottom: 20 }}>
            {statusInfo.label}
          </span>
          <h1>{settings?.tournamentName || 'FC 26 Tournament'}</h1>
          <p className="hero-desc">
            {settings?.tournamentDescription || 'The ultimate FC 26 showdown'}
          </p>
          <div className="hero-actions">
            {settings?.status === 'registration' && (
              <Link to="/register" className="btn btn-primary btn-lg">✦ Register Now</Link>
            )}
            {settings?.status === 'groups' && (
              <Link to="/groups" className="btn btn-primary btn-lg">View Groups</Link>
            )}
            {settings?.status === 'knockout' && (
              <Link to="/bracket" className="btn btn-gold btn-lg">🏆 View Bracket</Link>
            )}
            <Link to="/leaderboard" className="btn btn-secondary btn-lg">Leaderboard</Link>
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: -40, position: 'relative', zIndex: 2 }}>
        <div className="grid-4 stagger">
          <div className="stat-box">
            <div className="stat-value">{stats.totalPlayers}</div>
            <div className="stat-label">Players</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.totalGroups}</div>
            <div className="stat-label">Groups</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.matchesPlayed}</div>
            <div className="stat-label">Matches Played</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.totalMatches}</div>
            <div className="stat-label">Total Matches</div>
          </div>
        </div>
      </section>

      {players.length > 0 && (
        <section className="container home-section stagger">
          <div className="section-header">
            <h2>Registered <span style={{ color: 'var(--cyan)' }}>Players</span></h2>
            {settings?.status === 'registration' && (
              <Link to="/register" className="btn btn-secondary btn-sm">+ Register</Link>
            )}
          </div>
          <div className="players-grid">
            {players.map((p, i) => (
              <div key={p.id} className="player-card">
                <div className="player-number">#{i + 1}</div>
                <div className="player-avatar">{p.gamertag[0]}</div>
                <div className="player-info">
                  <div className="player-gamertag">{p.gamertag}</div>
                  <div className="player-name">{p.name}</div>
                </div>
                {p.groupId && (
                  <span className="badge badge-cyan" style={{ marginLeft: 'auto' }}>
                    Group {p.groupId}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container home-section">
        <h2 style={{ textAlign: 'center', marginBottom: 36 }}>
          How it <span style={{ color: 'var(--cyan)' }}>Works</span>
        </h2>
        <div className="grid-3 stagger">
          {[
            { icon: '📝', title: 'Register',    desc: 'Sign up with your name and gamertag to enter the tournament.' },
            { icon: '⚽', title: 'Group Stage', desc: 'Play round-robin matches in your group. Top players advance.' },
            { icon: '🏆', title: 'Knockout',    desc: 'Compete in the knockout bracket — semis, and the grand final.' },
          ].map(s => (
            <div key={s.title} className="card how-card">
              <div className="how-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}