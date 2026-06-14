export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  source: string;
  card_id: number | null;
}

export interface CustomCategory {
  name: string;
  is_recurring: 0 | 1;
}

export interface Card {
  id: number;
  name: string;
}

export interface CsvRow {
  date: string;
  amount: number;
  description: string;
  raw_category: string | null;
}

export interface CardRows {
  cardId: number;
  rows: CsvRow[];
}

export interface CategoryWithTransactions {
  name: string;
  txs: Transaction[];
  total: number;
}
