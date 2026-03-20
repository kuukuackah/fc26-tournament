import { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, doc, onSnapshot, setDoc, addDoc,
  updateDoc, deleteDoc, getDocs, writeBatch,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

const TournamentContext = createContext(null);

export const useTournament = () => {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider');
  return ctx;
};

const DEFAULT_SETTINGS = {
  tournamentName: 'FC 26 Tournament',
  adminPassword: 'admin123',
  status: 'registration',
  groupCount: 4,
  advancersPerGroup: 2,
  tournamentDescription: 'The ultimate FC 26 showdown',
};

export function TournamentProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [players, setPlayers]   = useState([]);
  const [groups, setGroups]     = useState([]);
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const unsubs = [];

    unsubs.push(onSnapshot(doc(db, 'settings', 'main'), snap => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
      } else {
        setDoc(doc(db, 'settings', 'main'), DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
    }, err => setError(err.message)));

    unsubs.push(onSnapshot(
      query(collection(db, 'players'), orderBy('registeredAt', 'asc')),
      snap => setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => setError(err.message)
    ));

    unsubs.push(onSnapshot(collection(db, 'groups'), snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => setError(err.message)));

    unsubs.push(onSnapshot(
      query(collection(db, 'matches'), orderBy('createdAt', 'asc')),
      snap => {
        setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => { setError(err.message); setLoading(false); }
    ));

    return () => unsubs.forEach(u => u());
  }, []);

  const checkAdminPassword = (pw) => pw === settings?.adminPassword;

  const updateSettings = async (updates) => {
    await updateDoc(doc(db, 'settings', 'main'), updates);
  };

  const registerPlayer = async ({ name, gamertag }) => {
    const existing = players.find(p => p.gamertag.toLowerCase() === gamertag.toLowerCase());
    if (existing) throw new Error('This gamertag is already registered.');
    await addDoc(collection(db, 'players'), {
      name: name.trim(),
      gamertag: gamertag.trim().toUpperCase(),
      registeredAt: serverTimestamp(),
      groupId: null,
    });
  };

  const deletePlayer = async (playerId) => {
    await deleteDoc(doc(db, 'players', playerId));
  };

  const setupGroups = async (groupAssignments) => {
    const batch = writeBatch(db);

    const existingGroups = await getDocs(collection(db, 'groups'));
    existingGroups.forEach(d => batch.delete(d.ref));

    const existingMatches = await getDocs(collection(db, 'matches'));
    existingMatches.forEach(d => {
      if (d.data().stage === 'group') batch.delete(d.ref);
    });

    for (const [groupId, playerIds] of Object.entries(groupAssignments)) {
      batch.set(doc(db, 'groups', groupId), {
        playerIds,
        createdAt: serverTimestamp(),
      });
      playerIds.forEach(pid => {
        batch.update(doc(db, 'players', pid), { groupId });
      });
    }

    await batch.commit();
    await generateGroupFixtures(groupAssignments);
  };

  const generateGroupFixtures = async (groupAssignments) => {
    const batch = writeBatch(db);
    for (const [groupId, playerIds] of Object.entries(groupAssignments)) {
      for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
          const ref = doc(collection(db, 'matches'));
          batch.set(ref, {
            stage: 'group',
            groupId,
            player1Id: playerIds[i],
            player2Id: playerIds[j],
            score1: null,
            score2: null,
            completed: false,
            winner: null,
            createdAt: serverTimestamp(),
          });
        }
      }
    }
    await batch.commit();
  };

  const getGroupStandings = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];

    const groupPlayers = players.filter(p => group.playerIds?.includes(p.id));
    const groupMatches = matches.filter(m => m.stage === 'group' && m.groupId === groupId && m.completed);

    const table = groupPlayers.map(p => ({
      ...p, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0
    }));

    groupMatches.forEach(m => {
      const p1 = table.find(t => t.id === m.player1Id);
      const p2 = table.find(t => t.id === m.player2Id);
      if (!p1 || !p2) return;
      p1.P++; p2.P++;
      p1.GF += m.score1; p1.GA += m.score2;
      p2.GF += m.score2; p2.GA += m.score1;
      if (m.score1 > m.score2)      { p1.W++; p1.Pts += 3; p2.L++; }
      else if (m.score1 < m.score2) { p2.W++; p2.Pts += 3; p1.L++; }
      else                          { p1.D++; p1.Pts++; p2.D++; p2.Pts++; }
    });

    table.forEach(t => (t.GD = t.GF - t.GA));
    return table.sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF);
  };

  const enterScore = async (matchId, score1, score2) => {
    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);
    const match = matches.find(m => m.id === matchId);
    let winner = null;
    if (s1 > s2) winner = match.player1Id;
    else if (s2 > s1) winner = match.player2Id;
    await updateDoc(doc(db, 'matches', matchId), {
      score1: s1, score2: s2, completed: true, winner
    });
  };

  const generateKnockout = async () => {
    const n = settings?.advancersPerGroup ?? 2;
    const advancers = [];
    const sortedGroups = [...groups].sort((a, b) => a.id.localeCompare(b.id));
    sortedGroups.forEach(g => {
      const standings = getGroupStandings(g.id);
      advancers.push(...standings.slice(0, n).map(p => p.id));
    });

    if (advancers.length < 2) throw new Error('Not enough advancers to generate a knockout bracket.');

    const batch = writeBatch(db);
    const existing = await getDocs(collection(db, 'matches'));
    existing.forEach(d => {
      if (d.data().stage !== 'group') batch.delete(d.ref);
    });
    await batch.commit();

    const rounds = buildKnockoutRounds(advancers);
    const batch2 = writeBatch(db);
    rounds.forEach(({ round, matchIndex, player1Id, player2Id }) => {
      const ref = doc(collection(db, 'matches'));
      batch2.set(ref, {
        stage: round,
        matchIndex,
        player1Id: player1Id || null,
        player2Id: player2Id || null,
        score1: null, score2: null,
        completed: false, winner: null,
        createdAt: serverTimestamp(),
      });
    });
    await batch2.commit();
  };

  const buildKnockoutRounds = (players) => {
    const total = players.length;
    const rounds = [];

    let size = 1;
    while (size < total) size *= 2;

    const roundName = (sz) => {
      if (sz === 2)  return 'final';
      if (sz === 4)  return 'semifinal';
      if (sz === 8)  return 'quarterfinal';
      if (sz === 16) return 'round_of_16';
      return 'round_of_32';
    };

    for (let i = 0; i < size / 2; i++) {
      rounds.push({
        round: roundName(size),
        matchIndex: i,
        player1Id: players[i * 2] || null,
        player2Id: players[i * 2 + 1] || null,
      });
    }

    let currentSize = size / 2;
    while (currentSize > 1) {
      for (let i = 0; i < currentSize / 2; i++) {
        rounds.push({
          round: roundName(currentSize),
          matchIndex: i,
          player1Id: null,
          player2Id: null,
        });
      }
      currentSize /= 2;
    }

    return rounds;
  };

  const advanceKnockoutWinner = async (match, winnerId) => {
    const ROUND_ORDER = ['round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'final'];
    const currentIdx = ROUND_ORDER.indexOf(match.stage);
    if (currentIdx === -1 || currentIdx === ROUND_ORDER.length - 1) return;

    const nextRound      = ROUND_ORDER[currentIdx + 1];
    const nextMatchIndex = Math.floor(match.matchIndex / 2);
    const isFirst        = match.matchIndex % 2 === 0;

    const nextMatch = matches.find(m => m.stage === nextRound && m.matchIndex === nextMatchIndex);
    if (!nextMatch) return;

    await updateDoc(doc(db, 'matches', nextMatch.id), {
      [isFirst ? 'player1Id' : 'player2Id']: winnerId
    });
  };

  const enterKnockoutScore = async (matchId, score1, score2) => {
    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);
    const match = matches.find(m => m.id === matchId);

    let winner = null;
    if (s1 > s2)      winner = match.player1Id;
    else if (s2 > s1) winner = match.player2Id;

    await updateDoc(doc(db, 'matches', matchId), {
      score1: s1, score2: s2, completed: true, winner
    });

    if (winner) await advanceKnockoutWinner(match, winner);
  };

