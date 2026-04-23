import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'VES';

interface CurrencyConfig {
  symbol: string;
  name: string;
  position: 'before' | 'after';
}

const CURRENCY_CONFIG: Record<Currency, CurrencyConfig> = {
  USD: {
    symbol: '$',
    name: 'Dólares',
    position: 'before'
  },
  VES: {
    symbol: 'BS',
    name: 'Bolívares Soberanos',
    position: 'before'
  }
};

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>('USD');

  // Cargar moneda desde localStorage al inicializar
  useEffect(() => {
    const savedCurrency = localStorage.getItem('bingo_currency') as Currency;
    if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'VES')) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Guardar moneda en localStorage cuando cambie
  const changeCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('bingo_currency', newCurrency);
  };

  // Función helper para formatear con moneda específica
  const formatCurrencyWithSymbol = (amount: number | string, targetCurrency: Currency): string => {
    // Validar que amount no sea undefined o null
    if (amount === undefined || amount === null) {
      const config = CURRENCY_CONFIG[targetCurrency] || CURRENCY_CONFIG['USD'];
      return `${config.symbol}0.00`;
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const config = CURRENCY_CONFIG[targetCurrency];

    // Validar que config existe
    if (!config) {
      console.error('Currency config not found for:', targetCurrency);
      // Usar USD como fallback solo si no se encuentra la config
      return `$0.00`;
    }

    if (isNaN(numAmount)) return `${config.symbol}0.00`;

    const formattedAmount = numAmount.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return config.position === 'before'
      ? `${config.symbol}${formattedAmount}`
      : `${formattedAmount} ${config.symbol}`;
  };

  // Formatear cantidad con símbolo de moneda (usa la moneda del usuario)
  const formatCurrency = (amount: number | string): string => {
    return formatCurrencyWithSymbol(amount, currency);
  };

  // Obtener solo el símbolo de moneda
  const getCurrencySymbol = (): string => {
    const config = CURRENCY_CONFIG[currency];
    return config ? config.symbol : '$';
  };

  // Obtener nombre de la moneda
  const getCurrencyName = (): string => {
    const config = CURRENCY_CONFIG[currency];
    return config ? config.name : 'USD';
  };

  return {
    currency,
    changeCurrency,
    formatCurrency,
    formatCurrencyWithSymbol,
    getCurrencySymbol,
    getCurrencyName,
    currencyConfig: CURRENCY_CONFIG[currency]
  };
}

// Función global para formatear con moneda específica (sin usar hook)
export function formatCurrencyWithSymbol(amount: number | string, targetCurrency: Currency): string {
  // Validar que amount no sea undefined o null
  if (amount === undefined || amount === null) {
    const config = CURRENCY_CONFIG[targetCurrency] || CURRENCY_CONFIG['USD'];
    return `${config.symbol}0.00`;
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const config = CURRENCY_CONFIG[targetCurrency];

  // Validar que config existe
  if (!config) {
    console.error('Currency config not found for:', targetCurrency);
    return '$0.00';
  }

  if (isNaN(numAmount)) return `${config.symbol}0.00`;

  const formattedAmount = numAmount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return config.position === 'before'
    ? `${config.symbol}${formattedAmount}`
    : `${formattedAmount} ${config.symbol}`;
}
