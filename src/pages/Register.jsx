import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import './Register.css';

export default function Register() {
  const { registerPlayer, players, settings } = useTournament();

  const [form, setForm] = useState({ name: '', gamertag: '' });
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  const registrationOpen = settings?.status === 'registration';

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.gamertag.trim()) {
      setStatus('error');
      setMessage('Please fill in all fields.');
      return;
    }
    setStatus('loading');
    try {
      await registerPlayer(form);
      setStatus('success');
      setMessage(`🎉 Welcome, ${form.gamertag.toUpperCase()}! You're registered.`);
      setForm({ name: '', gamertag: '' });
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-title animate-fade-up">
          <h1>Player <span>Registration</span></h1>
          <p>Sign up to enter the tournament</p>
        </div>

        <div className="register-layout">
          <div className="card register-card animate-fade-up">
            {!registrationOpen ? (
              <div className="alert alert-warning">
                ⚠ Registration is currently closed.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ marginBottom: 24, color: 'var(--cyan)' }}>Join the Tournament</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g. Kwame Mensah"
                      value={form.name}
                      onChange={handleChange}
                      maxLength={50}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gamertag">Gamertag / PSN / Xbox ID</label>
                    <input
                      id="gamertag"
                      name="gamertag"
                      type="text"
                      placeholder="e.g. KINGSOLO99"
                      value={form.gamertag}
                      onChange={handleChange}
                      maxLength={30}
                    />
                  </div>
                  {status === 'success' && (
                    <div className="alert alert-success">{message}</div>
                  )}
                  {status === 'error' && (
                    <div className="alert alert-error">{message}</div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={status === 'loading'}
                    style={{ marginTop: 4 }}
                  >
                    {status === 'loading' ? 'Registering...' : '✦ Register Now'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div>
            <div className="section-header">
              <h3>
                Registered Players{' '}
                <span className="badge badge-cyan" style={{ marginLeft: 8 }}>
                  {players.length}
                </span>
              </h3>
            </div>
            {players.length === 0 ? (
              <div className="empty-state card">
                <div className="icon">👾</div>
                <h3>No players yet</h3>
                <p>Be the first to register!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {players.map((p, i) => (
                  <div key={p.id} className="reg-player-row">
                    <span className="reg-number">#{i + 1}</span>
                    <div className="reg-avatar">{p.gamertag[0]}</div>
                    <div className="reg-info">
                      <span className="reg-gamertag">{p.gamertag}</span>
                      <span className="reg-name">{p.name}</span>
                    </div>
                    {p.groupId && (
                      <span className="badge badge-cyan">Group {p.groupId}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}