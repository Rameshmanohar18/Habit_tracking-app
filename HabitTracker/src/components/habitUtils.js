// ── Shared constants & pure utility functions ──────────────

export const RING_COLORS = [
  ['#22d3ee', '#3b82f6'],
  ['#34d399', '#10b981'],
  ['#a855f7', '#ec4899'],
  ['#fbbf24', '#f97316'],
  ['#f87171', '#ef4444'],
  ['#818cf8', '#6366f1'],
];

export const QUOTES = [
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

/** Returns YYYY-MM-DD string for N days ago */
export const dateStr = (daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

/** Returns [c1, c2] for a habit based on its stored colorIdx or position */
export const getHabitColor = (habit, habits) => {
  const idx = habits.findIndex(h => h.id === habit.id);
  const colorIdx = habit?.colorIdx ?? (idx < 0 ? 0 : idx);
  return RING_COLORS[colorIdx % RING_COLORS.length];
};

export const weeklyScore = (h) => {
  let c = 0;
  for (let i = 0; i < 7; i++) if (h.completions[dateStr(i)]) c++;
  return Math.round((c / 7) * 100);
};

export const monthlyScore = (h) => {
  let c = 0;
  const d = new Date().getDate();
  for (let i = 0; i < d; i++) if (h.completions[dateStr(i)]) c++;
  return Math.round((c / d) * 100);
};

export const quarterScore = (h) => {
  let c = 0;
  for (let i = 0; i < 90; i++) if (h.completions[dateStr(i)]) c++;
  return Math.round((c / 90) * 100);
};

export const yearlyScore = (h) => {
  let c = 0;
  for (let i = 0; i < 365; i++) if (h.completions[dateStr(i)]) c++;
  return Math.round((c / 365) * 100);
};

export const currentStreak = (h) => {
  let s = 0;
  const d = new Date();
  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (h.completions[ds]) { s++; d.setDate(d.getDate() - 1); } else break;
  }
  return s;
};

export const bestStreak = (h) => {
  const dates = Object.keys(h.completions).sort();
  let max = 0, cur = 0, last = null;
  dates.forEach(ds => {
    const d = new Date(ds);
    if (last) {
      const diff = Math.floor((d - last) / 864e5);
      cur = diff === 1 ? cur + 1 : 1;
      max = Math.max(max, cur);
    } else { cur = 1; }
    last = d;
  });
  return Math.max(max, cur);
};

export const dayOfYear = (d) =>
  Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
