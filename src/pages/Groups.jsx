import { useTournament } from '../context/TournamentContext';
import './Groups.css';

function GroupTable({ groupId }) {
  const { getGroupStandings, getMatchesByGroup, getPlayerById, settings } = useTournament();
  const standings = getGroupStandings(groupId);
  const matches   = getMatchesByGroup(groupId);
  const n         = settings?.advancersPerGroup ?? 2;

  return (
    <div className="group-card card">
      <div className="group-label">Group {groupId}</div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((p, i) => (
              <tr key={p.id} className={i < n ? `rank-${i + 1} rank-advance` : ''}>
                <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i + 1}</td>
                <td>
                  <span className="player-name-cell">
                    <span className="mini-avatar">{p.gamertag[0]}</span>
                    {p.gamertag}
                  </span>
                </td>
                <td>{p.P}</td>
                <td>{p.W}</td>
                <td>{p.D}</td>
                <td>{p.L}</td>
                <td>{p.GF}</td>
                <td>{p.GA}</td>
                <td>{p.GD >= 0 ? `+${p.GD}` : p.GD}</td>
                <td><strong style={{ color: 'var(--text)' }}>{p.Pts}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {n > 0 && (
        <div className="advance-note">↑ Top {n} advance to knockouts</div>
      )}

      {matches.length > 0 && (
        <>
          <div className="divider" />
          <div className="fixtures-label">Fixtures</div>
          <div className="fixtures-list">
            {matches.map(m => {
              const p1 = getPlayerById(m.player1Id);
              const p2 = getPlayerById(m.player2Id);
              return (
                <div key={m.id} className="fixture-row">
                  <span className={`fixture-player ${m.completed && m.winner === m.player1Id ? 'winner' : ''}`}>
                    {p1?.gamertag || '—'}
                  </span>
                  <div className="fixture-score">
                    {m.completed ? (
                      <>
                        <span className={m.winner === m.player1Id ? 'score-win' : ''}>{m.score1}</span>
                        <span className="score-sep">-</span>
                        <span className={m.winner === m.player2Id ? 'score-win' : ''}>{m.score2}</span>
                      </>
                    ) : (
                      <span className="score-pending">vs</span>
                    )}
                  </div>
                  <span className={`fixture-player right ${m.completed && m.winner === m.player2Id ? 'winner' : ''}`}>
                    {p2?.gamertag || '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function Groups() {
  const { groups, loading } = useTournament();

  if (loading) return (
    <div className="loading-center"><div className="spinner" />Loading groups...</div>
  );

  return (
    <div className="page">
      <div className="container">
        <div className="page-title animate-fade-up">
          <h1>Group <span>Stage</span></h1>
          <p>Round-robin fixtures and standings</p>
        </div>

        {groups.length === 0 ? (
          <div className="empty-state card animate-fade-up">
            <div className="icon">📋</div>
            <h3>Groups not set up yet</h3>
            <p>The admin will assign players to groups soon.</p>
          </div>
        ) : (
          <div className="groups-grid stagger">
            {[...groups]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map(g => (
                <GroupTable key={g.id} groupId={g.id} />
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}