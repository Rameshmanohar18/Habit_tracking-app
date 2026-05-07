import { Routes, Route } from "react-router-dom";
import "./App.css";
import HabitTrackerApp from "./components/Habit";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HabitTrackerApp />} />
    </Routes>
  );
}

export default App;
