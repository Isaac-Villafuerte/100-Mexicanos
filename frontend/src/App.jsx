import { Routes, Route } from 'react-router-dom';
import GameBoardPage from './pages/GameBoardPage';
import HostPage from './pages/HostPage';
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/board/:gameId" element={<GameBoardPage />} />
        <Route path="/host/:gameId" element={<HostPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;
