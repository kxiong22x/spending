import { useState, useEffect } from 'react';
import { parseAllMonthsForCards, FileResult } from '../utils/csv';
import { Card, CardRows } from '@shared/types';

export interface ParsedMonths {
  monthMap: Map<string, CardRows[]>;
  fileResults: FileResult[];
  totalParseErrors: number;
  monthFileCounts: Map<string, number>;
}

// Parses uploaded CSV files for each card whenever the file selection changes.
export default function useParsedMonths(
  cards: Card[],
  cardFiles: Record<number, File[]>
): ParsedMonths | null {
  const [parsed, setParsed] = useState<ParsedMonths | null>(null);

  useEffect(() => {
    const hasFiles = cards.some(c => cardFiles[c.id]?.length > 0);
    if (!hasFiles) {
      setParsed(null);
      return;
    }
    parseAllMonthsForCards(cards, cardFiles).then(setParsed);
  }, [cardFiles, cards]);

  return parsed;
}
