import React, { useState } from 'react';
import { getCategoryIcon } from '../utils/category';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate().toString().padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, '0');
  return `${day} ${month} ${year} · ${hoursStr}:${minutes} ${ampm}`;
};

function AddEntry({ friend, type, onBack, onSave, onUpdate, onDelete }) {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [editingTxId, setEditingTxId] = useState(null);

  const title = type === 'give' ? `I Paid ${friend.name}` : `${friend.name} Paid Me`;
  const btnColor = type === 'give' ? 'var(--gradient-start)' : 'var(--teal-accent)';

  const relevantTransactions = friend.transactions
    .filter(tx => tx.type === type)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    
    if (editingTxId) {
      onUpdate(editingTxId, parsedAmount, purpose.trim() || 'No purpose');
      setEditingTxId(null);
    } else {
      onSave(parsedAmount, purpose.trim() || 'No purpose');
    }
    setAmount('');
    setPurpose('');
  };

  const handleEditClick = (tx) => {
    setEditingTxId(tx.id);
    setAmount(tx.amount.toString());
    setPurpose(tx.purpose);
  };

  return (
    <>
      <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn-back-pill">
          ← Back
        </button>
        <span style={{ fontSize: '1.1rem', fontWeight: 600, textAlign: 'center', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 0.5rem' }}>
          {title}
        </span>
        <div style={{ width: '68px', flexShrink: 0 }}></div>
      </header>

      <div className="container">
        <div className="card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Amount (₹)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="0.00" 
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{ fontSize: '1.5rem', padding: '1rem', marginBottom: 0 }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Purpose</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. bus ticket, lunch"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                style={{ marginBottom: 0 }}
              />
            </div>

            <button 
              type="submit" 
              className="gradient-btn" 
              style={{ width: '100%', padding: '1rem', background: btnColor }}
            >
              {editingTxId ? 'Update Entry' : 'Save Entry'}
            </button>
          </form>
        </div>

        <div className="history-section">
          <h3>RECENT ENTRIES</h3>
          {relevantTransactions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No history yet.</p>
          ) : (
            <div className="tx-list">
              {relevantTransactions.map((tx) => (
                <div key={tx.id} className="tx-card">
                  <div className="tx-left">
                    <span className="tx-purpose">
                      {getCategoryIcon(tx.purpose)} {tx.purpose}
                    </span>
                    <span className="tx-date">{formatDate(tx.date)}</span>
                  </div>
                  <div className="tx-right">
                    <span className="tx-amount">₹{tx.amount}</span>
                    <button 
                      type="button" 
                      className="btn-edit" 
                      onClick={() => handleEditClick(tx)}
                    >
                      Edit
                    </button>
                    {onDelete && (
                      <button 
                        type="button" 
                        className="btn-delete" 
                        title="Delete entry"
                        onClick={() => onDelete(tx.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AddEntry;
