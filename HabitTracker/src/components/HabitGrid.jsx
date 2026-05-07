import { useState } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { RING_COLORS, dateStr, weeklyScore, QUOTES, dayOfYear } from './habitUtils';
import EditHabitModal from './EditHabitModal';
import ConfettiBurst from './ConfettiBurst';

const DAYS_SHOWN  = 50;
const TOTAL_DAYS  = 365 * 5;
const TOTAL_PAGES = Math.ceil(TOTAL_DAYS / DAYS_SHOWN);

export default function HabitGrid({ habits, now, onAdd, onRemove, onUpdate, onToggle, onSelectHabit }) {
  const [newHabitName, setNewHabitName] = useState('');
  const [gridOffset, setGridOffset]     = useState(0);
  const [editingHabit, setEditingHabit] = useState(null);
  const [editHabitIdx, setEditHabitIdx] = useState(0);
  const [confetti, setConfetti]         = useState(null);

  const todayQuote = QUOTES[dayOfYear(now) % QUOTES.length];

  const launchConfetti = (x, y, color) => {
    setConfetti({ x, y, color, id: Date.now() });
    setTimeout(() => setConfetti(null), 1200);
  };

  const handleToggle = (habitId, dateString, event) => {
    const habit = habits.find(h => h.id === habitId);
    const wasCompleted = !!habit?.completions[dateString];
    onToggle(habitId, dateString, event);
    if (!wasCompleted && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const [c1] = getColor(habitId);
      launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, c1);
    }
  };

  const getColor = (habitId) => {
    const idx = habits.findIndex(h => h.id === habitId);
    const habit = habits[idx];
    const colorIdx = habit?.colorIdx ?? (idx < 0 ? 0 : idx);
    return RING_COLORS[colorIdx % RING_COLORS.length];
  };

  // Build columns for current page
  const pageStart = gridOffset * DAYS_SHOWN;
  const columns = Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const daysAgo = pageStart + i;
    const ds = dateStr(daysAgo);
    const d  = new Date(); d.setDate(d.getDate() - daysAgo);
    return {
      dateStr: ds,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum:  d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: daysAgo === 0,
    };
  });

  const pageEndDate   = new Date(); pageEndDate.setDate(pageEndDate.getDate() - pageStart);
  const pageStartDate = new Date(); pageStartDate.setDate(pageStartDate.getDate() - (pageStart + DAYS_SHOWN - 1));
  const rangeLabel = gridOffset === 0
    ? `Today — ${pageStartDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`
    : `${pageEndDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} — ${pageStartDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;

  return (
    <div className="ht-app">
      {confetti && <ConfettiBurst key={confetti.id} x={confetti.x} y={confetti.y} color={confetti.color} />}

      <div className="ht-grid-container">

        {/* Date / Time / Quote banner */}
        <div className="ht-banner">
          <div className="ht-banner-left">
            <div className="ht-banner-time">
              {now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
            </div>
            <div className="ht-banner-date">
              {now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
            </div>
          </div>
          <div className="ht-banner-quote">
            <span className="ht-quote-mark">"</span>
            <span className="ht-quote-text">{todayQuote.text}</span>
            <span className="ht-quote-author">— {todayQuote.author}</span>
          </div>
        </div>

        {/* Top bar */}
        <div className="ht-topbar">
          <h1 className="ht-topbar-title">Habits</h1>
          <div className="ht-topbar-actions">
            <button className="ht-icon-btn" onClick={() => setNewHabitName('__open__')} title="Add habit">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Add habit inline */}
        {newHabitName !== '' && (
          <div className="ht-add-card">
            <input
              className="ht-input"
              type="text"
              placeholder="Name your new habit…"
              value={newHabitName === '__open__' ? '' : newHabitName}
              autoFocus
              onChange={e => setNewHabitName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newHabitName.trim() && newHabitName !== '__open__') {
                  onAdd(newHabitName.trim());
                  setNewHabitName('');
                }
                if (e.key === 'Escape') setNewHabitName('');
              }}
            />
            <button className="ht-add-btn" onClick={() => {
              if (newHabitName.trim() && newHabitName !== '__open__') {
                onAdd(newHabitName.trim());
                setNewHabitName('');
              }
            }}>
              <Plus size={16} /> Add
            </button>
            <button className="ht-cancel-btn" onClick={() => setNewHabitName('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {habits.length === 0 ? (
          <div className="ht-empty">
            <div className="ht-empty-icon">🌱</div>
            <p>No habits yet — tap + to add your first one!</p>
          </div>
        ) : (
          <>
            {/* Pagination nav */}
            <div className="ht-grid-nav">
              <button className="ht-nav-btn" onClick={() => setGridOffset(Math.min(TOTAL_PAGES-1, gridOffset+1))} disabled={gridOffset >= TOTAL_PAGES-1} title="Older data">
                <ChevronLeft size={16} /> Older
              </button>
              <div className="ht-page-info">
                <span className="ht-grid-range">{rangeLabel}</span>
                <span className="ht-page-num">Page {gridOffset+1} / {TOTAL_PAGES}</span>
              </div>
              <button className="ht-nav-btn" onClick={() => setGridOffset(Math.max(0, gridOffset-1))} disabled={gridOffset === 0} title="Newer data">
                Newer <ChevronRight size={16} />
              </button>
            </div>

            <div className="ht-grid-wrap">
              {/* Column headers */}
              <div className="ht-grid-header">
                <div className="ht-grid-name-col" />
                {columns.map((col, ci) => {
                  const prev = columns[ci - 1];
                  const showMonth = ci === 0 || col.monthName !== prev?.monthName;
                  return (
                    <div key={col.dateStr} className={`ht-col-header ${col.isToday ? 'is-today-col' : ''}`}>
                      <span className="ht-col-month">{showMonth ? col.monthName : ''}</span>
                      <span className="ht-col-day">{col.dayName}</span>
                      <span className="ht-col-num">{col.dayNum}</span>
                    </div>
                  );
                })}
                <div className="ht-grid-del-col" />
              </div>

              {/* Habit rows */}
              {habits.map((habit, hi) => {
                const [c1, c2] = getColor(habit.id);
                return (
                  <div key={habit.id} className="ht-grid-row" style={{ animationDelay: `${hi * 40}ms` }}>
                    <div className="ht-grid-name" onClick={() => onSelectHabit(habit)} title="Click to view analytics">
                      <svg className="ht-ring-icon" viewBox="0 0 36 36" width="28" height="28">
                        <defs>
                          <linearGradient id={`ring-${habit.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={c1} />
                            <stop offset="100%" stopColor={c2} />
                          </linearGradient>
                        </defs>
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke={`url(#ring-${habit.id})`} strokeWidth="3"
                          strokeDasharray={`${weeklyScore(habit) * 0.942} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                      </svg>
                      <span className="ht-grid-habit-name" style={{ color: c1 }}>{habit.name}</span>
                      <button
                        className="ht-edit-icon-btn"
                        onClick={e => { e.stopPropagation(); setEditingHabit(habit); setEditHabitIdx(hi); }}
                        title="Edit name or color"
                      >
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>

                    {columns.map(col => {
                      const done  = !!habit.completions[col.dateStr];
                      const isPast = col.dateStr <= dateStr(0);
                      return (
                        <div key={col.dateStr} className="ht-grid-cell">
                          <button
                            className={`ht-cell-btn ${done ? 'cell-done' : 'cell-miss'} ${col.isToday ? 'cell-today' : ''}`}
                            style={done ? { color: c1 } : {}}
                            onClick={e => isPast && handleToggle(habit.id, col.dateStr, e)}
                            disabled={!isPast}
                            title={!isPast ? 'Future date' : done ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {done ? '✓' : '✗'}
                          </button>
                        </div>
                      );
                    })}

                    <div className="ht-grid-del-col">
                      <button className="ht-delete-btn" onClick={() => onRemove(habit.id)} aria-label="Delete">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="ht-hint">Tap to view analytics · Hover + click ✏️ to rename or change color · Use ← → to browse past data</p>
          </>
        )}

      </div>

      {/* Edit modal */}
      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          habitIndex={editHabitIdx}
          onSave={(id, name, colorIdx) => { onUpdate(id, name, colorIdx); setEditingHabit(null); }}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </div>
  );
}
