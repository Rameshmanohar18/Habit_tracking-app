# 📋 Habit Tracker — Project Flow & Technical Documentation

---

## 1. Application Flow Overview

```
User Opens App
      │
      ▼
main.jsx → BrowserRouter → App.jsx → Route "/"
      │
      ▼
HabitTracker.jsx (loads data from localStorage)
      │
      ├── No habits selected → HabitGrid.jsx (Front Page)
      │         │
      │         ├── Click habit name → setSelectedHabit()
      │         ├── Click ✓/✗ cell → toggleHabit()
      │         ├── Click + → addHabit()
      │         ├── Click ✗ → removeHabit()
      │         └── Hover + click ✏️ → EditHabitModal.jsx
      │
      └── Habit selected → HabitAnalytics.jsx (Analytics Page)
                │
                ├── Score line chart (recharts LineChart)
                ├── History bar chart (recharts BarChart)
                ├── CalendarView.jsx (week/month/quarter/year)
                ├── Best streaks list
                └── Frequency dots grid
```

---

## 2. State Management

All state lives in `HabitTracker.jsx` and is passed down as props.

### State Variables

| State | Type | Default | Purpose |
|---|---|---|---|
| `habits` | Array | `[]` | All habit objects |
| `selectedHabit` | Object\|null | `null` | Currently viewed habit in analytics |
| `loading` | Boolean | `true` | Shows spinner while loading from localStorage |
| `now` | Date | `new Date()` | Live clock — updates every second |

### Local State (HabitGrid)

| State | Type | Purpose |
|---|---|---|
| `newHabitName` | String | Input value for adding a habit |
| `gridOffset` | Number | Current page (0 = today, 1 = 50 days ago, etc.) |
| `editingHabit` | Object\|null | Habit being edited in modal |
| `confetti` | Object\|null | Active confetti burst position + color |

### Local State (HabitAnalytics)

| State | Type | Purpose |
|---|---|---|
| `chartTimeframe` | String | 'week'\|'month'\|'quarter'\|'year' |
| `chartOffset` | Number | How many periods back to show |

### Local State (CalendarView)

| State | Type | Purpose |
|---|---|---|
| `mode` | String | 'week'\|'month'\|'quarter'\|'year' |
| `offset` | Number | How many periods back to show |

---

## 3. Data Flow

```
localStorage
    │
    ▼ (on mount)
HabitTracker.jsx
    │  habits[]
    ├──────────────────► HabitGrid.jsx
    │                        │ onToggle, onAdd, onRemove, onUpdate
    │                        ▼
    │                    saveHabits() → localStorage
    │
    └──────────────────► HabitAnalytics.jsx
                             │ habit (single object)
                             ▼
                         CalendarView.jsx
                             │ onToggle
                             ▼
                         HabitTracker.toggleHabit()
```

---

## 4. Component Details

### 4.1 HabitTracker.jsx

**Role:** Root orchestrator. Owns all state and business logic.

**Key Functions:**

```js
addHabit(name)
// Creates new habit object with id, name, completions:{}, createdAt

removeHabit(id)
// Filters out habit by id, clears selectedHabit if it was selected

updateHabit(id, name, colorIdx)
// Updates name and colorIdx for a habit, syncs selectedHabit

toggleHabit(habitId, date)
// Adds or removes a date from habit.completions

getHabitColor(habitId)
// Returns [c1, c2] gradient pair based on habit.colorIdx or position

save(updated)
// Writes habits array to localStorage and updates state
```

---

### 4.2 HabitGrid.jsx

**Role:** Front page — 50-day scrollable grid with pagination.

**Key Logic:**

```js
// Pagination: 50 days per page, 5 years total = 37 pages
const DAYS_SHOWN  = 50;
const TOTAL_DAYS  = 365 * 5;
const TOTAL_PAGES = Math.ceil(TOTAL_DAYS / DAYS_SHOWN); // 37

// Column generation
const columns = Array.from({ length: 50 }, (_, i) => {
  const daysAgo = pageStart + i; // pageStart = gridOffset * 50
  // returns { dateStr, dayName, dayNum, monthName, isToday }
});
```

**Confetti trigger:**
```js
// Only fires when marking as DONE (not undoing)
if (!wasCompleted && event) {
  launchConfetti(x, y, habitColor);
}
```

---

### 4.3 HabitAnalytics.jsx

**Role:** Full analytics page for a single habit.

**Chart Data Generation:**

| Timeframe | Data Points | X-Axis |
|---|---|---|
| Week | 7 daily points | Day + date |
| Month | 28–31 daily points | Every 5th day labeled |
| Quarter | 13 weekly points | Week start date |
| Year | 52 weekly points | Every 4th week labeled |

**Stats Calculated:**

| Stat | Formula |
|---|---|
| Weekly Score | completions in last 7 days / 7 × 100 |
| Monthly Score | completions this month / days elapsed × 100 |
| Yearly Score | completions in last 365 days / 365 × 100 |
| Current Streak | consecutive days from today backwards |
| Best Streak | longest consecutive run in all completions |
| Frequency | total completed days / days since creation × 100 |

---

### 4.4 CalendarView.jsx

**Role:** Renders calendar in 4 modes with past navigation.

**Mode Rendering:**

