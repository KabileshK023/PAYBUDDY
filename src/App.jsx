import React, { useState, useEffect, useRef } from 'react';
import Home from './components/Home';
import FriendPage from './components/FriendPage';
import HistoryPage from './components/HistoryPage';
import AddEntry from './components/AddEntry';
import ExpenseTracker from './components/ExpenseTracker';
import { api } from './services/api';
import { getUserId, getUsername, setUsername, switchUser } from './utils/user';

function App() {
  const [userId, setCurrentUserId] = useState(getUserId);
  const [userName, setCurrentUserName] = useState(getUsername);
  const [showUserModal, setShowUserModal] = useState(false);
  const [nameInput, setNameInput] = useState(getUsername);
  const [switchIdInput, setSwitchIdInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [userToast, setUserToast] = useState('');

  const [friends, setFriends] = useState(() => {
    const key = api.getFriendsStorageKey();
    const saved = localStorage.getItem(key) || localStorage.getItem('paybuddy_dark_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentView, setCurrentView] = useState('home'); // 'home', 'friend', 'history', 'add_entry'
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'expenses'
  const [activeFriendId, setActiveFriendId] = useState(null);
  const [transactionType, setTransactionType] = useState(null); // 'give' or 'receive'
  const [editingTransaction, setEditingTransaction] = useState(null);
  const isFirstRender = useRef(true);

  // Load from MongoDB on initial mount or when userId changes
  useEffect(() => {
    api.getFriends().then(remoteFriends => {
      if (remoteFriends && Array.isArray(remoteFriends)) {
        setFriends(remoteFriends);
        localStorage.setItem(api.getFriendsStorageKey(), JSON.stringify(remoteFriends));
      }
    }).catch(console.error);
  }, [userId]);

  // Save to localStorage & MongoDB on updates
  useEffect(() => {
    localStorage.setItem(api.getFriendsStorageKey(), JSON.stringify(friends));
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    api.syncFriends(friends);
  }, [friends, userId]);

  const handleAddFriend = (name) => {
    const newFriend = {
      id: Date.now().toString(),
      name,
      transactions: []
    };
    setFriends([...friends, newFriend]);
  };

  const handleUpdateAvatar = (friendId, avatarDataUrl) => {
    setFriends(friends.map(f => {
      if (f.id === friendId) {
        return { ...f, avatar: avatarDataUrl };
      }
      return f;
    }));
  };

  const handleAddTransaction = (amount, purpose) => {
    const newTx = {
      id: Date.now().toString(),
      type: transactionType,
      amount,
      purpose,
      date: new Date().toISOString()
    };

    setFriends(friends.map(f => {
      if (f.id === activeFriendId) {
        return {
          ...f,
          transactions: [...f.transactions, newTx]
        };
      }
      return f;
    }));
  };

  const handleUpdateTransaction = (txId, amount, purpose) => {
    setFriends(friends.map(f => {
      if (f.id === activeFriendId) {
        return {
          ...f,
          transactions: f.transactions.map(tx => 
            tx.id === txId 
              ? { ...tx, amount, purpose }
              : tx
          )
        };
      }
      return f;
    }));
  };

  const handleDeleteTransaction = (txId) => {
    setFriends(friends.map(f => {
      if (f.id === activeFriendId) {
        return {
          ...f,
          transactions: f.transactions.filter(tx => tx.id !== txId)
        };
      }
      return f;
    }));
  };

  const handleDeleteFriend = (friendId) => {
    setFriends(friends.filter(f => f.id !== friendId));
    if (activeFriendId === friendId) {
      setActiveFriendId(null);
      setCurrentView('home');
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      const updated = setUsername(nameInput.trim());
      setCurrentUserName(updated);
    }
    if (switchIdInput.trim() && switchIdInput.trim() !== userId) {
      const targetId = switchIdInput.trim();
      switchUser(targetId, nameInput.trim() || 'My Account');
      setCurrentUserId(targetId);
      setSwitchIdInput('');
      setUserToast('Switched to linked account!');
      // Reload friends and expenses for new user ID
      setTimeout(() => {
        window.location.reload();
      }, 500);
      return;
    }
    setShowUserModal(false);
  };

  const handleCreateNewSpace = () => {
    const freshId = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    switchUser(freshId, 'My New Space');
    setCurrentUserId(freshId);
    setCurrentUserName('My New Space');
    setNameInput('My New Space');
    setShowUserModal(false);
    window.location.reload();
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const activeFriend = friends.find(f => f.id === activeFriendId);

  // Router
  if (currentView === 'home' || !activeFriend) {
    return (
      <>
        {/* ── Top nav with tab bar ── */}
        <header className="header" style={{ flexDirection: 'column', gap: 0, padding: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: 'calc(1.25rem + env(safe-area-inset-top)) 1.25rem 0.75rem 1.25rem',
          }}>
            <span className="gradient-text">₹ PayBuddy</span>
            <button
              type="button"
              className="user-profile-badge"
              onClick={() => {
                setNameInput(userName);
                setShowUserModal(true);
              }}
              title="Manage your profile & device sync"
            >
              <span className="user-profile-icon">👤</span>
              <span className="user-profile-name">{userName}</span>
            </button>
          </div>

          {/* Tab strip */}
          <div className="app-tab-strip">
            <button
              className={`app-tab-btn${activeTab === 'friends' ? ' active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Friends
            </button>
            <button
              className={`app-tab-btn${activeTab === 'expenses' ? ' active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              My expenses
            </button>
          </div>
        </header>

        {activeTab === 'friends' ? (
          <Home
            friends={friends}
            onAddFriend={handleAddFriend}
            onDeleteFriend={handleDeleteFriend}
            onUpdateAvatar={handleUpdateAvatar}
            onSelectFriend={(id) => {
              setActiveFriendId(id);
              setCurrentView('friend');
            }}
            hideHeader
          />
        ) : (
          <ExpenseTracker key={userId} />
        )}

        {/* ── Account / User Profile Modal ── */}
        {showUserModal && (
          <div className="modal-backdrop" onClick={() => setShowUserModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">My Account Space</h3>
                  <p className="modal-subtitle">Each device/user has their own private data.</p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowUserModal(false)}
                >
                  ✕
                </button>
              </div>

              {userToast && (
                <div style={{ color: 'var(--teal-accent)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  {userToast}
                </div>
              )}

              <form onSubmit={handleSaveProfile}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="modal-label">Your Space / Name</label>
                  <input
                    type="text"
                    className="exp-desc-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Kabilesh"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="modal-label">Your Private Account ID</label>
                  <div className="user-code-box">
                    <span>{userId}</span>
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={handleCopyId}
                    >
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    Copy this ID to paste on your other phone/laptop to sync your data.
                  </span>
                </div>

                <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <label className="modal-label">Link Another Device Account (Optional)</label>
                  <input
                    type="text"
                    className="exp-desc-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    placeholder="Paste Account ID from your other device..."
                    value={switchIdInput}
                    onChange={e => setSwitchIdInput(e.target.value)}
                  />
                </div>

                <div className="modal-actions" style={{ flexDirection: 'column', gap: '0.6rem' }}>
                  <button type="submit" className="gradient-btn" style={{ width: '100%' }}>
                    Save & Apply
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '0.65rem' }}
                    onClick={handleCreateNewSpace}
                  >
                    + Create New Blank Space
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  if (currentView === 'friend') {
    return (
      <FriendPage 
        friend={activeFriend}
        onBack={() => {
          setActiveFriendId(null);
          setCurrentView('home');
        }}
        onDeleteFriend={handleDeleteFriend}
        onAddEntry={(type) => {
          setTransactionType(type);
          setCurrentView('add_entry');
        }}
        onViewHistory={() => setCurrentView('history')}
      />
    );
  }

  if (currentView === 'history') {
    return (
      <HistoryPage 
        friend={activeFriend}
        onBack={() => setCurrentView('friend')}
        onDelete={handleDeleteTransaction}
        onEdit={(tx) => {
          setTransactionType(tx.type);
          setEditingTransaction(tx);
          setCurrentView('add_entry');
        }}
      />
    );
  }

  if (currentView === 'add_entry') {
    return (
      <AddEntry 
        friend={activeFriend}
        type={transactionType}
        initialTx={editingTransaction}
        onBack={() => {
          setEditingTransaction(null);
          setCurrentView('friend');
        }}
        onSave={(amount, purpose) => {
          handleAddTransaction(amount, purpose);
          setEditingTransaction(null);
        }}
        onUpdate={(txId, amount, purpose) => {
          handleUpdateTransaction(txId, amount, purpose);
          setEditingTransaction(null);
        }}
        onDelete={(txId) => {
          handleDeleteTransaction(txId);
          setEditingTransaction(null);
        }}
      />
    );
  }

  return <div>Loading...</div>;
}

export default App;
