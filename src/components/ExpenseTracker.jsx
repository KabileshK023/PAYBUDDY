import React, { useState, useEffect, useMemo } from 'react';
import { getCategoryIcon } from '../utils/category';

const STORAGE_KEY = 'paybuddy_expenses_v1';

// ── date helpers ──────────────────────────────────────────────────────────────

/**
 * Returns "YYYY-MM-DD" from either an ISO string OR a plain "YYYY-MM-DD" string,
 * always in LOCAL time — never shifts due to UTC conversion.
 */
const toDateKey = (value) => {
  // If already a plain date string (YYYY-MM-DD) just return it directly.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // Otherwise it's a full ISO timestamp — extract local date parts.
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Today's date as "YYYY-MM-DD" in local time. */
const todayKey = () => toDateKey(new Date());

/** Human-readable label for a dateKey. */
const formatDisplayDate = (dateKey) => {
  const today = todayKey();
  // yesterday in local time
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = toDateKey(d);

  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';

  const [y, mo, day] = dateKey.split('-');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${monthNames[parseInt(mo) - 1]} ${y}`;
};

/** "hh:mm am/pm" — only shown for same-day entries; for past dates we show the dateKey. */
const formatEntryTime = (entry) => {
  // New entries store a plain dateKey in `entry.date`.
  // Legacy entries (before this update) stored an ISO string.
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    // We have no time for past-date entries; show the formatted date instead.
    return formatDisplayDate(entry.date);
  }
  // Legacy: parse the ISO timestamp and show the time.
  const d = new Date(entry.date);
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${min} ${ampm}`;
};

const periodSubLabel = { W: 'last 7 days', M: 'last 30 days', Y: 'last 12 months' };

// ── component ─────────────────────────────────────────────────────────────────

function ExpenseTracker() {
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayKey); // "YYYY-MM-DD"
  const [mode, setMode] = useState('add');
  const [period, setPeriod] = useState('W');
  const [resetStep, setResetStep] = useState(0);

  // Keep selectedDate in sync if the component is remounted on a new day
  useEffect(() => {
    if (mode === 'add') setSelectedDate(todayKey());
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  // ── derived totals ──────────────────────────────────────────────────────────

  const spentToday = useMemo(() => {
    const key = todayKey();
    return expenses
      .filter(e => toDateKey(e.date) === key)
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const periodTotal = useMemo(() => {
    const todayStr = todayKey();
    const [ty, tm, td] = todayStr.split('-').map(Number);

    return expenses.reduce((sum, e) => {
      const dk = toDateKey(e.date);
      const [ey, em, ed] = dk.split('-').map(Number);

      let include = false;
      if (period === 'W') {
        // last 7 days inclusive of today
        const diffMs = new Date(ty, tm - 1, td) - new Date(ey, em - 1, ed);
        include = diffMs >= 0 && diffMs < 7 * 86400000;
      } else if (period === 'M') {
        // last 30 days
        const diffMs = new Date(ty, tm - 1, td) - new Date(ey, em - 1, ed);
        include = diffMs >= 0 && diffMs < 30 * 86400000;
      } else if (period === 'Y') {
        // last 365 days
        const diffMs = new Date(ty, tm - 1, td) - new Date(ey, em - 1, ed);
        include = diffMs >= 0 && diffMs < 365 * 86400000;
      }
      return include ? sum + e.amount : sum;
    }, 0);
  }, [expenses, period]);

  // ── history grouped by day ──────────────────────────────────────────────────

  const groupedHistory = useMemo(() => {
    const groups = {};
    [...expenses].forEach(e => {
      const key = toDateKey(e.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    // Sort entries within each day by insertion order (id is Date.now())
    Object.values(groups).forEach(arr =>
      arr.sort((a, b) => Number(b.id) - Number(a.id))
    );

    // Sort days newest-first
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);

  // ── actions ─────────────────────────────────────────────────────────────────

  const handleSave = (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    setExpenses(prev => [...prev, {
      id: Date.now().toString(),
      amount: parsed,
      description: description.trim() || 'No description',
      // Store as plain "YYYY-MM-DD" — no timezone ambiguity.
      date: selectedDate,
    }]);

    setAmount('');
    setDescription('');
    setSelectedDate(todayKey());
  };

  const handleDelete = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleReset = () => {
    if (resetStep === 0) {
      setResetStep(1);
    } else {
      setExpenses([]);
      setResetStep(0);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="container" style={{ paddingTop: '1.25rem' }}>

      {/* ── Summary cards ── */}
      <div className="exp-summary-row">

        {/* Spent today */}
        <div className="exp-summary-card">
          <span className="exp-summary-label">Spent today</span>
          <span className="exp-summary-amount">₹{spentToday.toFixed(0)}</span>
        </div>

        {/* Period card */}
        <div className="exp-summary-card">
          <div className="exp-period-header">
            <span className="exp-summary-label">Spent this</span>
            <div className="exp-period-toggle">
              {['W', 'M', 'Y'].map(p => (
                <button
                  key={p}
                  className={`exp-period-btn${period === p ? ' active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <span className="exp-summary-amount exp-summary-amount--period">
            ₹{periodTotal.toFixed(0)}
          </span>
          <span className="exp-period-sublabel">{periodSubLabel[period]}</span>
        </div>
      </div>

      {/* ── Add / History toggle ── */}
      <div className="exp-tab-row">
        <button
          className={`exp-tab-btn${mode === 'add' ? ' active' : ''}`}
          onClick={() => setMode('add')}
        >
          Add
        </button>
        <button
          className={`exp-tab-btn${mode === 'history' ? ' active' : ''}`}
          onClick={() => setMode('history')}
        >
          History
        </button>
      </div>

      {/* ── Add form ── */}
      {mode === 'add' && (
        <div className="exp-form-card">
          <p className="exp-form-title">Add an expense</p>
          <form onSubmit={handleSave}>

            {/* Amount + Description row */}
            <div className="exp-form-inputs">
              <div className="exp-amount-wrap">
                <span className="exp-rupee-prefix">₹</span>
                <input
                  type="number"
                  className="exp-amount-input"
                  placeholder="0"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
              <input
                type="text"
                className="exp-desc-input"
                placeholder="What was it for? e.g. Tea"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Date row */}
            <div className="exp-date-row">
              <div className="exp-date-label-row">
                <span className="exp-field-label">Date</span>
                <button
                  type="button"
                  className="exp-today-btn"
                  onClick={() => setSelectedDate(todayKey())}
                >
                  Today
                </button>
              </div>
              <div className="exp-date-wrap">
                <span className="exp-date-icon">📅</span>
                <input
                  type="date"
                  className="exp-date-input"
                  value={selectedDate}
                  max={todayKey()}
                  onChange={e => setSelectedDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="exp-save-btn">
              Save expense
            </button>
          </form>
        </div>
      )}

      {/* ── History ── */}
      {mode === 'history' && (
        <>
          {groupedHistory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              No expenses recorded yet.
            </p>
          ) : (
            groupedHistory.map(([dateKey, entries]) => {
              const dayTotal = entries.reduce((s, e) => s + e.amount, 0);
              return (
                <div key={dateKey} className="exp-day-group">
                  <div className="exp-day-header">
                    <span className="exp-day-label">{formatDisplayDate(dateKey)}</span>
                    <span className="exp-day-total">₹{dayTotal.toFixed(2)}</span>
                  </div>
                  <div className="tx-list">
                    {entries.map(entry => (
                      <div key={entry.id} className="tx-card">
                        <div className="tx-left">
                          <span className="tx-purpose">
                            {getCategoryIcon(entry.description)} {entry.description}
                          </span>
                          <span className="tx-date">{formatEntryTime(entry)}</span>
                        </div>
                        <div className="tx-right">
                          <span className="tx-amount">₹{entry.amount.toFixed(2)}</span>
                          <button
                            type="button"
                            className="btn-delete"
                            title="Delete entry"
                            onClick={() => handleDelete(entry.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <button
            className={`exp-reset-btn${resetStep === 1 ? ' confirm' : ''}`}
            onClick={handleReset}
            onBlur={() => setResetStep(0)}
            style={{ marginTop: '1.5rem' }}
          >
            {resetStep === 1 ? 'Tap again to confirm reset' : 'Reset history'}
          </button>
        </>
      )}
    </div>
  );
}

export default ExpenseTracker;