| Mode | Layout | Navigation Unit |
|---|---|---|
| Week | 7 large day cards in a row | 1 week per step |
| Month | Standard 7-column grid | 1 month per step |
| Quarter | 3 mini month grids | 3 months per step |
| Year | 12 mini month grids (3 cols) | 12 months per step |

**Day Object Structure:**
```js
{
  day: 15,              // day number
  date: '2026-05-15',   // YYYY-MM-DD
  completed: true,      // from habit.completions
  isToday: false,       // date === today
  isFuture: false       // date > today (disabled)
}
```

---

### 4.5 EditHabitModal.jsx

**Role:** Popup for renaming a habit and changing its color.

**Props:**
```js
{
  habit: Object,        // current habit data
  habitIndex: Number,   // position in habits array (for default color)
  onSave: Function,     // (id, name, colorIdx) => void
  onClose: Function     // () => void
}
```

**Features:**
- Pre-fills name and color from current habit
- Live preview shows ring + name in selected color
- Enter key saves, Escape key closes
- Save button gradient matches selected color

---

### 4.6 ConfettiBurst.jsx

**Role:** Canvas-based confetti animation on habit completion.

**Animation Details:**
- 60 particles per burst
- Mix of rectangles and circles
- Physics: gravity (0.35), air resistance (0.98)
- Fade out over ~1.2 seconds
- Colors: habit color + white, gold, purple, green
- Renders on a fixed full-screen canvas with `pointer-events: none`

---

### 4.7 habitUtils.js

**Role:** Shared pure functions and constants.

**Exports:**
```js
RING_COLORS    // Array of 6 [c1, c2] gradient pairs
QUOTES         // Array of 31 motivational quotes
dateStr(n)     // Returns YYYY-MM-DD for n days ago
getHabitColor  // Returns color pair for a habit
weeklyScore    // 0-100 completion % for last 7 days
monthlyScore   // 0-100 completion % for current month
quarterScore   // 0-100 completion % for last 90 days
yearlyScore    // 0-100 completion % for last 365 days
currentStreak  // Consecutive days from today
bestStreak     // Longest ever consecutive run
dayOfYear      // Day number 1-365 for a given date
```

---

## 5. localStorage Schema

**Key:** `habits-analytics-data`

**Value:** JSON array of habit objects

```json
[
  {
    "id": 1715000000000,
    "name": "Wakeup at 8 AM",
    "colorIdx": 0,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "completions": {
      "2026-05-01": true,
      "2026-05-02": true
    }
  }
]
```

**Read on mount:**
```js
useEffect(() => {
  const stored = localStorage.getItem('habits-analytics-data');
  if (stored) setHabits(JSON.parse(stored));
}, []);
```

**Write on every change:**
```js
localStorage.setItem('habits-analytics-data', JSON.stringify(updated));
```

---

## 6. Styling Architecture

All styles are in two files:

| File | Purpose |
|---|---|
| `src/index.css` | CSS variables, base reset, scrollbar, body |
| `src/App.css` | All component-specific styles |

**CSS Variable System:**
```css
:root {
  --bg-base:        #0a0a0f;
  --bg-card:        rgba(255,255,255,0.04);
  --border:         rgba(255,255,255,0.08);
  --text-primary:   #f0eeff;
  --text-secondary: rgba(240,238,255,0.55);
  --purple:         #a855f7;
  --green:          #34d399;
  --cyan:           #22d3ee;
  /* ... */
}
```

**Naming Convention:** All classes prefixed with `ht-` (habit tracker)

---

## 7. Key Design Decisions

### Why localStorage?
- Zero backend required — works offline
- Instant reads/writes — no latency
- Sufficient for personal use (5MB limit)
- Simple to implement and debug

### Why no Redux/Zustand?
- App has a single data source (habits array)
- State only lives in one component (HabitTracker)
- Props drilling is shallow (max 2 levels)
- Adding a state library would add complexity without benefit

### Why Recharts?
- Native React integration
- Responsive containers built-in
- Supports custom gradients and tooltips
- Lightweight compared to D3

### Why 6 components?
- Each component has a single clear responsibility
- Habit.jsx was 1000+ lines — unmanageable
- Components map 1:1 to visual sections
- Easy to find and edit specific features

---

## 8. Future Improvements

| Feature | Complexity | Notes |
|---|---|---|
| Backend sync | High | Firebase/Supabase for cross-device |
| Export to CSV | Low | Download completions as spreadsheet |
| Habit categories | Medium | Group habits by type |
| Reminders/notifications | Medium | Browser Push API |
| Dark/light theme toggle | Low | CSS variable swap |
| Habit templates | Low | Pre-built common habits |
| Weekly goals | Medium | Set target days per week |
| Import/export JSON | Low | Backup and restore data |

---

## 9. Development Notes

### Adding a New Habit Stat
1. Add the calculation function to `habitUtils.js`
2. Import and call it in `HabitAnalytics.jsx`
3. Add the UI element in the Overview section

### Adding a New Color Theme
1. Add `['#color1', '#color2']` to `RING_COLORS` in `habitUtils.js`
2. The color picker in `EditHabitModal` will automatically show it

### Changing the Quote Pool
1. Add/remove objects from `QUOTES` array in `habitUtils.js`
2. Quote selection is `QUOTES[dayOfYear % QUOTES.length]` — automatic rotation

### Changing Days Per Page
1. Update `DAYS_SHOWN` in `HabitGrid.jsx`
2. Update `grid-template-columns: repeat(N, 44px)` in `App.css`
