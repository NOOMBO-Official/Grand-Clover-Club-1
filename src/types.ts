export type SymbolType = 'cherry' | 'lemon' | 'diamond' | 'seven' | 'jackpot';

export interface ReelSymbol {
  id: string;
  type: SymbolType;
}

export const PAYTABLE: Record<string, number> = {
  'jackpot,jackpot,jackpot': 5000,
  'seven,seven,seven': 500,
  'diamond,diamond,diamond': 100,
  'lemon,lemon,lemon': 50,
  'cherry,cherry,cherry': 20,
};
