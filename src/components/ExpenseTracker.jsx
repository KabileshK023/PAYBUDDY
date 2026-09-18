import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getCategoryIcon } from '../utils/category';
import { api } from '../services/api';

// ── date helpers ──────────────────────────────────────────────────────────────

/**
 * Returns "YYYY-MM-DD" from either a full ISO string or a plain "YYYY-MM-DD"
 * string. Always uses LOCAL time — never shifts due to UTC conversion.
 */
const toDateKey = (value) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Today as "YYYY-MM-DD" in local time. */
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * "YYYY-MM-DD" → "DD/MM/YYYY" for display.
 * This is the single place that converts internal keys to user-facing format.
 */
const toDMY = (dateKey) => {
  const [y, m, d] = dateKey.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Day group header label.
 * Shows "Today", "Yesterday", or "DD/MM/YYYY".
 */
const formatGroupLabel = (dateKey) => {
  const today = todayKey();
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterday = toDateKey(yd);
  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';
  return toDMY(dateKey);
};

/**
 * Sub-label shown under each history entry.
 * New entries (plain YYYY-MM-DD) show "DD/MM/YYYY".
 * Legacy entries (ISO timestamp) show "hh:mm am/pm".
 */
const formatEntrySubLabel = (entry) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return toDMY(entry.date);
  }
  // Legacy ISO timestamp — show time
  const d = new Date(entry.date);
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${min} ${ampm}`;
};

/**
 * Compute difference in whole calendar days between two "YYYY-MM-DD" keys.
 * Uses local midnight — no UTC shift.
 */
const dayDiff = (fromKey, toKey) => {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to   = new Date(ty, tm - 1, td);
  return Math.round((to - from) / 86400000);
};

const periodSubLabel = { W: 'last 7 days', M: 'last 30 days', Y: 'last 12 months' };

// ── component ─────────────────────────────────────────────────────────────────

function ExpenseTracker() {
  const [expenses, setExpenses] = useState(() => {
    try {
      const key = api.getExpensesStorageKey();
      const saved = localStorage.getItem(key) || localStorage.getItem('paybuddy_expenses_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayKey); // "YYYY-MM-DD"
  const [mode, setMode]               = useState('add');
  const [period, setPeriod]           = useState('W');
  const [resetStep, setResetStep]     = useState(0);
  const [toast, setToast]             = useState(''); // error message
  const [editingExpense, setEditingExpense] = useState(null);
  const [editAmount, setEditAmount]   = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate]       = useState('');
  const isFirstRender = useRef(true);

  // Reset date to today whenever user switches to Add tab
  useEffect(() => {
    if (mode === 'add') setSelectedDate(todayKey());
  }, [mode]);

  // Load from MongoDB on initial mount
  useEffect(() => {
    api.getExpenses().then(remoteExpenses => {
      if (remoteExpenses && remoteExpenses.length > 0) {
        setExpenses(remoteExpenses);
        localStorage.setItem(api.getExpensesStorageKey(), JSON.stringify(remoteExpenses));
      }
    }).catch(console.error);
  }, []);

  // Save to localStorage & MongoDB on updates
  useEffect(() => {
    localStorage.setItem(api.getExpensesStorageKey(), JSON.stringify(expenses));
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    api.syncExpenses(expenses);
  }, [expenses]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── derived totals ──────────────────────────────────────────────────────────

  const spentToday = useMemo(() => {
    const key = todayKey();
    return expenses
      .filter(e => toDateKey(e.date) === key)
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const periodTotal = useMemo(() => {
    const today = todayKey();
    const limitDays = { W: 7, M: 30, Y: 365 }[period];

    return expenses.reduce((sum, e) => {
      const eKey = toDateKey(e.date);
      const diff = dayDiff(eKey, today);
      return (diff >= 0 && diff < limitDays) ? sum + e.amount : sum;
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
    // Sort entries within each day: newest first (id = Date.now())
    Object.values(groups).forEach(arr =>
      arr.sort((a, b) => Number(b.id) - Number(a.id))
    );
    // Sort day groups: newest date first
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);

  // ── actions ─────────────────────────────────────────────────────────────────

  const handleSave = (e) => {
    e.preventDefault();

    // Validate amount
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    // Reject future dates
    const today = todayKey();
    if (selectedDate > today) {
      setToast('Future dates are not allowed.');
      return;
    }

    setExpenses(prev => [...prev, {
      id: Date.now().toString(),
      amount: parsed,
      description: description.trim() || 'No description',
      date: selectedDate,
    }]);

    setAmount('');
    setDescription('');
    setSelectedDate(todayKey());
  };

  const handleStartEdit = (entry) => {
    setEditingExpense(entry);
    setEditAmount(entry.amount.toString());
    setEditDescription(entry.description === 'No description' ? '' : entry.description);
    setEditDate(toDateKey(entry.date));
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(editAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    if (editDate && editDate > todayKey()) {
      setToast('Future dates are not allowed.');
      return;
    }

    const updatedDate = editDate || toDateKey(editingExpense.date);

    setExpenses(prev => prev.map(item => {
      if (item.id === editingExpense.id) {
        return {
          ...item,
          amount: parsed,
          description: editDescription.trim() || 'No description',
          date: updatedDate,
        };
      }
      return item;
    }));

    setEditingExpense(null);
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

      {/* ── Toast ── */}
      {toast && (
        <div className="exp-toast">
          <span>⚠️ {toast}</span>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="exp-summary-row">

        <div className="exp-summary-card">
          <span className="exp-summary-label">Spent today</span>
          <span className="exp-summary-amount">₹{spentToday.toFixed(0)}</span>
        </div>

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

            {/* Date field */}
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
                <span className="exp-date-display">
                  {selectedDate ? toDMY(selectedDate) : 'DD/MM/YYYY'}
                </span>
                <input
                  type="date"
                  className="exp-date-input"
                  value={selectedDate}
                  max={todayKey()}
                  onChange={e => {
                    const val = e.target.value;
                    if (val && val > todayKey()) {
                      setToast('Future dates are not allowed.');
                      return;
                    }
                    setSelectedDate(val);
                  }}
                  required
                  aria-label="Expense date"
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
                    <span className="exp-day-label">{formatGroupLabel(dateKey)}</span>
                    <span className="exp-day-total">₹{dayTotal.toFixed(2)}</span>
                  </div>
                  <div className="tx-list">
                    {entries.map(entry => (
                      <div key={entry.id} className="tx-card">
                        <div className="tx-left">
                          <span className="tx-purpose">
                            {getCategoryIcon(entry.description)} {entry.description}
                          </span>
                          <span className="tx-date">{formatEntrySubLabel(entry)}</span>
                        </div>
                        <div className="tx-right">
                          <span className="tx-amount">₹{entry.amount.toFixed(2)}</span>
                          <button
                            type="button"
                            className="btn-edit"
                            title="Edit entry"
                            onClick={() => handleStartEdit(entry)}
                          >
                            Edit
                          </button>
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

      {/* ── Edit Modal ── */}
      {editingExpense && (
        <div className="modal-backdrop" onClick={() => setEditingExpense(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Edit Expense</h3>
                <p className="modal-subtitle">
                  Recorded on {formatGroupLabel(toDateKey(editingExpense.date))}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingExpense(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="modal-label">Amount (₹)</label>
                <div className="exp-amount-wrap" style={{ width: '100%' }}>
                  <span className="exp-rupee-prefix">₹</span>
                  <input
                    type="number"
                    className="exp-amount-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="modal-label">Description / Purpose</label>
                <input
                  type="text"
                  className="exp-desc-input"
                  style={{ width: '100%' }}
                  placeholder="What was it for? e.g. Tea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="modal-label">Date</label>
                <input
                  type="date"
                  className="exp-desc-input"
                  style={{ width: '100%', colorScheme: 'dark' }}
                  value={editDate}
                  max={todayKey()}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setEditingExpense(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-btn"
                  style={{ flex: 1 }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseTracker;
