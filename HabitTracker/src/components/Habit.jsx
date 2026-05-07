import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import '../App.css';

/* ── Confetti burst component ── */
function ConfettiBurst({ x, y, color }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const COLORS = [color, '#ffffff', '#fbbf24', '#f0eeff', '#a855f7', '#34d399'];
    const particles = Array.from({ length: 60 }, () => ({
      x, y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 1.5) * 10,
      size: Math.random() * 7 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      alpha: 1,
    }));

    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.018;
        if (p.alpha <= 0) return;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      if (alive) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [x, y, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        zIndex: 9999, width: '100vw', height: '100vh',
      }}
    />
  );
}

export default function HabitTrackerApp() {
  const [habits, setHabits]               = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [newHabitName, setNewHabitName]   = useState('');
  const [loading, setLoading]             = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState('week');
  const [chartOffset, setChartOffset]     = useState(0);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [calendarMode, setCalendarMode]   = useState('quarter');
  const [gridOffset, setGridOffset]       = useState(0);
  const [now, setNow]                     = useState(new Date());
  const [editingHabit, setEditingHabit]   = useState(null); // { id, name, colorIdx }
  const [editName, setEditName]           = useState('');
  const [editColorIdx, setEditColorIdx]   = useState(0);

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Daily quote — changes each day based on day of year
  const QUOTES = [
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "You'll never change your life until you change something you do daily.", author: "John C. Maxwell" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
    { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
    { text: "Chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
    { text: "Habits are the compound interest of self-improvement.", author: "James Clear" },
    { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "It's not what we do once in a while that shapes our lives, but what we do consistently.", author: "Tony Robbins" },
    { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "One day or day one. You decide.", author: "Unknown" },
    { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
    { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { text: "Progress, not perfection.", author: "Unknown" },
    { text: "Be consistent. Be patient. Be persistent.", author: "Unknown" },
    { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
    { text: "The secret to getting ahead is getting started.", author: "Mark Twain" },
    { text: "Your net worth to the world is determined by what remains after your bad habits are subtracted from your good ones.", author: "Benjamin Franklin" },
    { text: "Good habits formed at youth make all the difference.", author: "Aristotle" },
    { text: "Strive for progress, not perfection.", author: "Unknown" },
    { text: "Small steps every day.", author: "Unknown" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "We become what we think about.", author: "Earl Nightingale" },
  ];

  const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  const todayQuote = QUOTES[dayOfYear(now) % QUOTES.length];

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

  const updateHabit = (id, name, colorIdx) => {
    const updated = habits.map(h => h.id === id ? { ...h, name, colorIdx } : h);
    saveHabits(updated);
    if (selectedHabit?.id === id) setSelectedHabit(updated.find(h => h.id === id));
    setEditingHabit(null);
  };

  const openEdit = (habit, idx) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditColorIdx(habit.colorIdx ?? idx);
  };

  const [confetti, setConfetti] = useState(null); // { x, y, color }

  const launchConfetti = (x, y, color) => {
    setConfetti({ x, y, color, id: Date.now() });
    setTimeout(() => setConfetti(null), 1200);
  };

  const toggleHabit = (habitId, date, event) => {
    const wasCompleted = !!habits.find(h => h.id === habitId)?.completions[date];
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const completions = { ...h.completions };
      completions[date] ? delete completions[date] : (completions[date] = true);
      return { ...h, completions };
    });
    saveHabits(updated);
    if (selectedHabit?.id === habitId)
      setSelectedHabit(updated.find(h => h.id === habitId));
    // Fire confetti only when marking as DONE (not undoing)
    if (!wasCompleted && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const [c1] = habitColor(habitId);
      launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, c1);
    }
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

  /* ── Chart data with offset ─────────────────────────── */
  const chartData = (h) => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (chartTimeframe === 'week') {
      // Show each day of the selected week — 7 points on the line
      const baseOffset = chartOffset * 7;
      return Array.from({length:7},(_,i)=>{
        const daysAgo = baseOffset + (6 - i);
        const d = new Date(); d.setDate(d.getDate() - daysAgo);
        const ds = d.toISOString().split('T')[0];
        return {
          name: `${d.toLocaleDateString('en-US',{month:'short'})} ${d.getDate()}`,
          value: h.completions[ds] ? 100 : 0,
        };
      });
    }
    if (chartTimeframe === 'month') {
      // Show each day of the selected month — daily points
      const baseOffset = chartOffset;
      const refDate = new Date();
      refDate.setMonth(refDate.getMonth() - baseOffset);
      const y = refDate.getFullYear(), m = refDate.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      return Array.from({length: daysInMonth}, (_, i) => {
        const d = new Date(y, m, i + 1);
        const ds = d.toISOString().split('T')[0];
        return {
          name: i % 5 === 0 ? `${MONTHS[m]} ${i+1}` : '',
          value: h.completions[ds] ? 100 : 0,
        };
      });
    }
    if (chartTimeframe === 'quarter') {
      // Show each week of the selected quarter — ~13 points
      const baseOffset = chartOffset * 13;
      return Array.from({length:13},(_,i)=>{
        let c=0;
        const weekStart = (baseOffset + (12 - i)) * 7;
        for(let d=0;d<7;d++) if(h.completions[dateStr(weekStart+d)]) c++;
        const dt = new Date(); dt.setDate(dt.getDate() - (baseOffset + (12-i))*7);
        return {
          name: `${MONTHS[dt.getMonth()]} ${dt.getDate()}`,
          value: Math.round(c/7*100),
        };
      });
    }
    // year — show each week of the year (~52 points)
    const baseOffset = chartOffset * 52;
    return Array.from({length:52},(_,i)=>{
      let c=0;
      const weekStart = (baseOffset + (51 - i)) * 7;
      for(let d=0;d<7;d++) if(h.completions[dateStr(weekStart+d)]) c++;
      const dt = new Date(); dt.setDate(dt.getDate() - (baseOffset + (51-i))*7);
      return {
        name: i % 4 === 0 ? `${MONTHS[dt.getMonth()]} ${dt.getFullYear().toString().slice(2)}` : '',
        value: Math.round(c/7*100),
      };
    });
  };

  /* ── Chart period label ──────────────────────────────── */
  const chartPeriodLabel = () => {
    const now = new Date();
    if (chartTimeframe === 'week') {
      const end = new Date(); end.setDate(end.getDate() - chartOffset * 7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      return `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
    }
    if (chartTimeframe === 'month') {
      const d = new Date(); d.setMonth(d.getMonth() - chartOffset);
      return d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    }
    if (chartTimeframe === 'quarter') {
      const end = new Date(); end.setMonth(end.getMonth() - chartOffset * 3);
      const start = new Date(end); start.setMonth(start.getMonth() - 2);
      return `${start.toLocaleDateString('en-US',{month:'short',year:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',year:'numeric'})}`;
    }
    const d = new Date(); d.setFullYear(d.getFullYear() - chartOffset);
    return `${d.getFullYear()}`;
  };

  /* ── Calendar with offset + mode ────────────────────── */
  // Returns a flat list of day objects for the current view
  const calendarDays = (h) => {
    const today = dateStr(0);

    if (calendarMode === 'week') {
      // 7 days: offset 0 = this week (Mon–Sun), 1 = last week, etc.
      return Array.from({ length: 7 }, (_, i) => {
        const daysAgo = calendarOffset * 7 + (6 - i);
        const d = new Date(); d.setDate(d.getDate() - daysAgo);
        const ds = d.toISOString().split('T')[0];
        return { day: d.getDate(), date: ds, completed: !!h.completions[ds], isToday: ds === today, isFuture: ds > today, dayName: d.toLocaleDateString('en-US', { weekday: 'short' }) };
      });
    }

    if (calendarMode === 'month') {
      const ref = new Date(); ref.setMonth(ref.getMonth() - calendarOffset);
      const y = ref.getFullYear(), m = ref.getMonth();
      const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
      const weeks = [];
      let week = Array(first.getDay()).fill(null);
      for (let day = 1; day <= last.getDate(); day++) {
        const d = new Date(y, m, day), ds = d.toISOString().split('T')[0];
        week.push({ day, date: ds, completed: !!h.completions[ds], isToday: ds === today, isFuture: ds > today });
        if (week.length === 7) { weeks.push(week); week = []; }
      }
      if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
      return weeks; // array of weeks
    }

    if (calendarMode === 'quarter') {
      // 3 months side by side
      return Array.from({ length: 3 }, (_, mi) => {
        const ref = new Date(); ref.setMonth(ref.getMonth() - calendarOffset * 3 - (2 - mi));
        const y = ref.getFullYear(), m = ref.getMonth();
        const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
        const weeks = [];
        let week = Array(first.getDay()).fill(null);
        for (let day = 1; day <= last.getDate(); day++) {
          const d = new Date(y, m, day), ds = d.toISOString().split('T')[0];
          week.push({ day, date: ds, completed: !!h.completions[ds], isToday: ds === today, isFuture: ds > today });
          if (week.length === 7) { weeks.push(week); week = []; }
        }
        if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
        return { label: ref.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), weeks };
      });
    }

    // year — 12 months
    return Array.from({ length: 12 }, (_, mi) => {
      const ref = new Date(); ref.setMonth(ref.getMonth() - calendarOffset * 12 - (11 - mi));
      const y = ref.getFullYear(), m = ref.getMonth();
      const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
      const weeks = [];
      let week = Array(first.getDay()).fill(null);
      for (let day = 1; day <= last.getDate(); day++) {
        const d = new Date(y, m, day), ds = d.toISOString().split('T')[0];
        week.push({ day, date: ds, completed: !!h.completions[ds], isToday: ds === today, isFuture: ds > today });
        if (week.length === 7) { weeks.push(week); week = []; }
      }
      if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
      return { label: ref.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), weeks };
    });
  };

  const calendarPeriodLabel = () => {
    if (calendarMode === 'week') {
      const end = new Date(); end.setDate(end.getDate() - calendarOffset * 7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (calendarMode === 'month') {
      const d = new Date(); d.setMonth(d.getMonth() - calendarOffset);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (calendarMode === 'quarter') {
      const end = new Date(); end.setMonth(end.getMonth() - calendarOffset * 3);
      const start = new Date(end); start.setMonth(start.getMonth() - 2);
      return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    const d = new Date(); d.setFullYear(d.getFullYear() - calendarOffset);
    return `${d.getFullYear()}`;
  };

  // Keep old monthCalendar for backward compat (used nowhere else now)
  const monthCalendar = (h) => calendarDays(h);
  const calendarMonthLabel = () => calendarPeriodLabel();

  /* ── Gradient colors per habit (shared between list + detail) ── */
  const RING_COLORS = [
    ['#22d3ee','#3b82f6'],
    ['#34d399','#10b981'],
    ['#a855f7','#ec4899'],
    ['#fbbf24','#f97316'],
    ['#f87171','#ef4444'],
    ['#818cf8','#6366f1'],
  ];

  const habitColor = (habitId) => {
    const idx = habits.findIndex(h => h.id === habitId);
    const habit = habits[idx];
    const colorIdx = habit?.colorIdx ?? (idx < 0 ? 0 : idx);
    return RING_COLORS[colorIdx % RING_COLORS.length];
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
    const [hc1, hc2] = habitColor(selectedHabit.id); // habit's own color

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
            <h1 className="ht-detail-v2-title" style={{ color: hc1 }}>{selectedHabit.name}</h1>
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
            <h2 className="ht-section-title" style={{ color: hc1 }}>Overview</h2>

            <div className="ht-overview-grid">
              {/* Big ring */}
              <div className="ht-overview-ring">
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={hc1} />
                      <stop offset="100%" stopColor={hc2} />
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
                <div className="ht-stat-value" style={{ color: hc1 }}>+{monthScore}%</div>
                <div className="ht-stat-label">Month</div>
              </div>
              <div className="ht-overview-stat">
                <div className="ht-stat-value" style={{ color: hc2 }}>+{yearScore}%</div>
                <div className="ht-stat-label">Year</div>
              </div>
              <div className="ht-overview-stat">
                <div className="ht-stat-value" style={{ color: hc1 }}>{totalDays}</div>
                <div className="ht-stat-label">Total</div>
              </div>
            </div>
          </section>

          {/* ── Score chart (line) ── */}
          <section className="ht-section">
            <div className="ht-section-header">
              <h2 className="ht-section-title" style={{ color: hc1 }}>Score</h2>
              <select className="ht-select-v2" value={chartTimeframe} onChange={e => { setChartTimeframe(e.target.value); setChartOffset(0); }}>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>

            {/* Period navigation */}
            <div className="ht-period-nav">
              <button className="ht-nav-btn" onClick={() => setChartOffset(chartOffset + 1)} title="Previous period">
                <ChevronLeft size={16} />
              </button>
              <span className="ht-period-label">{chartPeriodLabel()}</span>
              <button className="ht-nav-btn" onClick={() => setChartOffset(Math.max(0, chartOffset - 1))} disabled={chartOffset === 0} title="Next period">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="ht-chart-v2">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={hc1} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={hc1} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} interval={chartTimeframe === 'year' ? 1 : 0} />
                  <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[20, 40, 60, 80, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} contentStyle={{ background: 'rgba(10,10,15,0.95)', border: `1px solid ${hc1}55`, borderRadius: 8, fontSize: 11 }} formatter={v => [`${v}%`, 'Score']} />
                  <Line type="monotone" dataKey="value" stroke={hc1} strokeWidth={2} dot={{ r: 3, fill: hc1, stroke: hc2, strokeWidth: 1.5 }} activeDot={{ r: 5, fill: hc1, stroke: '#fff', strokeWidth: 1.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── History (bar chart) ── */}
          <section className="ht-section">
            <div className="ht-section-header">
              <h2 className="ht-section-title" style={{ color: hc1 }}>History</h2>
              <select className="ht-select-v2" value={chartTimeframe} onChange={e => { setChartTimeframe(e.target.value); setChartOffset(0); }}>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>

            {/* Period navigation */}
            <div className="ht-period-nav">
              <button className="ht-nav-btn" onClick={() => setChartOffset(chartOffset + 1)} title="Previous period">
                <ChevronLeft size={16} />
              </button>
              <span className="ht-period-label">{chartPeriodLabel()}</span>
              <button className="ht-nav-btn" onClick={() => setChartOffset(Math.max(0, chartOffset - 1))} disabled={chartOffset === 0} title="Next period">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="ht-chart-v2">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: 'rgba(10,10,15,0.95)', border: `1px solid ${hc1}55`, borderRadius: 8, fontSize: 11 }} formatter={v => [`${v}%`, 'Completion']} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={hc1} stopOpacity="1" />
                      <stop offset="100%" stopColor={hc2} stopOpacity="0.7" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Calendar heatmap ── */}
          <section className="ht-section">
            <div className="ht-section-header">
              <h2 className="ht-section-title" style={{ color: hc1 }}>Calendar</h2>
              <select className="ht-select-v2" value={calendarMode} onChange={e => { setCalendarMode(e.target.value); setCalendarOffset(0); }}>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>

            {/* Period navigation */}
            <div className="ht-period-nav">
              <button className="ht-nav-btn" onClick={() => setCalendarOffset(calendarOffset + 1)} title="Previous period">
                <ChevronLeft size={16} />
              </button>
              <span className="ht-period-label">{calendarPeriodLabel()}</span>
              <button className="ht-nav-btn" onClick={() => setCalendarOffset(Math.max(0, calendarOffset - 1))} disabled={calendarOffset === 0} title="Next period">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* ── Week view: single row of 7 days ── */}
            {calendarMode === 'week' && (() => {
              const days = calendarDays(selectedHabit);
              return (
                <div className="ht-cal-week-view" style={{ '--habit-c1': hc1, '--habit-c2': hc2 }}>
                  {days.map((day, i) => (
                    <div key={i} className="ht-cal-week-col">
                      <span className="ht-cal-week-dayname">{day.dayName}</span>
                      <button
                        className={`ht-cal-week-cell ${day.completed ? 'done' : 'missed'} ${day.isToday ? 'today' : ''} ${day.isFuture ? 'future' : ''}`}
                        disabled={day.isFuture}
                        onClick={e => !day.isFuture && toggleHabit(selectedHabit.id, day.date, e)}
                        title={`${day.date} — ${day.completed ? 'Done ✓' : 'Missed ✗'}`}
                      >
                        <span className="ht-cal-week-num">{day.day}</span>
                        <span className="ht-cal-week-tick">{day.completed ? '✓' : '✗'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── Month view: standard calendar grid ── */}
            {calendarMode === 'month' && (() => {
              const weeks = calendarDays(selectedHabit);
              return (
                <div className="ht-cal-month-view" style={{ '--habit-c1': hc1, '--habit-c2': hc2 }}>
                  <div className="ht-cal-dow-row">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="ht-cal-dow">{d}</span>)}
                  </div>
                  {weeks.map((week, wi) => (
                    <div key={wi} className="ht-cal-month-week">
                      {week.map((day, di) => (
                        <button
                          key={di}
                          disabled={!day || day.isFuture}
                          onClick={() => day && !day.isFuture && toggleHabit(selectedHabit.id, day.date)}
                          className={`ht-cal-month-cell ${!day ? 'empty' : ''} ${day?.completed ? 'done' : ''} ${day?.isFuture ? 'future' : ''} ${day?.isToday ? 'today' : ''}`}
                          title={day ? `${day.date} — ${day.completed ? 'Done ✓' : 'Missed ✗'}` : ''}
                        >
                          {day?.day ?? ''}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── Quarter view: 3 mini month grids ── */}
            {calendarMode === 'quarter' && (() => {
              const months = calendarDays(selectedHabit);
              return (
                <div className="ht-cal-quarter-view" style={{ '--habit-c1': hc1, '--habit-c2': hc2 }}>
                  {months.map((mon, mi) => (
                    <div key={mi} className="ht-cal-mini-month">
                      <div className="ht-cal-mini-label">{mon.label}</div>
                      <div className="ht-cal-dow-row mini">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="ht-cal-dow">{d}</span>)}
                      </div>
                      {mon.weeks.map((week, wi) => (
                        <div key={wi} className="ht-cal-month-week">
                          {week.map((day, di) => (
                            <button
                              key={di}
                              disabled={!day || day.isFuture}
                              onClick={() => day && !day.isFuture && toggleHabit(selectedHabit.id, day.date)}
                              className={`ht-cal-month-cell mini ${!day ? 'empty' : ''} ${day?.completed ? 'done' : ''} ${day?.isFuture ? 'future' : ''} ${day?.isToday ? 'today' : ''}`}
                              title={day ? `${day.date}` : ''}
                            >
                              {day?.day ?? ''}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── Year view: 12 mini month grids ── */}
            {calendarMode === 'year' && (() => {
              const months = calendarDays(selectedHabit);
              return (
                <div className="ht-cal-year-view" style={{ '--habit-c1': hc1, '--habit-c2': hc2 }}>
                  {months.map((mon, mi) => (
                    <div key={mi} className="ht-cal-mini-month">
                      <div className="ht-cal-mini-label">{mon.label}</div>
                      <div className="ht-cal-dow-row mini">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="ht-cal-dow">{d}</span>)}
                      </div>
                      {mon.weeks.map((week, wi) => (
                        <div key={wi} className="ht-cal-month-week">
                          {week.map((day, di) => (
                            <button
                              key={di}
                              disabled={!day || day.isFuture}
                              onClick={() => day && !day.isFuture && toggleHabit(selectedHabit.id, day.date)}
                              className={`ht-cal-month-cell mini ${!day ? 'empty' : ''} ${day?.completed ? 'done' : ''} ${day?.isFuture ? 'future' : ''} ${day?.isToday ? 'today' : ''}`}
                              title={day ? `${day.date}` : ''}
                            >
                              {day?.day ?? ''}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Legend */}
            <div className="ht-cal-legend-row">
              <span className="ht-cal-legend-item"><span className="ht-cal-legend-dot done-dot" /> Done</span>
              <span className="ht-cal-legend-item"><span className="ht-cal-legend-dot missed-dot" /> Missed</span>
              <span className="ht-cal-legend-item"><span className="ht-cal-legend-dot today-dot" /> Today</span>
            </div>
          </section>

          {/* ── Best streaks ── */}
          <section className="ht-section">
            <h2 className="ht-section-title" style={{ color: hc1 }}>Best streaks</h2>

            <div className="ht-streaks-list">
              {allStreaks.length === 0 ? (
                <p className="ht-empty-text">No streaks yet</p>
              ) : (
                allStreaks.map((s, i) => (
                  <div key={i} className="ht-streak-row">
                    <span className="ht-streak-date">{new Date(s.start).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <div className="ht-streak-bar">
                      <div className="ht-streak-fill" style={{ width: `${(s.len / best) * 100}%`, background: `linear-gradient(90deg, ${hc2}, ${hc1})` }} />
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
            <h2 className="ht-section-title" style={{ color: hc1 }}>Frequency</h2>

            <div className="ht-freq-grid">
              {frequencyData.map((m, i) => (
                <div key={i} className="ht-freq-col">
                  <div className="ht-freq-dots">
                    {[0, 1, 2, 3].map(row => (
                      <div
                        key={row}
                        className="ht-freq-dot"
                        style={m.percent > row * 25
                          ? { background: hc1, opacity: 0.3 + (m.percent / 100) * 0.7 }
                          : {}}
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

  // 5 years = 1825 days, 50 per page = 37 pages
  const DAYS_SHOWN   = 50;
  const TOTAL_DAYS   = 365 * 5; // 5 years
  const TOTAL_PAGES  = Math.ceil(TOTAL_DAYS / DAYS_SHOWN); // 37

  // Page 0 = today..day49, page 1 = day50..day99, etc.
  const pageStart    = gridOffset * DAYS_SHOWN; // daysAgo of first column
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

  // Date range label for current page
  const pageEndDate   = new Date(); pageEndDate.setDate(pageEndDate.getDate() - pageStart);
  const pageStartDate = new Date(); pageStartDate.setDate(pageStartDate.getDate() - (pageStart + DAYS_SHOWN - 1));
  const rangeLabel    = gridOffset === 0
    ? `Today — ${pageStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `${pageEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${pageStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="ht-app">
      {confetti && <ConfettiBurst key={confetti.id} x={confetti.x} y={confetti.y} color={confetti.color} />}
      <div className="ht-grid-container">

        {/* ── Date / Time / Quote banner ── */}
        <div className="ht-banner">
          <div className="ht-banner-left">
            <div className="ht-banner-time">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="ht-banner-date">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div className="ht-banner-quote">
            <span className="ht-quote-mark">"</span>
            <span className="ht-quote-text">{todayQuote.text}</span>
            <span className="ht-quote-author">— {todayQuote.author}</span>
          </div>
        </div>

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
            {/* ── Pagination nav ── */}
            <div className="ht-grid-nav">
              <button
                className="ht-nav-btn"
                onClick={() => setGridOffset(Math.min(TOTAL_PAGES - 1, gridOffset + 1))}
                disabled={gridOffset >= TOTAL_PAGES - 1}
                title="Older data"
              >
                <ChevronLeft size={16} /> Older
              </button>

              <div className="ht-page-info">
                <span className="ht-grid-range">{rangeLabel}</span>
                <span className="ht-page-num">Page {gridOffset + 1} / {TOTAL_PAGES}</span>
              </div>

              <button
                className="ht-nav-btn"
                onClick={() => setGridOffset(Math.max(0, gridOffset - 1))}
                disabled={gridOffset === 0}
                title="Newer data"
              >
                Newer <ChevronRight size={16} />
              </button>
            </div>

            <div className="ht-grid-wrap">
              {/* ── Column headers (day names + dates) ── */}
              <div className="ht-grid-header">
                <div className="ht-grid-name-col" />
                {columns.map((col, ci) => {
                  // Show month label when month changes
                  const prevCol = columns[ci - 1];
                  const showMonth = ci === 0 || col.monthName !== prevCol?.monthName;
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

              {/* ── Habit rows ── */}
              {habits.map((habit, hi) => {
                const [c1, c2] = RING_COLORS[hi % RING_COLORS.length];
                return (
                  <div key={habit.id} className="ht-grid-row" style={{ animationDelay: `${hi * 40}ms` }}>
                    {/* Habit name with ring icon */}
                    <div
                      className="ht-grid-name"
                      onClick={() => setSelectedHabit(habit)}
                      title="Click to view analytics"
                    >
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
                      <button
                        className="ht-edit-icon-btn"
                        onClick={e => { e.stopPropagation(); openEdit(habit, hi); }}
                        title="Edit name or color"
                      >
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
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
                            onClick={e => isPast && toggleHabit(habit.id, col.dateStr, e)}
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

            <p className="ht-hint">Tap to view analytics · Hover + click ✏️ to rename or change color · Use ← → to browse past data</p>
          </>
        )}

      </div>

      {/* ── Edit habit modal ── */}
      {editingHabit && (
        <div className="ht-modal-overlay" onClick={() => setEditingHabit(null)}>
          <div className="ht-modal" onClick={e => e.stopPropagation()}>
            <h2 className="ht-modal-title">Edit Habit</h2>

            <label className="ht-modal-label">Name</label>
            <input
              className="ht-input ht-modal-input"
              type="text"
              value={editName}
              autoFocus
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') updateHabit(editingHabit.id, editName.trim() || editingHabit.name, editColorIdx);
                if (e.key === 'Escape') setEditingHabit(null);
              }}
            />

            <label className="ht-modal-label">Color</label>
            <div className="ht-color-grid">
              {RING_COLORS.map(([c1, c2], idx) => (
                <button
                  key={idx}
                  className={`ht-color-swatch ${editColorIdx === idx ? 'selected' : ''}`}
                  style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  onClick={() => setEditColorIdx(idx)}
                >
                  {editColorIdx === idx && <span className="ht-color-check">✓</span>}
                </button>
              ))}
            </div>

            <div className="ht-modal-preview">
              <svg viewBox="0 0 36 36" width="32" height="32">
                <defs>
                  <linearGradient id="previewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={RING_COLORS[editColorIdx][0]} />
                    <stop offset="100%" stopColor={RING_COLORS[editColorIdx][1]} />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="url(#previewGrad)" strokeWidth="3"
                  strokeDasharray="60 94.2" strokeLinecap="round" transform="rotate(-90 18 18)" />
              </svg>
              <span className="ht-modal-preview-name" style={{ color: RING_COLORS[editColorIdx][0] }}>
                {editName || editingHabit.name}
              </span>
            </div>

            <div className="ht-modal-actions">
              <button className="ht-modal-cancel" onClick={() => setEditingHabit(null)}>Cancel</button>
              <button
                className="ht-modal-save"
                style={{ background: `linear-gradient(135deg, ${RING_COLORS[editColorIdx][0]}, ${RING_COLORS[editColorIdx][1]})` }}
                onClick={() => updateHabit(editingHabit.id, editName.trim() || editingHabit.name, editColorIdx)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
