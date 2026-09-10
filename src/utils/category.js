export const getCategoryIcon = (purpose = '') => {
  const text = purpose.toLowerCase();
  
  if (/dress|shirt|cloth|shopping/.test(text)) return '👗';
  if (/ticket|bus|train|movie|cinema/.test(text)) return '🎫';
  if (/food|lunch|dinner|mess|snack|breakfast/.test(text)) return '🍔';
  if (/auto|cab|taxi|fuel|petrol/.test(text)) return '🚕';
  if (/rent|room/.test(text)) return '🏠';
  if (/turf|football|cricket|sports|game/.test(text)) return '⚽';
  if (/book|stationery|pen/.test(text)) return '📚';
  if (/medicine|hospital|doctor/.test(text)) return '💊';
  if (/recharge|mobile|data/.test(text)) return '📱';
  
  return '💰';
};
