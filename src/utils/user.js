const USER_ID_KEY = 'paybuddy_user_id';
const USERNAME_KEY = 'paybuddy_username';

export function getUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    // Generate clean unique user identifier
    id = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY) || 'My Account';
}

export function setUsername(name) {
  const cleanName = (name || '').trim() || 'My Account';
  localStorage.setItem(USERNAME_KEY, cleanName);
  return cleanName;
}

export function switchUser(newUserId, newUsername) {
  if (newUserId) {
    localStorage.setItem(USER_ID_KEY, newUserId.trim());
  }
  if (newUsername) {
    localStorage.setItem(USERNAME_KEY, newUsername.trim());
  }
}