const resetTournament = async () => {
  // Delete players
  const allPlayers = await getDocs(collection(db, 'players'));
  const playerBatch = writeBatch(db);
  allPlayers.forEach(d => playerBatch.delete(d.ref));
  await playerBatch.commit();

  // Delete groups
  const allGroups = await getDocs(collection(db, 'groups'));
  const groupBatch = writeBatch(db);
  allGroups.forEach(d => groupBatch.delete(d.ref));
  await groupBatch.commit();

  // Delete matches
  const allMatches = await getDocs(collection(db, 'matches'));
  const matchBatch = writeBatch(db);
  allMatches.forEach(d => matchBatch.delete(d.ref));
  await matchBatch.commit();

  // Reset settings
  await updateDoc(doc(db, 'settings', 'main'), {
    status: 'registration',
    groupCount: 4,
    advancersPerGroup: 2,
  });


  try {
    await deleteCollection('players');
    await deleteCollection('groups');
    await deleteCollection('matches');
    await updateDoc(doc(db, 'settings', 'main'), {
      status: 'registration',
      groupCount: 4,
      advancersPerGroup: 2,
    });
  } catch (e) {
    throw new Error('Reset failed: ' + e.message);
  }
};

  const getPlayerById      = (id) => players.find(p => p.id === id);
  const getMatchesByGroup  = (groupId) => matches.filter(m => m.stage === 'group' && m.groupId === groupId);
  const getKnockoutMatches = () => matches.filter(m => m.stage !== 'group');

  const getTournamentStats = () => ({
    totalPlayers:  players.length,
    totalGroups:   groups.length,
    matchesPlayed: matches.filter(m => m.completed).length,
    totalMatches:  matches.length,
  });

  return (
    <TournamentContext.Provider value={{
      settings, players, groups, matches, loading, error,
      checkAdminPassword, updateSettings,
      registerPlayer, deletePlayer,
      setupGroups,
      getGroupStandings, getMatchesByGroup,
      enterScore, enterKnockoutScore,
      generateKnockout,
      getKnockoutMatches,
      getPlayerById,
      getTournamentStats,
      resetTournament,
    }}>
      {children}
    </TournamentContext.Provider>
  );
}