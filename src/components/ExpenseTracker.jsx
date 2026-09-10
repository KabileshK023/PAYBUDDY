import React, { useState, useEffect, useMemo } from 'react';
import { getCategoryIcon } from '../utils/category';

const STORAGE_KEY = 'paybuddy_expenses_v1';

// ── date helpers ──────────────────────────────────────────────────────────────

const toDateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayKey = () => toDateKey(new Date());

const formatDisplayDate = (dateKey) => {
  const today = todayKey();
  const yesterday = toDateKey(Date.now() - 86400000);
  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';
  const [y, m, d] = dateKey.split('-');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${monthNames[parseInt(m) - 1]} ${y}`;
};

const formatTime = (isoStr) => {
  const d = new Date(isoStr);
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
  const [mode, setMode] = useState('add');
  const [period, setPeriod] = useState('W');
  const [resetStep, setResetStep] = useState(0);

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
    const now = Date.now();
    const msMap = { W: 7 * 86400000, M: 30 * 86400000, Y: 365 * 86400000 };
    const cutoff = now - msMap[period];
    return expenses
      .filter(e => new Date(e.date).getTime() >= cutoff)
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses, period]);

  // ── history grouped by day ──────────────────────────────────────────────────

  const groupedHistory = useMemo(() => {
    const groups = {};
    [...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(e => {
        const key = toDateKey(e.date);
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
      });
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
      date: new Date().toISOString(),
    }]);
    setAmount('');
    setDescription('');
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
            <div className="exp-form-inputs">
              {/* Amount */}
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

              {/* Description */}
              <input
                type="text"
                className="exp-desc-input"
                placeholder="What was it for? e.g. Tea"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
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
                          <span className="tx-date">{formatTime(entry.date)}</span>
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
