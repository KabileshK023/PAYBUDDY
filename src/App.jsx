import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import FriendPage from './components/FriendPage';
import HistoryPage from './components/HistoryPage';
import AddEntry from './components/AddEntry';
import ExpenseTracker from './components/ExpenseTracker';

function App() {
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('paybuddy_dark_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [currentView, setCurrentView] = useState('home'); // 'home', 'friend', 'history', 'add_entry'
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'expenses'
  const [activeFriendId, setActiveFriendId] = useState(null);
  const [transactionType, setTransactionType] = useState(null); // 'give' or 'receive'

  useEffect(() => {
    localStorage.setItem('paybuddy_dark_v1', JSON.stringify(friends));
  }, [friends]);

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
          <ExpenseTracker />
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
        onBack={() => setCurrentView('friend')}
        onSave={handleAddTransaction}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />
    );
  }

  return <div>Loading...</div>;
}

export default App;
