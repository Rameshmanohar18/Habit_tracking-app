import { useState, useEffect } from 'react';
import HabitGrid from './HabitGrid';
import HabitAnalytics from './HabitAnalytics';
import { RING_COLORS } from './habitUtils';
import '../App.css';

export default function HabitTracker() {
  const [habits, setHabits]               = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [now, setNow]                     = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('habits-analytics-data');
      if (stored) setHabits(JSON.parse(stored));
    } catch { /* first run */ }
    finally { setLoading(false); }
  }, []);

  const save = (updated) => {
    try {
      localStorage.setItem('habits-analytics-data', JSON.stringify(updated));
      setHabits(updated);
    } catch (err) {
      console.error('Failed to save habits:', err);
    }
  };

  /* ── CRUD ── */
  const addHabit = (name) => {
    save([...habits, { id: Date.now(), name, completions: {}, createdAt: new Date().toISOString() }]);
  };

  const removeHabit = (id) => {
    save(habits.filter(h => h.id !== id));
    if (selectedHabit?.id === id) setSelectedHabit(null);
  };

  const updateHabit = (id, name, colorIdx) => {
    const updated = habits.map(h => h.id === id ? { ...h, name, colorIdx } : h);
    save(updated);
    if (selectedHabit?.id === id) setSelectedHabit(updated.find(h => h.id === id));
  };

  const toggleHabit = (habitId, date) => {
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const completions = { ...h.completions };
      completions[date] ? delete completions[date] : (completions[date] = true);
      return { ...h, completions };
    });
    save(updated);
    if (selectedHabit?.id === habitId)
      setSelectedHabit(updated.find(h => h.id === habitId));
  };

  /* ── Habit color helper ── */
  const getHabitColor = (habitId) => {
    const idx = habits.findIndex(h => h.id === habitId);
    const habit = habits[idx];
    const colorIdx = habit?.colorIdx ?? (idx < 0 ? 0 : idx);
    return RING_COLORS[colorIdx % RING_COLORS.length];
  };

  if (loading) return (
    <div className="ht-loading">
      <div className="ht-spinner" />
      <p className="ht-loading-text">Loading your habits…</p>
    </div>
  );

  if (selectedHabit) {
    return (
      <HabitAnalytics
        habit={selectedHabit}
        habitColor={getHabitColor(selectedHabit.id)}
        onBack={() => setSelectedHabit(null)}
        onToggle={toggleHabit}
      />
    );
  }

  return (
    <HabitGrid
      habits={habits}
      now={now}
      onAdd={addHabit}
      onRemove={removeHabit}
      onUpdate={updateHabit}
      onToggle={toggleHabit}
      onSelectHabit={setSelectedHabit}
    />
  );
}
