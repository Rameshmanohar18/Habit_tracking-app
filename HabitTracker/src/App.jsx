import { Routes, Route } from 'react-router-dom';
import HabitTracker from './components/HabitTracker';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HabitTracker />} />
    </Routes>
  );
}

export default App;
