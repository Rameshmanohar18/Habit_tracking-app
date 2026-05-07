import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dateStr } from './habitUtils';

function buildMonthWeeks(year, month, completions, today) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const weeks = [];
  let week = Array(first.getDay()).fill(null);
  for (let day = 1; day <= last.getDate(); day++) {
    const d  = new Date(year, month, day);
    const ds = d.toISOString().split('T')[0];
    week.push({ day, date: ds, completed: !!completions[ds], isToday: ds === today, isFuture: ds > today });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
  return weeks;
}

function MonthGrid({ weeks, onToggle, mini = false }) {
  return (
    <>
      <div className={`ht-cal-dow-row${mini ? ' mini' : ''}`}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <span key={d} className="ht-cal-dow">{d}</span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="ht-cal-month-week">
          {week.map((day, di) => (
            <button
              key={di}
              disabled={!day || day.isFuture}
              onClick={() => day && !day.isFuture && onToggle(day.date)}
              className={[
                `ht-cal-month-cell${mini ? ' mini' : ''}`,
                !day          ? 'empty'  : '',
                day?.completed ? 'done'  : '',
                day?.isFuture  ? 'future': '',
                day?.isToday   ? 'today' : '',
              ].filter(Boolean).join(' ')}
              title={day ? `${day.date} — ${day.completed ? 'Done ✓' : 'Missed ✗'}` : ''}
            >
              {day?.day ?? ''}
            </button>
          ))}
        </div>
      ))}
    </>
  );
}

export default function CalendarView({ habit, onToggle, habitColor }) {
  const [mode, setMode]     = useState('month');
  const [offset, setOffset] = useState(0);
  const today = dateStr(0);

  const periodLabel = () => {
    if (mode === 'week') {
      const end   = new Date(); end.setDate(end.getDate() - offset * 7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      return `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
    }
    if (mode === 'month') {
      const d = new Date(); d.setMonth(d.getMonth() - offset);
      return d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    }
    if (mode === 'quarter') {
      const end   = new Date(); end.setMonth(end.getMonth() - offset * 3);
      const start = new Date(end); start.setMonth(start.getMonth() - 2);
      return `${start.toLocaleDateString('en-US',{month:'short',year:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',year:'numeric'})}`;
    }
    const d = new Date(); d.setFullYear(d.getFullYear() - offset);
    return `${d.getFullYear()}`;
  };

  const renderWeek = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const daysAgo = offset * 7 + (6 - i);
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      const ds = d.toISOString().split('T')[0];
      return { day: d.getDate(), date: ds, completed: !!habit.completions[ds], isToday: ds === today, isFuture: ds > today, dayName: d.toLocaleDateString('en-US',{weekday:'short'}) };
    });
    return (
      <div className="ht-cal-week-view" style={{ '--habit-c1': habitColor[0], '--habit-c2': habitColor[1] }}>
        {days.map((day, i) => (
          <div key={i} className="ht-cal-week-col">
            <span className="ht-cal-week-dayname">{day.dayName}</span>
            <button
              className={`ht-cal-week-cell ${day.completed ? 'done' : 'missed'} ${day.isToday ? 'today' : ''} ${day.isFuture ? 'future' : ''}`}
              disabled={day.isFuture}
              onClick={e => !day.isFuture && onToggle(day.date, e)}
              title={`${day.date} — ${day.completed ? 'Done ✓' : 'Missed ✗'}`}
            >
              <span className="ht-cal-week-num">{day.day}</span>
              <span className="ht-cal-week-tick">{day.completed ? '✓' : '✗'}</span>
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderMonth = (off = offset, mini = false) => {
    const ref = new Date(); ref.setMonth(ref.getMonth() - off);
    const weeks = buildMonthWeeks(ref.getFullYear(), ref.getMonth(), habit.completions, today);
    return (
      <div className={`ht-cal-month-view${mini ? '' : ''}`} style={{ '--habit-c1': habitColor[0], '--habit-c2': habitColor[1] }}>
        <MonthGrid weeks={weeks} onToggle={onToggle} mini={mini} />
      </div>
    );
  };

  const renderQuarter = () => {
    const months = Array.from({ length: 3 }, (_, mi) => {
      const ref = new Date(); ref.setMonth(ref.getMonth() - offset * 3 - (2 - mi));
      return { label: ref.toLocaleDateString('en-US',{month:'long',year:'numeric'}), ref };
    });
    return (
      <div className="ht-cal-quarter-view" style={{ '--habit-c1': habitColor[0], '--habit-c2': habitColor[1] }}>
        {months.map((mon, mi) => (
          <div key={mi} className="ht-cal-mini-month">
            <div className="ht-cal-mini-label">{mon.label}</div>
            {renderMonth(offset * 3 + (2 - mi), true)}
          </div>
        ))}
      </div>
    );
  };

  const renderYear = () => {
    const months = Array.from({ length: 12 }, (_, mi) => {
      const ref = new Date(); ref.setMonth(ref.getMonth() - offset * 12 - (11 - mi));
      return { label: ref.toLocaleDateString('en-US',{month:'short',year:'numeric'}), off: offset * 12 + (11 - mi) };
    });
    return (
      <div className="ht-cal-year-view" style={{ '--habit-c1': habitColor[0], '--habit-c2': habitColor[1] }}>
        {months.map((mon, mi) => (
          <div key={mi} className="ht-cal-mini-month">
            <div className="ht-cal-mini-label">{mon.label}</div>
            {renderMonth(mon.off, true)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="ht-section">
      <div className="ht-section-header">
        <h2 className="ht-section-title" style={{ color: habitColor[0] }}>Calendar</h2>
        <select className="ht-select-v2" value={mode} onChange={e => { setMode(e.target.value); setOffset(0); }}>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="quarter">Quarter</option>
          <option value="year">Year</option>
        </select>
      </div>

      <div className="ht-period-nav">
        <button className="ht-nav-btn" onClick={() => setOffset(offset + 1)} title="Previous period">
          <ChevronLeft size={16} />
        </button>
        <span className="ht-period-label">{periodLabel()}</span>
        <button className="ht-nav-btn" onClick={() => setOffset(Math.max(0, offset - 1))} disabled={offset === 0} title="Next period">
          <ChevronRight size={16} />
        </button>
      </div>

      {mode === 'week'    && renderWeek()}
      {mode === 'month'   && renderMonth()}
      {mode === 'quarter' && renderQuarter()}
      {mode === 'year'    && renderYear()}

      <div className="ht-cal-legend-row">
        <span className="ht-cal-legend-item"><span className="ht-cal-legend-dot done-dot" /> Done</span>
        <span className="ht-cal-legend-item"><span className="ht-cal-legend-dot missed-dot" /> Missed</span>
        <span className="ht-cal-legend-item"><span className="ht-cal-legend-dot today-dot" /> Today</span>
      </div>
    </section>
  );
}
