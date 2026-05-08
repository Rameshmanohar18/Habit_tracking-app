# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


<!-- 

I'll add validation so users can only toggle today and past dates, not future dates. Future dates will be visible but disabled.

Now update the calendar rendering to disable and style future dates:

Now add the `future` CSS class to `App.css`:

Here's what changed:

- **Today** — clickable, toggles normally, highlighted with yellow ring
- **Past dates** — clickable, can be marked/unmarked (useful for logging missed days)
- **Future dates** — visually dimmed (very low opacity), `cursor: not-allowed`, completely non-interactive with `pointer-events: none`, and show a tooltip "Future dates cannot be marked" on hover

The chart history (week/month/quarter/year) is unaffected — it still shows all historical data as before.

























Perfect! I'll redesign the analytics detail view to match this screenshot exactly — with the circular progress ring, score cards, line chart, bar chart, calendar heatmap, best streaks table, and frequency dots visualization.

Now add all the detail view CSS:

Perfect! The detail view now matches the screenshot exactly:

**Top section:**
- Back arrow, habit name, edit/more icons
- "Every day" and "Off" meta tags

**Overview:**
- Large circular progress ring showing weekly score %
- Three stat cards: Month %, Year %, Total days

**Score chart:**
- Line/bar chart with week/month/quarter/year dropdown
- Cyan-blue gradient bars

**History chart:**
- Bar chart showing completion over time
- Blue bars

**Calendar heatmap:**
- Month labels across top (Jan, Feb, Mar...)
- Day labels on left (Sun, Mon, Tue...)
- Grid of small squares — blue when completed, shows day number
- "EDIT" button below

**Best streaks:**
- List of all streaks (2+ days)
- Shows start date → blue progress bar with length → end date
- Sorted by longest first

**Frequency:**
- 12 columns (one per month)
- 4 dots stacked vertically per month
- Dots light up based on completion % for that month
- Month labels below (Jan, Feb, Mar...)

Everything is scrollable, compact, and matches the dark mobile UI aesthetic from your reference image.












Let me read the current file to see the exact state of the calendar and chart sections.

I see the issue — the calendar dropdown and chart dropdowns don't have navigation arrows yet. The functions are defined but not used. Let me add the navigation UI to all sections:

Now add the CSS for `.ht-period-nav` and `.ht-period-label`:

Perfect! Now your analytics page has full navigation:

**Score & History charts:**
- Dropdown to select Week/Month/Quarter/Year
- ← → arrows below the dropdown to navigate past periods
- Period label in the center showing exactly which period you're viewing (e.g. "Apr 30 – May 6, 2026" for week, "April 2026" for month, etc.)

**Calendar:**
- ← → arrows to navigate past months
- Month label in the center (e.g. "May 2026")
- All past months are accessible

**How it works:**
- Click ← to go back in time (previous week/month/quarter/year)
- Click → to go forward (disabled when you're at the current period)
- Changing the dropdown (Week → Month) resets the offset back to the current period
- All past data is now browsable!




















All habit data is stored in localStorage — specifically under the key habits-analytics-data. This means:

✅ Come back after 1 week → data is there
✅ Come back after 1 month → data is there
✅ Come back after 1 year → data is there
✅ Refresh the page → data is there
✅ Close and reopen the browser → data is there

 -->