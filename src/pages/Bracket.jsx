import { useTournament } from '../context/TournamentContext';
import './Bracket.css';

const ROUND_ORDER = ['round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'final'];
const ROUND_LABELS = {
  round_of_32:  'Round of 32',
  round_of_16:  'Round of 16',
  quarterfinal: 'Quarter-Finals',
  semifinal:    'Semi-Finals',
  final:        'Final',
};

function MatchCard({ match, getPlayerById }) {
  const p1 = getPlayerById(match.player1Id);
  const p2 = getPlayerById(match.player2Id);

  return (
    <div className={`bracket-match ${match.completed ? 'completed' : ''}`}>
      <div className={`bracket-player ${match.winner === match.player1Id ? 'win' : match.completed ? 'lose' : ''}`}>
        <span className="bp-avatar">{p1 ? p1.gamertag[0] : '?'}</span>
        <span className="bp-name">{p1?.gamertag || <span className="tbd">TBD</span>}</span>
        {match.completed && <span className="bp-score">{match.score1}</span>}
      </div>
      <div className="bracket-divider" />
      <div className={`bracket-player ${match.winner === match.player2Id ? 'win' : match.completed ? 'lose' : ''}`}>
        <span className="bp-avatar">{p2 ? p2.gamertag[0] : '?'}</span>
        <span className="bp-name">{p2?.gamertag || <span className="tbd">TBD</span>}</span>
        {match.completed && <span className="bp-score">{match.score2}</span>}
      </div>
    </div>
  );
}

export default function Bracket() {
  const { getKnockoutMatches, getPlayerById, loading } = useTournament();
  const knockoutMatches = getKnockoutMatches();

  if (loading) return (
    <div className="loading-center"><div className="spinner" />Loading bracket...</div>
  );

  const rounds = ROUND_ORDER.filter(r => knockoutMatches.some(m => m.stage === r));
  const finalMatch = knockoutMatches.find(m => m.stage === 'final');
  const champion = finalMatch?.completed ? getPlayerById(finalMatch.winner) : null;

  return (
    <div className="page">
      <div className="container">
        <div className="page-title animate-fade-up">
          <h1>Knockout <span>Bracket</span></h1>
          <p>The road to glory</p>
        </div>

        {champion && (
          <div className="champion-banner animate-fade-up">
            <div className="champion-trophy">🏆</div>
            <div>
              <div className="champion-label">Tournament Champion</div>
              <div className="champion-name">{champion.gamertag}</div>
              <div className="champion-realname">{champion.name}</div>
            </div>
          </div>
        )}

        {knockoutMatches.length === 0 ? (
          <div className="empty-state card animate-fade-up">
            <div className="icon">🎯</div>
            <h3>Knockout bracket not generated yet</h3>
            <p>The admin will generate the bracket after the group stage.</p>
          </div>
        ) : (
          <div className="bracket-scroll">
            <div className="bracket-grid">
              {rounds.map(round => {
                const roundMatches = knockoutMatches
                  .filter(m => m.stage === round)
                  .sort((a, b) => (a.matchIndex ?? 0) - (b.matchIndex ?? 0));

                return (
                  <div key={round} className="bracket-round">
                    <div className="round-label">{ROUND_LABELS[round] || round}</div>
                    <div className="round-matches">
                      {roundMatches.map(m => (
                        <div key={m.id} className="bracket-match-wrap">
                          <MatchCard match={m} getPlayerById={getPlayerById} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}