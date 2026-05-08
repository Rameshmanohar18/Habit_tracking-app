# 🌱 Habit Tracker

A premium, fully interactive habit tracking web application built with **React + Vite**. Track your daily habits, visualize progress with rich analytics, and stay motivated with streaks, charts, and confetti celebrations.

---

## 📸 Features at a Glance

| Feature | Description |
|---|---|
| 📅 50-Day Grid | Front page shows today + last 49 days with ✓/✗ marks |
| 📊 Analytics | Score line chart, history bar chart, calendar heatmap |
| 🔥 Streaks | Current streak, best streak, all-time streak history |
| 🎨 Custom Colors | 6 gradient color themes per habit |
| ✏️ Edit Habits | Rename and recolor habits via hover edit button |
| 🎉 Confetti | Celebration animation when you complete a habit |
| 🕐 Live Clock | Real-time clock + date on the front page |
| 💬 Daily Quote | A new motivational quote every day |
| 📆 Calendar Modes | Week / Month / Quarter / Year calendar views |
| 💾 Persistent Data | All data saved to localStorage — survives browser restarts |
| 📱 Responsive | Works on desktop and mobile |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+

### Installation

```bash
# Clone or download the project
cd HabitTracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🗂️ Project Structure

```
HabitTracker/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.jsx                    # Root app — router setup
│   ├── App.css                    # All component styles
│   ├── index.css                  # Base/global styles
│   ├── main.jsx                   # React entry point with BrowserRouter
│   └── components/
│       ├── HabitTracker.jsx       # Root state manager + CRUD logic
│       ├── HabitGrid.jsx          # Front page — 50-day grid view
│       ├── HabitAnalytics.jsx     # Analytics detail page
│       ├── CalendarView.jsx       # Calendar section (week/month/quarter/year)
│       ├── EditHabitModal.jsx     # Rename + color picker modal
│       ├── ConfettiBurst.jsx      # Canvas confetti animation
│       ├── habitUtils.js          # Shared constants + stat functions
│       └── Habit.jsx              # Legacy file (not used)
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🧩 Component Architecture

```
App.jsx
└── HabitTracker.jsx          (state, CRUD, localStorage)
    ├── HabitGrid.jsx         (front page view)
    │   ├── ConfettiBurst.jsx (celebration animation)
    │   └── EditHabitModal.jsx (rename + color picker)
    └── HabitAnalytics.jsx    (analytics view)
        └── CalendarView.jsx  (calendar section)
```

---

## 📦 Dependencies

| Package | Version | Purpose |
|---|---|---|
| react | ^19.x | UI framework |
| react-dom | ^19.x | DOM rendering |
| react-router-dom | ^7.x | Client-side routing |
| recharts | ^3.x | Charts (line, bar) |
| lucide-react | ^1.x | Icon library |
| vite | ^8.x | Build tool + dev server |

---

## 💾 Data Storage

All data is stored in **browser localStorage** under the key `habits-analytics-data`.

### Data Schema

```json
[
  {
    "id": 1715000000000,
    "name": "Wakeup at 8 AM",
    "colorIdx": 0,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "completions": {
      "2026-05-01": true,
      "2026-05-02": true,
      "2026-05-04": true
    }
  }
]
```

### Storage Limits
- localStorage limit: ~5MB per origin
- Each habit with 5 years of daily data ≈ ~15KB
- Supports ~300+ habits before hitting limits

---

## 🎨 Color Palette

Each habit gets one of 6 gradient color themes:

| Index | Color 1 | Color 2 | Name |
|---|---|---|---|
| 0 | `#22d3ee` | `#3b82f6` | Cyan → Blue |
| 1 | `#34d399` | `#10b981` | Green → Emerald |
| 2 | `#a855f7` | `#ec4899` | Purple → Pink |
| 3 | `#fbbf24` | `#f97316` | Yellow → Orange |
| 4 | `#f87171` | `#ef4444` | Red → Red |
| 5 | `#818cf8` | `#6366f1` | Indigo → Indigo |

---

## 📊 Analytics Explained

### Overview Ring
- Shows **weekly completion %** as a circular progress ring
- Color matches the habit's assigned gradient

### Score Chart (Line)
- Shows daily completion (100% = done, 0% = missed)
- Navigable by Week / Month / Quarter / Year
- Use ← → arrows to browse past periods

### History Chart (Bar)
- Shows aggregated completion % per period
- Same timeframe selector as Score chart

### Calendar
- **Week** — 7 large day cards with ✓/✗
- **Month** — Standard calendar grid
- **Quarter** — 3 mini month grids side by side
- **Year** — 12 mini month grids in a 3-column layout
- All past months/years navigable with ← →

### Best Streaks
- Lists all streaks of 2+ consecutive days
- Sorted by length (longest first)
- Shows start date → bar → end date

### Frequency Dots
- 12 columns (one per month)
- 4 dots per column — more dots lit = higher completion %
- Dot color matches habit color

---

## 🖱️ User Interactions

| Action | How |
|---|---|
| Mark habit done | Click ✓/✗ cell on front page |
| Undo completion | Click the ✓ cell again |
| View analytics | Click the habit name |
| Edit name/color | Hover habit row → click ✏️ icon |
| Add habit | Click + button → type name → Enter |
| Delete habit | Click ✗ button on the right of the row |
| Browse past data | Click ← Older / Newer → buttons |
| Navigate analytics | Use ← → arrows in each section |

---

## 🔒 Data Persistence

| Scenario | Data Survives? |
|---|---|
| Page refresh | ✅ Yes |
| Close and reopen browser | ✅ Yes |
| Come back after 1 week | ✅ Yes |
| Come back after 1 year | ✅ Yes |
| Clear browser cache/data | ❌ No |
| Different browser | ❌ No |
| Incognito/Private mode | ❌ No |
| Different device | ❌ No |

---

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Build for production (output: dist/)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

---

## 🌐 Browser Support

| Browser | Supported |
|---|---|
| Chrome 90+ | ✅ |
| Firefox 88+ | ✅ |
| Safari 14+ | ✅ |
| Edge 90+ | ✅ |

---

## 📝 License

MIT License — free to use, modify, and distribute.
