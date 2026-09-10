import React, { useState } from 'react';

// Helper for avatar colors based on name
const getAvatarColor = (name) => {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

function Home({ friends, onAddFriend, onSelectFriend, onUpdateAvatar, hideHeader }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (newFriendName.trim() === '') return;
    onAddFriend(newFriendName.trim());
    setNewFriendName('');
    setIsAdding(false);
  };

  const handleImageUpload = (e, friendId) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (onUpdateAvatar) {
          onUpdateAvatar(friendId, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {!hideHeader && (
        <header className="header">
          <span className="gradient-text">₹ PayBuddy</span>
        </header>
      )}
      
      <div className="container">
        {!isAdding ? (
          <button 
            className="gradient-btn" 
            style={{ width: '100%', marginBottom: '1.5rem' }}
            onClick={() => setIsAdding(true)}
          >
            + Add Friend
          </button>
        ) : (
          <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="New friend's name" 
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              style={{ marginBottom: 0 }}
              autoFocus
            />
            <button type="submit" className="gradient-btn">Save</button>
            <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
          </form>
        )}

        <input 
          type="text" 
          className="input-field"
          placeholder="Search friends..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '1.5rem' }}
        />

        <ul className="friend-list">
          {filteredFriends.map((friend) => (
            <li 
              key={friend.id} 
              className="friend-item"
              onClick={() => onSelectFriend(friend.id)}
            >
              <div className="avatar-wrapper" onClick={(e) => e.stopPropagation()}>
                <div 
                  className="avatar" 
                  style={{ backgroundColor: friend.avatar ? 'transparent' : getAvatarColor(friend.name) }}
                >
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.name} className="avatar-img" />
                  ) : (
                    friend.name.charAt(0).toUpperCase()
                  )}
                </div>
                <label className="camera-badge" title="Upload photo">
                  📷
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, friend.id)} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{friend.name}</span>
            </li>
          ))}
          {filteredFriends.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              No friends found.
            </p>
          )}
        </ul>
      </div>
    </>
  );
}

export default Home;
