import React, { useEffect, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';

interface AnimatedAmountProps {
  value: number;
  className?: string;
  duration?: number;
}

export const AnimatedAmount: React.FC<AnimatedAmountProps> = ({
  value,
  className = '',
  duration = 450,
}) => {
  const { formatAmount } = useCurrency();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const diff = value - startValue;

    if (Math.abs(diff) < 0.01) {
      setDisplayValue(value);
      return;
    }

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth cubic ease-out curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + diff * easeProgress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return (
    <span className={`tabular transition-colors ${className}`}>
      {formatAmount(displayValue)}
    </span>
  );
};
