import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import CalendarView from './CalendarView';
import {
  dateStr, weeklyScore, monthlyScore, yearlyScore,
  currentStreak, bestStreak,
} from './habitUtils';

export default function HabitAnalytics({ habit, habitColor, onBack, onToggle }) {
  const [chartTimeframe, setChartTimeframe] = useState('week');
  const [chartOffset, setChartOffset]       = useState(0);

  const [hc1, hc2] = habitColor;

  const weekScore  = weeklyScore(habit);
  const monthScore = monthlyScore(habit);
  const yearScore  = yearlyScore(habit);
  const totalDays  = Object.keys(habit.completions).length;
  const best       = bestStreak(habit);

  /* ── Chart data ── */
  const chartData = () => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (chartTimeframe === 'week') {
      const base = chartOffset * 7;
      return Array.from({ length: 7 }, (_, i) => {
        const daysAgo = base + (6 - i);
        const d = new Date(); d.setDate(d.getDate() - daysAgo);
        const ds = d.toISOString().split('T')[0];
        return { name: `${d.toLocaleDateString('en-US',{month:'short'})} ${d.getDate()}`, value: habit.completions[ds] ? 100 : 0 };
      });
    }
    if (chartTimeframe === 'month') {
      const ref = new Date(); ref.setMonth(ref.getMonth() - chartOffset);
      const y = ref.getFullYear(), m = ref.getMonth();
      const days = new Date(y, m + 1, 0).getDate();
      return Array.from({ length: days }, (_, i) => {
        const d = new Date(y, m, i + 1), ds = d.toISOString().split('T')[0];
        return { name: i % 5 === 0 ? `${MONTHS[m]} ${i+1}` : '', value: habit.completions[ds] ? 100 : 0 };
      });
    }
    if (chartTimeframe === 'quarter') {
      const base = chartOffset * 13;
      return Array.from({ length: 13 }, (_, i) => {
        let c = 0;
        const ws = (base + (12 - i)) * 7;
        for (let d = 0; d < 7; d++) if (habit.completions[dateStr(ws + d)]) c++;
        const dt = new Date(); dt.setDate(dt.getDate() - (base + (12-i))*7);
        return { name: `${MONTHS[dt.getMonth()]} ${dt.getDate()}`, value: Math.round(c/7*100) };
      });
    }
    const base = chartOffset * 52;
    return Array.from({ length: 52 }, (_, i) => {
      let c = 0;
      const ws = (base + (51 - i)) * 7;
      for (let d = 0; d < 7; d++) if (habit.completions[dateStr(ws + d)]) c++;
      const dt = new Date(); dt.setDate(dt.getDate() - (base + (51-i))*7);
      return { name: i % 4 === 0 ? `${MONTHS[dt.getMonth()]} ${dt.getFullYear().toString().slice(2)}` : '', value: Math.round(c/7*100) };
    });
  };

  const periodLabel = () => {
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

  /* ── All streaks ── */
  const allStreaks = (() => {
    const dates = Object.keys(habit.completions).sort();
    const streaks = [];
    let start = null, end = null, len = 0;
    dates.forEach((ds, i) => {
      if (i === 0) { start = end = ds; len = 1; return; }
      const diff = Math.floor((new Date(ds) - new Date(dates[i-1])) / 864e5);
      if (diff === 1) { len++; end = ds; }
      else { if (len >= 2) streaks.push({ start, end, len }); start = end = ds; len = 1; }
    });
    if (len >= 2) streaks.push({ start, end, len });
    return streaks.sort((a, b) => b.len - a.len).slice(0, 10);
  })();

  /* ── Frequency dots ── */
  const freqData = Array.from({ length: 12 }, (_, i) => {
    const mo = 11 - i;
    let c = 0, t = 0;
    for (let d = 0; d < 30; d++) { t++; if (habit.completions[dateStr(mo*30+d)]) c++; }
    const dt = new Date(); dt.setMonth(dt.getMonth() - mo);
    return { month: dt.toLocaleDateString('en-US',{month:'short'}), percent: Math.round(c/t*100) };
  });

  const data = chartData();

  return (
    <div className="ht-detail-v2">
      <div className="ht-detail-v2-container">

        {/* Top bar */}
        <div className="ht-detail-topbar">
          <button className="ht-back-icon-btn" onClick={onBack}><ArrowLeft size={20} /></button>
          <h1 className="ht-detail-v2-title" style={{ color: hc1 }}>{habit.name}</h1>
          <div className="ht-detail-topbar-actions" />
        </div>
        <div className="ht-detail-v2-meta"><span>🔁 Every day</span><span>🔕 Off</span></div>

        {/* Overview */}
        <section className="ht-section">
          <h2 className="ht-section-title" style={{ color: hc1 }}>Overview</h2>
          <div className="ht-overview-grid">
            <div className="ht-overview-ring">
              <svg viewBox="0 0 120 120" width="110" height="110">
                <defs>
                  <linearGradient id={`ringGrad-${habit.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={hc1} /><stop offset="100%" stopColor={hc2} />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={`url(#ringGrad-${habit.id})`} strokeWidth="8"
                  strokeDasharray={`${weekScore * 3.267} 326.7`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" fill="var(--text-primary)" fontSize="28" fontWeight="700">{weekScore}%</text>
              </svg>
              <p className="ht-ring-label">Score</p>
            </div>
            <div className="ht-overview-stat"><div className="ht-stat-value" style={{ color: hc1 }}>+{monthScore}%</div><div className="ht-stat-label">Month</div></div>
            <div className="ht-overview-stat"><div className="ht-stat-value" style={{ color: hc2 }}>+{yearScore}%</div><div className="ht-stat-label">Year</div></div>
            <div className="ht-overview-stat"><div className="ht-stat-value" style={{ color: hc1 }}>{totalDays}</div><div className="ht-stat-label">Total</div></div>
          </div>
        </section>

        {/* Score line chart */}
        <section className="ht-section">
          <div className="ht-section-header">
            <h2 className="ht-section-title" style={{ color: hc1 }}>Score</h2>
            <select className="ht-select-v2" value={chartTimeframe} onChange={e => { setChartTimeframe(e.target.value); setChartOffset(0); }}>
              <option value="week">Week</option><option value="month">Month</option>
              <option value="quarter">Quarter</option><option value="year">Year</option>
            </select>
          </div>
          <div className="ht-period-nav">
            <button className="ht-nav-btn" onClick={() => setChartOffset(chartOffset + 1)}><ChevronLeft size={16} /></button>
            <span className="ht-period-label">{periodLabel()}</span>
            <button className="ht-nav-btn" onClick={() => setChartOffset(Math.max(0, chartOffset - 1))} disabled={chartOffset === 0}><ChevronRight size={16} /></button>
          </div>
          <div className="ht-chart-v2">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:9 }} axisLine={false} tickLine={false} interval={chartTimeframe === 'year' ? 1 : 0} />
                <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:9 }} axisLine={false} tickLine={false} domain={[0,100]} ticks={[20,40,60,80,100]} tickFormatter={v=>`${v}%`} />
                <Tooltip cursor={{ stroke:'rgba(255,255,255,0.1)', strokeWidth:1 }} contentStyle={{ background:'rgba(10,10,15,0.95)', border:`1px solid ${hc1}55`, borderRadius:8, fontSize:11 }} formatter={v=>[`${v}%`,'Score']} />
                <Line type="monotone" dataKey="value" stroke={hc1} strokeWidth={2} dot={{ r:3, fill:hc1, stroke:hc2, strokeWidth:1.5 }} activeDot={{ r:5, fill:hc1, stroke:'#fff', strokeWidth:1.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* History bar chart */}
        <section className="ht-section">
          <div className="ht-section-header">
            <h2 className="ht-section-title" style={{ color: hc1 }}>History</h2>
            <select className="ht-select-v2" value={chartTimeframe} onChange={e => { setChartTimeframe(e.target.value); setChartOffset(0); }}>
              <option value="week">Week</option><option value="month">Month</option>
              <option value="quarter">Quarter</option><option value="year">Year</option>
            </select>
          </div>
          <div className="ht-period-nav">
            <button className="ht-nav-btn" onClick={() => setChartOffset(chartOffset + 1)}><ChevronLeft size={16} /></button>
            <span className="ht-period-label">{periodLabel()}</span>
            <button className="ht-nav-btn" onClick={() => setChartOffset(Math.max(0, chartOffset - 1))} disabled={chartOffset === 0}><ChevronRight size={16} /></button>
          </div>
          <div className="ht-chart-v2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data}>
                <defs>
                  <linearGradient id={`barGrad-${habit.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={hc1} /><stop offset="100%" stopColor={hc2} stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} axisLine={false} tickLine={false} domain={[0,100]} ticks={[0,50,100]} tickFormatter={v=>`${v}%`} />
                <Tooltip cursor={{ fill:'rgba(255,255,255,0.03)' }} contentStyle={{ background:'rgba(10,10,15,0.95)', border:`1px solid ${hc1}55`, borderRadius:8, fontSize:11 }} formatter={v=>[`${v}%`,'Completion']} />
                <Bar dataKey="value" fill={`url(#barGrad-${habit.id})`} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Calendar */}
        <CalendarView habit={habit} onToggle={onToggle} habitColor={[hc1, hc2]} />

        {/* Best streaks */}
        <section className="ht-section">
          <h2 className="ht-section-title" style={{ color: hc1 }}>Best streaks</h2>
          <div className="ht-streaks-list">
            {allStreaks.length === 0 ? (
              <p className="ht-empty-text">No streaks yet</p>
            ) : allStreaks.map((s, i) => (
              <div key={i} className="ht-streak-row">
                <span className="ht-streak-date">{new Date(s.start).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}</span>
                <div className="ht-streak-bar">
                  <div className="ht-streak-fill" style={{ width:`${(s.len/best)*100}%`, background:`linear-gradient(90deg,${hc2},${hc1})` }} />
                  <span className="ht-streak-len">{s.len}</span>
                </div>
                <span className="ht-streak-date">{new Date(s.end).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Frequency */}
        <section className="ht-section">
          <h2 className="ht-section-title" style={{ color: hc1 }}>Frequency</h2>
          <div className="ht-freq-grid">
            {freqData.map((m, i) => (
              <div key={i} className="ht-freq-col">
                <div className="ht-freq-dots">
                  {[3,2,1,0].map(row => (
                    <div key={row} className="ht-freq-dot"
                      style={m.percent > row * 25 ? { background: hc1, opacity: 0.3 + (m.percent/100)*0.7 } : {}} />
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
