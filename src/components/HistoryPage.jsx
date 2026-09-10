import React from 'react';
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

function HistoryPage({ friend, onBack, onDelete, onEdit }) {
  const giveTransactions = friend.transactions
    .filter(tx => tx.type === 'give')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const receiveTransactions = friend.transactions
    .filter(tx => tx.type === 'receive')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const renderTransactionList = (transactions, title) => (
    <div className="history-section">
      <h3>{title}</h3>
      {transactions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No history.</p>
      ) : (
        <div className="tx-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="tx-card">
              <div className="tx-left">
                <span className="tx-purpose">
                  {getCategoryIcon(tx.purpose)} {tx.purpose}
                </span>
                <span className="tx-date">{formatDate(tx.date)}</span>
              </div>
              <div className="tx-right">
                <span className="tx-amount">₹{tx.amount}</span>
                {onEdit && (
                  <button 
                    type="button" 
                    className="btn-edit" 
                    onClick={() => onEdit(tx)}
                  >
                    Edit
                  </button>
                )}
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
  );

  return (
    <>
      <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn-back-pill">
          ← Back
        </button>
        <span style={{ fontSize: '1.1rem', fontWeight: 600, textAlign: 'center', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 0.5rem' }}>
          History - {friend.name}
        </span>
        <div style={{ width: '68px', flexShrink: 0 }}></div>
      </header>

      <div className="container">
        {renderTransactionList(giveTransactions, `I Paid ${friend.name}`.toUpperCase())}
        {renderTransactionList(receiveTransactions, `${friend.name} Paid Me`.toUpperCase())}
      </div>
    </>
  );
}

export default HistoryPage;
