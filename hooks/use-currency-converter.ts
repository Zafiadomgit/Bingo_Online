import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'VES';

interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
}

export function useCurrencyConverter() {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExchangeRates();
    // Cargar moneda preferida del localStorage
    const savedCurrency = localStorage.getItem('bingo_display_currency') as Currency;
    if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'VES')) {
      setDisplayCurrency(savedCurrency);
    }
  }, []);

  const loadExchangeRates = async () => {
    try {
      const response = await fetch('/api/exchange-rates');
      const data = await response.json();
      
      if (data.success && data.rates) {
        const ratesMap: Record<string, number> = {};
        data.rates.forEach((rate: ExchangeRate) => {
          ratesMap[`${rate.from_currency}_${rate.to_currency}`] = rate.rate;
        });
        setExchangeRates(ratesMap);
      }
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      // Tasas por defecto
      setExchangeRates({
        'USD_VES': 36.50,
        'VES_USD': 0.0274
      });
    } finally {
      setIsLoading(false);
    }
  };

  const changeDisplayCurrency = (newCurrency: Currency) => {
    setDisplayCurrency(newCurrency);
    localStorage.setItem('bingo_display_currency', newCurrency);
  };

  const convert = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;
    
    const key = `${fromCurrency}_${toCurrency}`;
    const rate = exchangeRates[key] || 1;
    
    return amount * rate;
  };

  const formatAmount = (amount: number, currency: Currency): string => {
    const formatted = amount.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    if (currency === 'VES') {
      return `${formatted} Bs.`;
    }
    return `$${formatted}`;
  };

  const convertAndFormat = (amount: number, fromCurrency: Currency): string => {
    const converted = convert(amount, fromCurrency, displayCurrency);
    return formatAmount(converted, displayCurrency);
  };

  return {
    displayCurrency,
    changeDisplayCurrency,
    convert,
    formatAmount,
    convertAndFormat,
    isLoading,
    exchangeRates
  };
}
