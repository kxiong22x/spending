import { useMemo } from 'react';
import useMonths from './useMonths';

// Returns the previous and next month keys (YYYY-MM) relative to the given month.
export function useMonthNavigation(yearMonth: string): {
  prevMonth: string | null;
  nextMonth: string | null;
} {
  const { months } = useMonths();

  return useMemo(() => {
    const sorted = [...months].sort();
    const i = sorted.indexOf(yearMonth);
    return {
      prevMonth: i > 0 ? sorted[i - 1] : null,
      nextMonth: i < sorted.length - 1 ? sorted[i + 1] : null,
    };
  }, [months, yearMonth]);
}
