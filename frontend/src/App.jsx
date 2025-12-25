import { Routes, Route } from 'react-router-dom';
import GameBoardPage from './pages/GameBoardPage';
import HostPage from './pages/HostPage';
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';
import BuzzerDualPage from './pages/BuzzerDualPage';
import BuzzerSinglePage from './pages/BuzzerSinglePage';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/board/:gameId" element={<GameBoardPage />} />
        <Route path="/host/:gameId" element={<HostPage />} />
        <Route path="/admin" element={<AdminPage />} />
        {/* Botonera - Pantalla dual (2 botones) */}
        <Route path="/buzzer/:gameId" element={<BuzzerDualPage />} />
        {/* Botonera - Pantalla individual (1 botón por equipo) */}
        <Route path="/buzzer/:gameId/:team" element={<BuzzerSinglePage />} />
      </Routes>
    </div>
  );
}

export default App;
