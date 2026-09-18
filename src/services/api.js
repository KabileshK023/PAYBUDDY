// API client with user-isolated offline/local fallback
import { getUserId } from '../utils/user';

const API_BASE = '/api';

const getFriendsStorageKey = () => `paybuddy_friends_${getUserId()}`;
const getExpensesStorageKey = () => `paybuddy_expenses_${getUserId()}`;

export const api = {
  getFriendsStorageKey,
  getExpensesStorageKey,

  // ── Friends API ──
  async getFriends() {
    const userId = getUserId();
    try {
      const res = await fetch(`${API_BASE}/friends?userId=${encodeURIComponent(userId)}`, {
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API getFriends fallback to localStorage:', err.message);
      const saved = localStorage.getItem(getFriendsStorageKey()) || localStorage.getItem('paybuddy_dark_v1');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async syncFriends(friends) {
    const userId = getUserId();
    try {
      await fetch(`${API_BASE}/friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ friends, userId })
      });
    } catch (err) {
      console.warn('API syncFriends error (persisted locally):', err.message);
    }
  },

  // ── Expenses API ──
  async getExpenses() {
    const userId = getUserId();
    try {
      const res = await fetch(`${API_BASE}/expenses?userId=${encodeURIComponent(userId)}`, {
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API getExpenses fallback to localStorage:', err.message);
      const saved = localStorage.getItem(getExpensesStorageKey()) || localStorage.getItem('paybuddy_expenses_v1');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async syncExpenses(expenses) {
    const userId = getUserId();
    try {
      await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ expenses, userId })
      });
    } catch (err) {
      console.warn('API syncExpenses error (persisted locally):', err.message);
    }
  }
};
