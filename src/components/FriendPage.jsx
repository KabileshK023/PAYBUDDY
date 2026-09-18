import React, { useState } from 'react';

const getAvatarColor = (name) => {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

function FriendPage({ friend, onBack, onDeleteFriend, onAddEntry, onViewHistory }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const iGiveTotal = (friend.transactions || [])
    .filter(tx => tx.type === 'give')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const theyGiveTotal = (friend.transactions || [])
    .filter(tx => tx.type === 'receive')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netBalance = iGiveTotal - theyGiveTotal;
  let balanceText = "All settled ✓";
  let balanceColor = "var(--teal-accent)";

  if (netBalance > 0) {
    balanceText = `${friend.name} gives you ₹${netBalance.toFixed(2)}`;
    balanceColor = "var(--teal-accent)";
  } else if (netBalance < 0) {
    balanceText = `You give ${friend.name} ₹${Math.abs(netBalance).toFixed(2)}`;
    balanceColor = "var(--text-main)";
  }

  const handleDeleteConfirm = () => {
    if (onDeleteFriend) {
      onDeleteFriend(friend.id);
    }
  };

  return (
    <>
      <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn-back-pill">
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 1, overflow: 'hidden' }}>
          <div 
            className="avatar" 
            style={{ 
              width: '32px', 
              height: '32px', 
              fontSize: '0.95rem',
              flexShrink: 0,
              backgroundColor: friend.avatar ? 'transparent' : getAvatarColor(friend.name) 
            }}
          >
            {friend.avatar ? (
              <img src={friend.avatar} alt={friend.name} className="avatar-img" />
            ) : (
              friend.name.charAt(0).toUpperCase()
            )}
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.name}</span>
        </div>
        <button 
          type="button" 
          className="btn-icon-delete"
          title={`Delete ${friend.name}`}
          onClick={() => setShowDeleteModal(true)}
          style={{ margin: 0 }}
        >
          🗑️
        </button>
      </header>

      <div className="container">
        <div className="boxes-container">
          <div className="box" onClick={() => onAddEntry('give')}>
            <h3>I Give</h3>
            <span className="amount amount-i-give">₹{iGiveTotal.toFixed(2)}</span>
          </div>

          <div className="box" onClick={() => onAddEntry('receive')}>
            <h3>{friend.name} Gives Me</h3>
            <span className="amount amount-they-give">₹{theyGiveTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="net-balance" style={{ color: balanceColor }}>
          {balanceText}
        </div>

        <button 
          className="btn-secondary" 
          style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
          onClick={onViewHistory}
        >
          View History
        </button>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Friend?</h3>
            <p className="modal-body">
              Are you sure you want to delete <strong>{friend.name}</strong>? All transaction history for this friend will be permanently deleted.
            </p>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={handleDeleteConfirm}
              >
                Delete Friend
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FriendPage;
