
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
  'USD': { rate: 0.095, baseDate: '2024-01-01' }, // 1 SEK = 0.095 USD
  'EUR': { rate: 0.081, baseDate: '2024-01-01' }, // 1 SEK = 0.081 EUR
  'NOK': { rate: 1.024, baseDate: '2024-01-01' }, // 1 SEK = 1.024 NOK
  'DKK': { rate: 0.605, baseDate: '2024-01-01' }, // 1 SEK = 0.605 DKK
  'GBP': { rate: 0.071, baseDate: '2024-01-01' }, // 1 SEK = 0.071 GBP
  'CHF': { rate: 0.088, baseDate: '2024-01-01' }, // 1 SEK = 0.088 CHF
  'PLN': { rate: 0.400, baseDate: '2024-01-01' }, // 1 SEK = 0.400 PLN
  'CZK': { rate: 2.143, baseDate: '2024-01-01' }, // 1 SEK = 2.143 CZK
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
