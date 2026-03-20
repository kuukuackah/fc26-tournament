import { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import './Admin.css';

const TABS = ['Overview', 'Players', 'Groups Setup', 'Enter Scores', 'Knockout', 'Settings'];

function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const { checkAdminPassword } = useTournament();

  const handleSubmit = e => {
    e.preventDefault();
    if (checkAdminPassword(pw)) {
      onLogin();
    } else {
      setError('Incorrect password. Default is "admin123".');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="admin-login-wrap">
          <div className="card admin-login-card animate-fade-up">
            <div className="admin-lock">🔐</div>
            <h2>Admin Access</h2>
            <p style={{ marginBottom: 24 }}>Enter your admin password to manage the tournament.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter admin password"
                  value={pw}
                  onChange={e => { setPw(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button type="submit" className="btn btn-primary">Unlock Admin Panel</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  const { settings, updateSettings, getTournamentStats, generateKnockout } = useTournament();
  const stats = getTournamentStats();
  const [generating, setGenerating] = useState(false);
const [msg, setMsg]               = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting]   = useState(false);

  const setPhase = async (status) => {
    await updateSettings({ status });
    setMsg({ type: 'success', text: `Tournament phase set to: ${status}` });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleGenerateKnockout = async () => {
    setGenerating(true);
    try {
      await generateKnockout();
      await updateSettings({ status: 'knockout' });
      setMsg({ type: 'success', text: 'Knockout bracket generated!' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
    setGenerating(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const phases = [
    { status: 'registration', label: 'Registration', icon: '📝', desc: 'Players can sign up' },
    { status: 'groups',       label: 'Group Stage',  icon: '⚽', desc: 'Group fixtures active' },
    { status: 'knockout',     label: 'Knockout',     icon: '🎯', desc: 'Knockout bracket active' },
    { status: 'completed',    label: 'Completed',    icon: '🏆', desc: 'Tournament finished' },
  ];

  return (
    <div className="admin-tab">
      <h3>Tournament Overview</h3>
      {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="stat-box"><div className="stat-value">{stats.totalPlayers}</div><div className="stat-label">Players</div></div>
        <div className="stat-box"><div className="stat-value">{stats.totalGroups}</div><div className="stat-label">Groups</div></div>
        <div className="stat-box"><div className="stat-value">{stats.matchesPlayed}</div><div className="stat-label">Played</div></div>
        <div className="stat-box"><div className="stat-value">{stats.totalMatches}</div><div className="stat-label">Total</div></div>
      </div>

      <h4 style={{ marginBottom: 16, color: 'var(--text-2)', fontFamily: 'var(--font-cond)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
        Tournament Phase
      </h4>
      <div className="phase-grid">
        {phases.map(p => (
          <button
            key={p.status}
            className={`phase-btn ${settings?.status === p.status ? 'active' : ''}`}
            onClick={() => setPhase(p.status)}
          >
            <span className="phase-icon">{p.icon}</span>
            <span className="phase-label">{p.label}</span>
            <span className="phase-desc">{p.desc}</span>
          </button>
        ))}
      </div>

      {settings?.status === 'groups' && (
        <div className="card" style={{ marginTop: 24, background: 'rgba(0,229,255,0.04)', borderColor: 'rgba(0,229,255,0.2)' }}>
          <h4 style={{ marginBottom: 8 }}>Ready for knockouts?</h4>
          <p style={{ marginBottom: 16 }}>Generate the knockout bracket from current group standings.</p>
          <button className="btn btn-primary" onClick={handleGenerateKnockout} disabled={generating}>
            {generating ? 'Generating...' : '⚡ Generate Knockout Bracket'}
          </button>
        </div>
      )}
    </div>
  );
}

function PlayersTab() {
  const { players, deletePlayer, settings } = useTournament();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [msg, setMsg] = useState(null);

  const handleDelete = async (id) => {
    await deletePlayer(id);
    setConfirmDelete(null);
    setMsg({ type: 'success', text: 'Player removed.' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="admin-tab">
      <div className="section-header">
        <h3>Registered Players <span className="badge badge-cyan">{players.length}</span></h3>
      </div>
      {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

      {players.length === 0 ? (
        <div className="empty-state card"><div className="icon">👾</div><h3>No players registered</h3></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Gamertag</th><th>Name</th><th>Group</th><th>Registered</th><th>Action</th></tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="mini-avatar-admin">{p.gamertag[0]}</div>
                        <strong>{p.gamertag}</strong>
                      </div>
                    </td>
                    <td>{p.name}</td>
                    <td>{p.groupId ? <span className="badge badge-cyan">{p.groupId}</span> : <span className="badge badge-gray">—</span>}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
                      {p.registeredAt?.toDate?.()?.toLocaleDateString?.() || '—'}
                    </td>
                    <td>
                      {confirmDelete === p.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Confirm</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmDelete(p.id)}
                          disabled={settings?.status !== 'registration'}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {settings?.status !== 'registration' && (
            <div className="alert alert-warning" style={{ marginTop: 12 }}>
              Players can only be removed during registration phase.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupsSetupTab() {
  const { players, setupGroups, updateSettings, settings } = useTournament();
  const [groupCount, setGroupCount] = useState(settings?.groupCount || 4);
  const [advancers, setAdvancers]   = useState(settings?.advancersPerGroup || 2);
  const [assignments, setAssignments] = useState({});
  const [msg, setMsg]               = useState(null);
  const [loading, setLoading]       = useState(false);
  const [autoAssigned, setAutoAssigned] = useState(false);

  const groupIds = Array.from({ length: groupCount }, (_, i) => String.fromCharCode(65 + i));

  const autoAssign = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const newAssignments = {};
    groupIds.forEach(id => (newAssignments[id] = []));
    shuffled.forEach((p, i) => {
      const gid = groupIds[i % groupCount];
      newAssignments[gid].push(p.id);
    });
    setAssignments(newAssignments);
    setAutoAssigned(true);
  };

  const handleSave = async () => {
    if (Object.values(assignments).some(arr => arr.length < 2)) {
      setMsg({ type: 'error', text: 'Each group must have at least 2 players.' });
      return;
    }
    setLoading(true);
    try {
      await updateSettings({ groupCount, advancersPerGroup: advancers });
      await setupGroups(assignments);
      await updateSettings({ status: 'groups' });
      setMsg({ type: 'success', text: 'Groups set up! Tournament moved to group stage.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
    setLoading(false);
  };

  const movePlayer = (playerId, fromGroup, toGroup) => {
    setAssignments(prev => {
      const next = { ...prev };
      next[fromGroup] = (next[fromGroup] || []).filter(id => id !== playerId);
      next[toGroup]   = [...(next[toGroup] || []), playerId];
      return next;
    });
  };

  const getPlayerById = (id) => players.find(p => p.id === id);

  return (
    <div className="admin-tab">
      <h3>Groups Setup</h3>
      {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

      <div className="setup-controls card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label>Number of Groups</label>
            <select value={groupCount} onChange={e => setGroupCount(+e.target.value)}>
              {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Groups</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label>Players Advancing per Group</label>
            <select value={advancers} onChange={e => setAdvancers(+e.target.value)}>
              {[1,2,3,4].map(n => <option key={n} value={n}>Top {n}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={autoAssign} disabled={players.length === 0}>
            🎲 Auto-Assign Players
          </button>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="empty-state card"><div className="icon">👾</div><h3>No players to assign</h3></div>
      ) : (
        <>
          {autoAssigned && (
            <div className="groups-assign-grid">
              {groupIds.map(gid => {
                const groupPlayerIds = assignments[gid] || [];
                return (
                  <div key={gid} className="card assign-group-card">
                    <div className="assign-group-label">Group {gid}</div>
                    <div className="assign-players">
                      {groupPlayerIds.map(pid => {
                        const p = getPlayerById(pid);
                        if (!p) return null;
                        return (
                          <div key={pid} className="assign-player-row">
                            <div className="mini-avatar-admin">{p.gamertag[0]}</div>
                            <span>{p.gamertag}</span>
                            <select
                              className="move-select"
                              value={gid}
                              onChange={e => movePlayer(pid, gid, e.target.value)}
                            >
                              {groupIds.map(g => <option key={g} value={g}>Group {g}</option>)}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                    <div className="assign-count">{groupPlayerIds.length} player{groupPlayerIds.length !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>
          )}
          {autoAssigned && (
            <div style={{ marginTop: 24 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : '✦ Save Groups & Generate Fixtures'}
              </button>
            </div>
          )}
          {!autoAssigned && (
            <div className="alert alert-info">
              Click "Auto-Assign Players" to distribute players into groups. You can then move players between groups before saving.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EnterScoresTab() {
  const { groups, matches, getPlayerById, enterScore, enterKnockoutScore } = useTournament();
  const [scores, setScores]   = useState({});
  const [saving, setSaving]   = useState({});
  const [msg, setMsg]         = useState(null);

  const groupMatches   = matches.filter(m => m.stage === 'group'  && !m.completed);
  const knockoutMatches = matches.filter(m => m.stage !== 'group' && !m.completed && m.player1Id && m.player2Id);

  const handleScore = (matchId, field, val) => {
    setScores(s => ({ ...s, [matchId]: { ...s[matchId], [field]: val } }));
  };

  const saveScore = async (match) => {
    const s = scores[match.id] || {};
    if (s.s1 === undefined || s.s2 === undefined || s.s1 === '' || s.s2 === '') {
      setMsg({ type: 'error', text: 'Enter both scores before saving.' });
      setTimeout(() => setMsg(null), 2500);
      return;
    }
    setSaving(sv => ({ ...sv, [match.id]: true }));
    try {
      if (match.stage === 'group') {
        await enterScore(match.id, s.s1, s.s2);
      } else {
        await enterKnockoutScore(match.id, s.s1, s.s2);
      }
      setScores(s => { const n = { ...s }; delete n[match.id]; return n; });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
    setSaving(sv => ({ ...sv, [match.id]: false }));
  };

  const MatchRow = ({ match }) => {
    const p1 = getPlayerById(match.player1Id);
    const p2 = getPlayerById(match.player2Id);
    const s  = scores[match.id] || {};
    return (
      <div className="score-entry-row">
        <span className="se-player">{p1?.gamertag || 'TBD'}</span>
        <input
          type="number" min="0" max="99"
          className="score-input"
          placeholder="0"
          value={s.s1 ?? ''}
          onChange={e => handleScore(match.id, 's1', e.target.value)}
        />
        <span className="se-vs">—</span>
        <input
          type="number" min="0" max="99"
          className="score-input"
          placeholder="0"
          value={s.s2 ?? ''}
          onChange={e => handleScore(match.id, 's2', e.target.value)}
        />
        <span className="se-player right">{p2?.gamertag || 'TBD'}</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => saveScore(match)}
          disabled={saving[match.id]}
        >
          {saving[match.id] ? '...' : 'Save'}
        </button>
      </div>
    );
  };

  return (
    <div className="admin-tab">
      <h3>Enter Scores</h3>
      {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

      {groupMatches.length > 0 && (
        <>
          <h4 className="scores-section-label">Group Stage — Pending Matches</h4>
          {groups.sort((a,b) => a.id.localeCompare(b.id)).map(g => {
            const pending = groupMatches.filter(m => m.groupId === g.id);
            if (!pending.length) return null;
            return (
              <div key={g.id} className="score-group-block card">
                <div className="score-group-label">Group {g.id}</div>
                {pending.map(m => <MatchRow key={m.id} match={m} />)}
              </div>
            );
          })}
        </>
      )}

      {knockoutMatches.length > 0 && (
        <>
          <h4 className="scores-section-label" style={{ marginTop: 32 }}>Knockout — Pending Matches</h4>
          <div className="card">
            {knockoutMatches.map(m => <MatchRow key={m.id} match={m} />)}
          </div>
        </>
      )}

      {groupMatches.length === 0 && knockoutMatches.length === 0 && (
        <div className="empty-state card">
          <div className="icon">✅</div>
          <h3>All matches completed!</h3>
          <p>No pending scores to enter.</p>
        </div>
      )}
    </div>
  );
}

function KnockoutTab() {
  const { matches, getPlayerById } = useTournament();
  const ROUND_ORDER  = ['round_of_32','round_of_16','quarterfinal','semifinal','final'];
  const ROUND_LABELS = { round_of_32:'R32', round_of_16:'R16', quarterfinal:'QF', semifinal:'SF', final:'Final' };
  const koMatches    = matches.filter(m => m.stage !== 'group');
  const rounds       = ROUND_ORDER.filter(r => koMatches.some(m => m.stage === r));

  return (
    <div className="admin-tab">
      <h3>Knockout Results</h3>
      {koMatches.length === 0 ? (
        <div className="empty-state card"><div className="icon">🎯</div><h3>No knockout matches yet</h3><p>Generate the bracket from the Overview tab.</p></div>
      ) : (
        rounds.map(round => {
          const roundMatches = koMatches.filter(m => m.stage === round).sort((a,b) => (a.matchIndex ?? 0) - (b.matchIndex ?? 0));
          return (
            <div key={round} style={{ marginBottom: 24 }}>
              <h4 className="scores-section-label">{ROUND_LABELS[round] || round}</h4>
              <div className="card">
                {roundMatches.map(m => {
                  const p1 = getPlayerById(m.player1Id);
                  const p2 = getPlayerById(m.player2Id);
                  return (
                    <div key={m.id} className="ko-result-row">
                      <span className={`ko-player ${m.winner === m.player1Id ? 'win' : m.completed ? 'lose' : ''}`}>{p1?.gamertag || 'TBD'}</span>
                      {m.completed
                        ? <span className="ko-score">{m.score1} — {m.score2}</span>
                        : <span className="ko-pending">Pending</span>
                      }
                      <span className={`ko-player right ${m.winner === m.player2Id ? 'win' : m.completed ? 'lose' : ''}`}>{p2?.gamertag || 'TBD'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function SettingsTab() {
const { settings, updateSettings, resetTournament } = useTournament();
const [confirmReset, setConfirmReset] = useState(false);
const [resetting, setResetting] = useState(false);
const [form, setForm] = useState({
  tournamentName:        settings?.tournamentName        || 'FC 26 Tournament',
  tournamentDescription: settings?.tournamentDescription || 'The ultimate FC 26 showdown',
  adminPassword:         settings?.adminPassword         || 'admin123',
});

useEffect(() => {
  if (settings) {
    setForm({
      tournamentName:        settings.tournamentName        || 'FC 26 Tournament',
      tournamentDescription: settings.tournamentDescription || 'The ultimate FC 26 showdown',
      adminPassword:         settings.adminPassword         || 'admin123',
    });
  }
}, [settings]);
  const [msg, setMsg] = useState(null);

  const handleSave = async () => {
    try {
      await updateSettings(form);
      setMsg({ type: 'success', text: 'Settings saved.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
    setTimeout(() => setMsg(null), 3000);
  };
const handleReset = async () => {
  setResetting(true);
  try {
    await resetTournament();
    setMsg({ type: 'success', text: 'Tournament reset successfully!' });
    setConfirmReset(false);
  } catch (e) {
    setMsg({ type: 'error', text: e.message });
  }
  setResetting(false);
};
  return (
    <div className="admin-tab">
      <h3>Tournament Settings</h3>
      {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}
      <div className="card" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label>Tournament Name</label>
            <input value={form.tournamentName} onChange={e => setForm(f => ({ ...f, tournamentName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={form.tournamentDescription} onChange={e => setForm(f => ({ ...f, tournamentDescription: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Admin Password</label>
            <input type="password" value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} />
          </div>
<button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
          
          <div className="divider" />
          
          <h4 style={{ color: 'var(--red)', fontFamily: 'var(--font-cond)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
            Danger Zone
          </h4>
          <p style={{ fontSize: '0.85rem', marginBottom: 12 }}>
            This will delete ALL players, groups, matches and reset the tournament to registration phase. This cannot be undone.
          </p>
          {!confirmReset ? (
            <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
              🗑 Reset Entire Tournament
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" onClick={handleReset} disabled={resetting}>
                {resetting ? 'Resetting...' : '⚠ Yes, Reset Everything'}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          )}
                  </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed]       = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  const TAB_COMPONENTS = [OverviewTab, PlayersTab, GroupsSetupTab, EnterScoresTab, KnockoutTab, SettingsTab];
  const ActiveTab = TAB_COMPONENTS[activeTab];

  return (
    <div className="page">
      <div className="container">
        <div className="page-title animate-fade-up">
          <h1>Admin <span>Panel</span></h1>
          <p>Manage your tournament</p>
        </div>

        <div className="tabs">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`tab-btn ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="animate-fade-up">
          <ActiveTab />
        </div>
      </div>
    </div>
  );
}