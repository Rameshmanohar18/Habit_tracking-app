import { useState, useEffect } from 'react';
import { RING_COLORS } from './habitUtils';

export default function EditHabitModal({ habit, habitIndex, onSave, onClose }) {
  const [name, setName]         = useState(habit.name);
  const [colorIdx, setColorIdx] = useState(habit.colorIdx ?? habitIndex);

  useEffect(() => {
    setName(habit.name);
    setColorIdx(habit.colorIdx ?? habitIndex);
  }, [habit, habitIndex]);

  const handleSave = () => onSave(habit.id, name.trim() || habit.name, colorIdx);

  return (
    <div className="ht-modal-overlay" onClick={onClose}>
      <div className="ht-modal" onClick={e => e.stopPropagation()}>
        <h2 className="ht-modal-title">Edit Habit</h2>

        <label className="ht-modal-label">Name</label>
        <input
          className="ht-input ht-modal-input"
          type="text"
          value={name}
          autoFocus
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onClose();
          }}
        />

        <label className="ht-modal-label">Color</label>
        <div className="ht-color-grid">
          {RING_COLORS.map(([c1, c2], idx) => (
            <button
              key={idx}
              className={`ht-color-swatch ${colorIdx === idx ? 'selected' : ''}`}
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
              onClick={() => setColorIdx(idx)}
            >
              {colorIdx === idx && <span className="ht-color-check">✓</span>}
            </button>
          ))}
        </div>

        {/* Live preview */}
        <div className="ht-modal-preview">
          <svg viewBox="0 0 36 36" width="32" height="32">
            <defs>
              <linearGradient id="previewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={RING_COLORS[colorIdx][0]} />
                <stop offset="100%" stopColor={RING_COLORS[colorIdx][1]} />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="url(#previewGrad)" strokeWidth="3"
              strokeDasharray="60 94.2" strokeLinecap="round" transform="rotate(-90 18 18)" />
          </svg>
          <span className="ht-modal-preview-name" style={{ color: RING_COLORS[colorIdx][0] }}>
            {name || habit.name}
          </span>
        </div>

        <div className="ht-modal-actions">
          <button className="ht-modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="ht-modal-save"
            style={{ background: `linear-gradient(135deg, ${RING_COLORS[colorIdx][0]}, ${RING_COLORS[colorIdx][1]})` }}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
