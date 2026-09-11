// API client with offline/local fallback

const API_BASE = '/api';

export const api = {
  // ── Friends API ──
  async getFriends() {
    try {
      const res = await fetch(`${API_BASE}/friends`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API getFriends fallback to localStorage:', err.message);
      const saved = localStorage.getItem('paybuddy_dark_v1');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async syncFriends(friends) {
    try {
      await fetch(`${API_BASE}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friends })
      });
    } catch (err) {
      console.warn('API syncFriends error (persisted locally):', err.message);
    }
  },

  // ── Expenses API ──
  async getExpenses() {
    try {
      const res = await fetch(`${API_BASE}/expenses`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API getExpenses fallback to localStorage:', err.message);
      const saved = localStorage.getItem('paybuddy_expenses_v1');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async syncExpenses(expenses) {
    try {
      await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses })
      });
    } catch (err) {
      console.warn('API syncExpenses error (persisted locally):', err.message);
    }
  }
};
