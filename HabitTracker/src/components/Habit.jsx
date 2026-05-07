import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import '../App.css';

export default function HabitTrackerApp() {
  const [habits, setHabits]               = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [newHabitName, setNewHabitName]   = useState('');
  const [loading, setLoading]             = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState('week');
  const [chartOffset, setChartOffset]     = useState(0);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [gridOffset, setGridOffset]       = useState(0); // 0 = most recent 20 days, 1 = prev 20, etc.

  /* ── Storage ─────────────────────────────────────────── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('habits-analytics-data');
      if (stored) setHabits(JSON.parse(stored));
    } catch {
      // first run
    } finally {
      setLoading(false);
    }
  }, []);

  const saveHabits = (updated) => {
    try {
      localStorage.setItem('habits-analytics-data', JSON.stringify(updated));
      setHabits(updated);
    } catch (err) {
      console.error('Failed to save habits:', err);
    }
  };

  /* ── CRUD ────────────────────────────────────────────── */
  const addHabit = () => {
    if (!newHabitName.trim()) return;
    saveHabits([
      ...habits,
      { id: Date.now(), name: newHabitName.trim(), completions: {}, createdAt: new Date().toISOString() },
    ]);
    setNewHabitName('');
  };

  const removeHabit = (id) => {
    saveHabits(habits.filter(h => h.id !== id));
    if (selectedHabit?.id === id) setSelectedHabit(null);
  };

  const toggleHabit = (habitId, date) => {
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const completions = { ...h.completions };
      completions[date] ? delete completions[date] : (completions[date] = true);
      return { ...h, completions };
    });
    saveHabits(updated);
    if (selectedHabit?.id === habitId)
      setSelectedHabit(updated.find(h => h.id === habitId));
  };

  /* ── Date helpers ────────────────────────────────────── */
  const dateStr = (daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  /* ── Stats ───────────────────────────────────────────── */
  const todayDone    = h => !!h.completions[dateStr(0)];
  const weeklyScore  = h => { let c=0; for(let i=0;i<7;i++) if(h.completions[dateStr(i)]) c++; return Math.round(c/7*100); };
  const monthlyScore = h => { let c=0,d=new Date().getDate(); for(let i=0;i<d;i++) if(h.completions[dateStr(i)]) c++; return Math.round(c/d*100); };
  const quarterScore = h => { let c=0; for(let i=0;i<90;i++) if(h.completions[dateStr(i)]) c++; return Math.round(c/90*100); };
  const yearlyScore  = h => { let c=0; for(let i=0;i<365;i++) if(h.completions[dateStr(i)]) c++; return Math.round(c/365*100); };

  const currentStreak = h => {
    let s=0, d=new Date();
    while(true) {
      const ds = d.toISOString().split('T')[0];
      if(h.completions[ds]) { s++; d.setDate(d.getDate()-1); } else break;
    }
    return s;
  };

  const bestStreak = h => {
    const dates = Object.keys(h.completions).sort();
    let max=0, cur=0, last=null;
    dates.forEach(ds => {
      const d = new Date(ds);
      if(last) {
        const diff = Math.floor((d-last)/(864e5));
        cur = diff===1 ? cur+1 : 1;
        max = Math.max(max, cur);
      } else { cur=1; }
      last=d;
    });
    return Math.max(max, cur);
  };

  const frequency = h => {
    const total = Object.keys(h.completions).length;
    const days  = Math.floor((new Date()-new Date(h.createdAt))/864e5)+1;
    return Math.round(total/days*100);
  };

  /* ── Chart data ──────────────────────────────────────── */
  const chartData = (h) => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (chartTimeframe === 'week') {
      return Array.from({length:7},(_,i)=>{
        const d=new Date(); d.setDate(d.getDate()-(6-i));
        const ds=d.toISOString().split('T')[0];
        return { name: d.toLocaleDateString('en-US',{weekday:'short'}), value: h.completions[ds]?100:0 };
      });
    }
    if (chartTimeframe === 'month') {
      return Array.from({length:4},(_,w)=>{
        let c=0;
        for(let d=0;d<7;d++) if(h.completions[dateStr((3-w)*7+d)]) c++;
        return { name:`Week ${w+1}`, value:Math.round(c/7*100) };
      });
    }
    const months = chartTimeframe==='quarter' ? 3 : 12;
    return Array.from({length:months},(_,i)=>{
      let c=0,t=0;
      for(let d=0;d<30;d++) { t++; if(h.completions[dateStr((months-1-i)*30+d)]) c++; }
      const dt=new Date(); dt.setMonth(dt.getMonth()-(months-1-i));
      return { name:MONTHS[dt.getMonth()], value:Math.round(c/t*100) };
    });
  };

  /* ── Calendar ────────────────────────────────────────── */
  const monthCalendar = (h) => {
    const now=new Date(), y=now.getFullYear(), m=now.getMonth();
    const first=new Date(y,m,1), last=new Date(y,m+1,0);
    const weeks=[], today=dateStr(0);
    let week=Array(first.getDay()).fill(null);
    for(let day=1;day<=last.getDate();day++){
      const d=new Date(y,m,day), ds=d.toISOString().split('T')[0];
      const isFuture = ds > today;
      week.push({ day, date:ds, completed:!!h.completions[ds], isToday:ds===today, isFuture });
      if(week.length===7){ weeks.push(week); week=[]; }
    }
    if(week.length){ while(week.length<7) week.push(null); weeks.push(week); }
    return weeks;
  };

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) return (
    <div className="ht-loading">
      <div className="ht-spinner" />
      <p className="ht-loading-text">Loading your habits…</p>
    </div>
  );

  /* ── Detail view ─────────────────────────────────────── */
  if (selectedHabit) {
    const data     = chartData(selectedHabit);
    const calendar = monthCalendar(selectedHabit);
    
    const todayScore    = todayDone(selectedHabit) ? 100 : 0;
    const weekScore     = weeklyScore(selectedHabit);
    const monthScore    = monthlyScore(selectedHabit);
    const yearScore     = yearlyScore(selectedHabit);
    const totalDays     = Object.keys(selectedHabit.completions).length;
    const streak        = currentStreak(selectedHabit);
    const best          = bestStreak(selectedHabit);

    // Best streaks list (find all streaks)
    const allStreaks = (() => {
      const dates = Object.keys(selectedHabit.completions).sort();
      const streaks = [];
      let start = null, end = null, len = 0;
      dates.forEach((ds, i) => {
        const d = new Date(ds);
        if (i === 0) { start = end = ds; len = 1; return; }
        const prev = new Date(dates[i - 1]);
        const diff = Math.floor((d - prev) / 864e5);
        if (diff === 1) {
          len++;
          end = ds;
        } else {
          if (len >= 2) streaks.push({ start, end, len });
          start = end = ds;
          len = 1;
        }
      });
      if (len >= 2) streaks.push({ start, end, len });
      return streaks.sort((a, b) => b.len - a.len).slice(0, 10);
    })();

    // Frequency dots (last 12 months, each month shows completion %)
    const frequencyData = Array.from({ length: 12 }, (_, i) => {
      const monthsAgo = 11 - i;
      let completed = 0, total = 0;
      for (let d = 0; d < 30; d++) {
        const daysAgo = monthsAgo * 30 + d;
        total++;
        if (selectedHabit.completions[dateStr(daysAgo)]) completed++;
      }
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        percent: Math.round((completed / total) * 100),
      };
    });

    return (
      <div className="ht-detail-v2">
        <div className="ht-detail-v2-container">

          {/* ── Top bar ── */}
          <div className="ht-detail-topbar">
            <button className="ht-back-icon-btn" onClick={() => setSelectedHabit(null)}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="ht-detail-v2-title">{selectedHabit.name}</h1>
            <div className="ht-detail-topbar-actions">
              <button className="ht-icon-btn" title="Edit"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4l5 5-9 9H2v-5l9-9z"/></svg></button>
              <button className="ht-icon-btn" title="More"><svg width="18" height="18" fill="currentColor"><circle cx="9" cy="3" r="1.5"/><circle cx="9" cy="9" r="1.5"/><circle cx="9" cy="15" r="1.5"/></svg></button>
            </div>
          </div>

          <div className="ht-detail-v2-meta">
            <span>🔁 Every day</span>
            <span>🔕 Off</span>
          </div>

          {/* ── Overview section ── */}
          <section className="ht-section">
            <h2 className="ht-section-title">Overview</h2>

            <div className="ht-overview-grid">
              {/* Big ring */}
              <div className="ht-overview-ring">
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="url(#ringGrad)" strokeWidth="8"
                    strokeDasharray={`${weekScore * 3.267} 326.7`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" fill="var(--text-primary)" fontSize="32" fontWeight="700">{weekScore}%</text>
                </svg>
                <p className="ht-ring-label">Score</p>
              </div>

              {/* Stats */}
              <div className="ht-overview-stat">
                <div className="ht-stat-value grad-green">+{monthScore}%</div>
                <div className="ht-stat-label">Month</div>
              </div>
              <div className="ht-overview-stat">
                <div className="ht-stat-value grad-orange">+{yearScore}%</div>
                <div className="ht-stat-label">Year</div>
              </div>
              <div className="ht-overview-stat">
                <div className="ht-stat-value grad-cyan">{totalDays}</div>
                <div className="ht-stat-label">Total</div>
              </div>
            </div>
          </section>

          {/* ── Score chart (line) ── */}
          <section className="ht-section">
            <div className="ht-section-header">
              <h2 className="ht-section-title">Score</h2>
              <select className="ht-select-v2" value={chartTimeframe} onChange={e => setChartTimeframe(e.target.value)}>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div className="ht-chart-v2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ background: 'rgba(10,10,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    formatter={v => [`${v}%`, 'Score']}
                  />
                  <Bar dataKey="value" fill="url(#lineGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── History (bar chart) ── */}
          <section className="ht-section">
            <div className="ht-section-header">
              <h2 className="ht-section-title">History</h2>
              <select className="ht-select-v2" value={chartTimeframe} onChange={e => setChartTimeframe(e.target.value)}>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div className="ht-chart-v2">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ background: 'rgba(10,10,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    formatter={v => [`${v}%`, 'Completion']}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Calendar heatmap ── */}
          <section className="ht-section">
            <div className="ht-section-header">
              <h2 className="ht-section-title">Calendar</h2>
              <select className="ht-select-v2">
                <option>Month</option>
              </select>
            </div>

            <div className="ht-heatmap">
              {/* Month labels */}
              <div className="ht-heatmap-months">
                {['Jan','Feb','Mar','Apr','May','Jun'].map(m => <span key={m}>{m}</span>)}
              </div>

              {/* Day labels */}
              <div className="ht-heatmap-days">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <span key={d}>{d}</span>)}
              </div>

              {/* Grid */}
              <div className="ht-heatmap-grid">
                {calendar.map((week, wi) => (
                  <div key={wi} className="ht-heatmap-week">
                    {week.map((day, di) => (
                      <button
                        key={di}
                        disabled={!day || day.isFuture}
                        onClick={() => day && !day.isFuture && toggleHabit(selectedHabit.id, day.date)}
                        className={`ht-heatmap-cell ${!day ? 'empty' : ''} ${day?.completed ? 'filled' : ''} ${day?.isFuture ? 'future' : ''}`}
                        title={day ? `${day.date} - ${day.completed ? 'Done' : 'Missed'}` : ''}
                      >
                        {day?.completed ? day.day : ''}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <button className="ht-edit-btn">EDIT</button>
          </section>

          {/* ── Best streaks ── */}
          <section className="ht-section">
            <h2 className="ht-section-title">Best streaks</h2>

            <div className="ht-streaks-list">
              {allStreaks.length === 0 ? (
                <p className="ht-empty-text">No streaks yet</p>
              ) : (
                allStreaks.map((s, i) => (
                  <div key={i} className="ht-streak-row">
                    <span className="ht-streak-date">{new Date(s.start).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <div className="ht-streak-bar">
                      <div className="ht-streak-fill" style={{ width: `${(s.len / best) * 100}%` }} />
                      <span className="ht-streak-len">{s.len}</span>
                    </div>
                    <span className="ht-streak-date">{new Date(s.end).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ── Frequency dots ── */}
          <section className="ht-section">
            <h2 className="ht-section-title">Frequency</h2>

            <div className="ht-freq-grid">
              {frequencyData.map((m, i) => (
                <div key={i} className="ht-freq-col">
                  <div className="ht-freq-dots">
                    {[0, 1, 2, 3].map(row => (
                      <div
                        key={row}
                        className={`ht-freq-dot ${m.percent > row * 25 ? 'active' : ''}`}
                        style={m.percent > row * 25 ? { opacity: 0.3 + (m.percent / 100) * 0.7 } : {}}
                      />
                    ))}
                  </div>
                  <span className="ht-freq-label">{m.month}</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    );
  }

  /* ── List view ───────────────────────────────────────── */

  // Build 20 days with offset (0 = most recent 20, 1 = prev 20, etc.)
  const DAYS_SHOWN = 20;
  const startDaysAgo = gridOffset * DAYS_SHOWN;
  const columns = Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const daysAgo = startDaysAgo + (DAYS_SHOWN - 1 - i);
    const ds = dateStr(daysAgo);
    const d  = new Date(); d.setDate(d.getDate() - daysAgo);
    return {
      dateStr: ds,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum:  d.getDate(),
      isToday: daysAgo === 0,
    };
  });

  // Date range label
  const rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - (startDaysAgo + DAYS_SHOWN - 1));
  const rangeEnd   = new Date(); rangeEnd.setDate(rangeEnd.getDate() - startDaysAgo);
  const rangeLabel = `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Gradient colors per habit (cycles through a palette)
  const RING_COLORS = [
    ['#22d3ee','#3b82f6'],
    ['#34d399','#10b981'],
    ['#a855f7','#ec4899'],
    ['#fbbf24','#f97316'],
    ['#f87171','#ef4444'],
    ['#818cf8','#6366f1'],
  ];

  return (
    <div className="ht-app">
      <div className="ht-grid-container">

        {/* ── Top bar ── */}
        <div className="ht-topbar">
          <h1 className="ht-topbar-title">Habits</h1>
          <div className="ht-topbar-actions">
            <button className="ht-icon-btn" onClick={() => setNewHabitName('__open__')} title="Add habit">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* ── Add habit inline ── */}
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
                if (e.key === 'Enter') addHabit();
                if (e.key === 'Escape') setNewHabitName('');
              }}
            />
            <button className="ht-add-btn" onClick={addHabit}>
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
            {/* ── Date range navigation ── */}
            <div className="ht-grid-nav">
              <button
                className="ht-nav-btn"
                onClick={() => setGridOffset(gridOffset + 1)}
                title="Previous 20 days"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="ht-grid-range">{rangeLabel}</span>
              <button
                className="ht-nav-btn"
                onClick={() => setGridOffset(Math.max(0, gridOffset - 1))}
                disabled={gridOffset === 0}
                title="Next 20 days"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="ht-grid-wrap">
              {/* ── Column headers (day names + dates) ── */}
              <div className="ht-grid-header">
                <div className="ht-grid-name-col" />
                {columns.map(col => (
                  <div key={col.dateStr} className={`ht-col-header ${col.isToday ? 'is-today-col' : ''}`}>
                    <span className="ht-col-day">{col.dayName}</span>
                    <span className="ht-col-num">{col.dayNum}</span>
                  </div>
                ))}
                <div className="ht-grid-del-col" />
              </div>

              {/* ── Habit rows ── */}
              {habits.map((habit, hi) => {
                const [c1, c2] = RING_COLORS[hi % RING_COLORS.length];
                return (
                  <div key={habit.id} className="ht-grid-row" style={{ animationDelay: `${hi * 40}ms` }}>
                    {/* Habit name with ring icon */}
                    <div className="ht-grid-name" onClick={() => setSelectedHabit(habit)}>
                      <svg className="ht-ring-icon" viewBox="0 0 36 36" width="28" height="28">
                        <defs>
                          <linearGradient id={`ring-${habit.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={c1} />
                            <stop offset="100%" stopColor={c2} />
                          </linearGradient>
                        </defs>
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke={`url(#ring-${habit.id})`} strokeWidth="3"
                          strokeDasharray={`${weeklyScore(habit) * 0.942} 94.2`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                      </svg>
                      <span className="ht-grid-habit-name" style={{ color: c1 }}>{habit.name}</span>
                    </div>

                    {/* Day cells */}
                    {columns.map(col => {
                      const done    = !!habit.completions[col.dateStr];
                      const isPast  = col.dateStr <= dateStr(0);
                      return (
                        <div key={col.dateStr} className="ht-grid-cell">
                          <button
                            className={`ht-cell-btn ${done ? 'cell-done' : 'cell-miss'} ${col.isToday ? 'cell-today' : ''}`}
                            style={done ? { color: c1 } : {}}
                            onClick={() => isPast && toggleHabit(habit.id, col.dateStr)}
                            disabled={!isPast}
                            title={!isPast ? 'Future date' : done ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {done ? '✓' : '✗'}
                          </button>
                        </div>
                      );
                    })}

                    {/* Delete */}
                    <div className="ht-grid-del-col">
                      <button
                        className="ht-delete-btn"
                        onClick={() => removeHabit(habit.id)}
                        aria-label="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="ht-hint">Tap a habit name to view detailed analytics · Use ← → to browse past data</p>
          </>
        )}

      </div>
    </div>
  );
}
