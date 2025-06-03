
export function formatCurrency(amount: number, currency?: string): string {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return currency ? `${currency} ${formattedAmount}` : formattedAmount;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Example currency rates (these would typically come from an API)
export const EXAMPLE_CURRENCY_RATES: Record<string, { rate: number; baseDate: string }> = {
  'USD': { rate: 1.0, baseDate: '2024-01-01' },
  'EUR': { rate: 0.85, baseDate: '2024-01-01' },
  'SEK': { rate: 10.50, baseDate: '2024-01-01' },
  'NOK': { rate: 10.75, baseDate: '2024-01-01' },
  'DKK': { rate: 6.35, baseDate: '2024-01-01' },
  'GBP': { rate: 0.75, baseDate: '2024-01-01' },
  'CHF': { rate: 0.92, baseDate: '2024-01-01' },
  'PLN': { rate: 4.20, baseDate: '2024-01-01' },
  'CZK': { rate: 22.50, baseDate: '2024-01-01' },
};

export function getCurrencyRate(currency: string): number {
  return EXAMPLE_CURRENCY_RATES[currency]?.rate || 1.0;
}

export function formatCurrencyWithRate(amount: number, currency?: string, showRate?: boolean): string {
  const baseCurrency = currency || 'USD';
  const rate = getCurrencyRate(baseCurrency);
  const formattedAmount = formatCurrency(amount, baseCurrency);
  
  if (showRate && rate !== 1.0) {
    return `${formattedAmount} (Rate: ${rate})`;
  }
  
  return formattedAmount;
}
