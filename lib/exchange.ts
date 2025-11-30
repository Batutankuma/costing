// Simple exchange utilities used by stock actions
export async function getCurrentRate(from: string, to: string): Promise<number> {
  // Placeholder: return 1 for same currency, otherwise a fixed demo rate
  if (from === to) return 1;
  return 1; // Adjust with real provider if needed
}

export function convert(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}


