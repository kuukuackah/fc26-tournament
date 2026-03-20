import { useTournament } from '../context/TournamentContext';
import './Leaderboard.css';

export default function Leaderboard() {
  const { players, groups, matches, getGroupStandings, loading } = useTournament();

  if (loading) return (
    <div className="loading-center"><div className="spinner" />Loading...</div>
  );

  const playerStats = players.map(p => {
    const playerMatches = matches.filter(
      m => m.stage === 'group' && m.completed && (m.player1Id === p.id || m.player2Id === p.id)
    );

    let W = 0, D = 0, L = 0, GF = 0, GA = 0;
    playerMatches.forEach(m => {
      const isP1 = m.player1Id === p.id;
      GF += isP1 ? m.score1 : m.score2;
      GA += isP1 ? m.score2 : m.score1;
      if (m.winner === p.id)      W++;
      else if (!m.winner)         D++;
      else                        L++;
    });

    const P   = playerMatches.length;
    const Pts = W * 3 + D;
    const GD  = GF - GA;

    const koMatches = matches.filter(
      m => m.stage !== 'group' && m.completed && (m.player1Id === p.id || m.player2Id === p.id)
    );
    const koWins = koMatches.filter(m => m.winner === p.id).length;

    return { ...p, P, W, D, L, GF, GA, GD, Pts, koWins };
  });

  const sorted    = [...playerStats].sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF);
  const topScorer = [...playerStats].sort((a, b) => b.GF - a.GF)[0];

  const groupWinners = groups.map(g => {
    const s = getGroupStandings(g.id);
    return s[0];
  }).filter(Boolean);

  return (
    <div className="page">
      <div className="container">
        <div className="page-title animate-fade-up">
          <h1>Leader<span>board</span></h1>
          <p>Overall standings across the tournament</p>
        </div>

        {(topScorer || groupWinners.length > 0) && (
          <div className="leaderboard-highlights stagger" style={{ marginBottom: 40 }}>
            {topScorer && (
              <div className="highlight-card gold">
                <div className="highlight-icon">⚽</div>
                <div className="highlight-label">Top Scorer</div>
                <div className="highlight-name">{topScorer.gamertag}</div>
                <div className="highlight-stat">{topScorer.GF} goals</div>
              </div>
            )}
            {groupWinners.map(w => w && (
              <div key={w.id} className="highlight-card cyan">
                <div className="highlight-icon">🥇</div>
                <div className="highlight-label">Group {w.groupId} Winner</div>
                <div className="highlight-name">{w.gamertag}</div>
                <div className="highlight-stat">{w.Pts} pts</div>
              </div>
            ))}
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="empty-state card animate-fade-up">
            <div className="icon">📊</div>
            <h3>No data yet</h3>
            <p>Standings will appear once group matches are played.</p>
          </div>
        ) : (
          <div className="card animate-fade-up">
            <div className="table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Group</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                    <th>Pts</th>
                    <th>KO Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => (
                    <tr key={p.id} className={i < 3 ? `top-${i + 1}` : ''}>
                      <td className="rank-col">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td>
                        <div className="lb-player">
                          <div className="lb-avatar" style={{
                            background: i === 0 ? 'var(--gold-dim)' : 'var(--cyan-dim)',
                            color: i === 0 ? 'var(--gold)' : 'var(--cyan)'
                          }}>
                            {p.gamertag[0]}
                          </div>
                          <div>
                            <div className="lb-gamertag">{p.gamertag}</div>
                            <div className="lb-name">{p.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {p.groupId
                          ? <span className="badge badge-cyan">{p.groupId}</span>
                          : <span className="badge badge-gray">—</span>
                        }
                      </td>
                      <td>{p.P}</td>
                      <td style={{ color: p.W > 0 ? 'var(--green)' : '' }}>{p.W}</td>
                      <td>{p.D}</td>
                      <td style={{ color: p.L > 0 ? 'var(--red)' : '' }}>{p.L}</td>
                      <td>{p.GF}</td>
                      <td>{p.GA}</td>
                      <td>{p.GD >= 0 ? `+${p.GD}` : p.GD}</td>
                      <td><strong style={{ color: 'var(--text)', fontSize: '1rem' }}>{p.Pts}</strong></td>
                      <td>
                        {p.koWins > 0
                          ? <span style={{ color: 'var(--gold)' }}>⚡ {p.koWins}</span>
                          : <span style={{ color: 'var(--text-3)' }}>—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}