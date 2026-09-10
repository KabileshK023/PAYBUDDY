import React from 'react';

const getAvatarColor = (name) => {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

function FriendPage({ friend, onBack, onAddEntry, onViewHistory }) {
  const iGiveTotal = friend.transactions
    .filter(tx => tx.type === 'give')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const theyGiveTotal = friend.transactions
    .filter(tx => tx.type === 'receive')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netBalance = iGiveTotal - theyGiveTotal;
  let balanceText = "All settled";
  let balanceColor = "var(--text-main)";

  if (netBalance > 0) {
    balanceText = `You give ${friend.name} ₹${netBalance.toFixed(2)}`;
    balanceColor = "var(--text-main)";
  } else if (netBalance < 0) {
    balanceText = `${friend.name} give you ₹${Math.abs(netBalance).toFixed(2)}`;
    balanceColor = "var(--teal-accent)";
  }

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
        <div style={{ width: '68px', flexShrink: 0 }}></div>
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
    </>
  );
}

export default FriendPage;
