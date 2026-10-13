import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateAgainstUSD: number;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateAgainstUSD: 1.0, locale: 'en-US' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateAgainstUSD: 86.5, locale: 'en-IN' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateAgainstUSD: 0.92, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateAgainstUSD: 0.78, locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateAgainstUSD: 152.0, locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateAgainstUSD: 1.38, locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateAgainstUSD: 1.54, locale: 'en-AU' },
};

interface CurrencyContextType {
  currentCurrency: CurrencyConfig;
  setCurrency: (code: string) => void;
  formatAmount: (amountInUSD: number | undefined | null) => string;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift+H to toggle privacy blur
      if (e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        setIsPrivacyMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentCurrency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;

  const setCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyCode(code);
    }
  };

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => !prev);
  };

  const formatAmount = (amountInUSD: number | undefined | null): string => {
    if (amountInUSD === undefined || amountInUSD === null || isNaN(amountInUSD)) {
      return `${currentCurrency.symbol}0.00`;
    }

    if (isPrivacyMode) {
      return '••••••';
    }

    const converted = amountInUSD * currentCurrency.rateAgainstUSD;
    const isNegative = converted < 0;
    const absVal = Math.abs(converted);

    // Format with locale
    const formatted = new Intl.NumberFormat(currentCurrency.locale, {
      minimumFractionDigits: currentCurrency.code === 'JPY' ? 0 : 2,
      maximumFractionDigits: currentCurrency.code === 'JPY' ? 0 : 2,
    }).format(absVal);

    return isNegative ? `-${currentCurrency.symbol}${formatted}` : `${currentCurrency.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        setCurrency,
        formatAmount,
        isPrivacyMode,
        togglePrivacyMode,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
