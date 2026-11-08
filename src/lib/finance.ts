export type MoneyLike = string | number | null | undefined;
export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment' | 'debt_payment' | 'asset_purchase' | 'asset_sale';

// Financial amounts arrive from PostgreSQL NUMERIC as strings. Convert to integer minor units
// before arithmetic to avoid binary floating-point drift in user-visible totals.
export function toMinor(value: MoneyLike, fractionDigits = 2): bigint {
  const raw = String(value ?? '0').trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) throw new Error('Invalid monetary amount.');
  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [whole, fraction = ''] = unsigned.split('.');
  const scaled = BigInt(whole) * (10n ** BigInt(fractionDigits)) + BigInt((fraction + '0'.repeat(fractionDigits)).slice(0, fractionDigits));
  return negative ? -scaled : scaled;
}
export function fromMinor(value: bigint, fractionDigits = 2): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(fractionDigits);
  const whole = abs / base;
  const fraction = String(abs % base).padStart(fractionDigits, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}
export function sumMoney(values: MoneyLike[]): string {
  return fromMinor(values.reduce((sum, value) => sum + toMinor(value), 0n));
}
export function calculateNetWorth(totalAssets: MoneyLike, totalLiabilities: MoneyLike): string {
  return fromMinor(toMinor(totalAssets) - toMinor(totalLiabilities));
}
export function calculateSavingsRate(income: MoneyLike, expenses: MoneyLike): number {
  const i = toMinor(income); if (i <= 0n) return 0;
  const e = toMinor(expenses);
  return Number(((i - e) * 10000n / i)) / 100;
}
export function calculateROI(purchaseValue: MoneyLike, currentValue: MoneyLike): number {
  const purchase = toMinor(purchaseValue); if (purchase <= 0n) return 0;
  return Number((toMinor(currentValue) - purchase) * 10000n / purchase) / 100;
}
export function calculateGoalProgress(current: MoneyLike, target: MoneyLike): number {
  const t = toMinor(target); if (t <= 0n) return 0;
  return Math.max(0, Math.min(100, Number(toMinor(current) * 10000n / t) / 100));
}
export function calculateDebtToAssetRatio(liabilities: MoneyLike, assets: MoneyLike): number {
  const a = toMinor(assets); if (a <= 0n) return 0;
  return Number(toMinor(liabilities) * 10000n / a) / 100;
}
export function calculateAllocation(income: MoneyLike, percentages: number[]) {
  const total = percentages.reduce((sum, p) => sum + p, 0);
  const minorIncome = toMinor(income);
  return { totalPercentage: total, valid: Math.abs(total - 100) < 0.0001, amounts: percentages.map(p => fromMinor(minorIncome * BigInt(Math.round(p * 10000)) / 1000000n)) };
}
export function calculateWealthScore(input: { savingsRate: number; debtToAssetRatio: number; emergencyFundMonths: number; netWorthGrowthPercent: number; investmentShare: number }): { score: number; components: { name: string; score: number; weight: number }[] } {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const components = [
    { name: 'Savings rate', score: clamp(input.savingsRate * 2), weight: 25 },
    { name: 'Debt health', score: clamp(100 - input.debtToAssetRatio), weight: 20 },
    { name: 'Emergency fund', score: clamp(input.emergencyFundMonths / 6 * 100), weight: 20 },
    { name: 'Net worth growth', score: clamp(50 + input.netWorthGrowthPercent * 2), weight: 20 },
    { name: 'Investment allocation', score: clamp(input.investmentShare / 0.5 * 100), weight: 15 },
  ];
  const score = Math.round(components.reduce((sum, item) => sum + item.score * item.weight / 100, 0));
  return { score, components };
}
export function calculateLevel(netWorth: MoneyLike, levels: { name: string; min_net_worth: MoneyLike; color: string }[]) {
  const amount = toMinor(netWorth);
  return [...levels].sort((a, b) => toMinor(a.min_net_worth) > toMinor(b.min_net_worth) ? -1 : 1).find(level => amount >= toMinor(level.min_net_worth)) ?? null;
}
export function formatINR(value: MoneyLike, currency = 'INR') {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}
