import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Groups from './pages/Groups';
import Bracket from './pages/Bracket';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import './index.css';

export default function App() {
  return (
    <TournamentProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/groups"       element={<Groups />} />
          <Route path="/bracket"      element={<Bracket />} />
          <Route path="/leaderboard"  element={<Leaderboard />} />
          <Route path="/admin"        element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </TournamentProvider>
  );
}