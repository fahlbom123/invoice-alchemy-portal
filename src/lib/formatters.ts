
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

// Example currency rates (SEK as base currency)
export const EXAMPLE_CURRENCY_RATES: Record<string, { rate: number; baseDate: string }> = {
  'SEK': { rate: 1.0, baseDate: '2024-01-01' },
  'USD': { rate: 10.53, baseDate: '2024-01-01' }, // 1 USD = 10.53 SEK
  'EUR': { rate: 12.34, baseDate: '2024-01-01' }, // 1 EUR = 12.34 SEK
  'NOK': { rate: 0.98, baseDate: '2024-01-01' }, // 1 NOK = 0.98 SEK
  'DKK': { rate: 1.65, baseDate: '2024-01-01' }, // 1 DKK = 1.65 SEK
  'GBP': { rate: 14.08, baseDate: '2024-01-01' }, // 1 GBP = 14.08 SEK
  'CHF': { rate: 11.36, baseDate: '2024-01-01' }, // 1 CHF = 11.36 SEK
  'PLN': { rate: 2.50, baseDate: '2024-01-01' }, // 1 PLN = 2.50 SEK
  'CZK': { rate: 0.47, baseDate: '2024-01-01' }, // 1 CZK = 0.47 SEK
};

export function getCurrencyRate(currency: string): number {
  return EXAMPLE_CURRENCY_RATES[currency]?.rate || 1.0;
}

export function formatCurrencyWithRate(amount: number, currency?: string, showRate?: boolean): string {
  const baseCurrency = currency || 'SEK';
  const rate = getCurrencyRate(baseCurrency);
  const formattedAmount = formatCurrency(amount, baseCurrency);
  
  if (showRate && rate !== 1.0) {
    return `${formattedAmount} (Rate: ${rate})`;
  }
  
  return formattedAmount;
}
