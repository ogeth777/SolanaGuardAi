export function formatNumber(num: number) {
  if (!num) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toLocaleString();
}

export function formatPrice(price: number): string {
  if (price === undefined || price === null) return '0.00';
  
  // 1. Very small numbers (e.g. SHIB, PEPE < $0.0001)
  if (price < 0.0001) {
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 4, 
      maximumFractionDigits: 10, 
      useGrouping: true 
    }).format(price);
  }
  
  // 2. Small numbers (< $1.00) - Show 4 decimals for precision
  if (price < 1.00) {
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 4, 
      maximumFractionDigits: 4, 
      useGrouping: true 
    }).format(price);
  }
  
  // 3. Standard numbers (>= $1.00) - Show 2 decimals
  // Examples: $1.40, $12.50, $3,023.64
  return new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2, 
    useGrouping: true 
  }).format(price);
}

export function formatPct(pct: number): string {
    if (pct === undefined || pct === null) return '0.00%';
    return `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
}
