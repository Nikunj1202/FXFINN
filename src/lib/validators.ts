import { z } from 'zod';

const amount = z.coerce.number().positive('Amount must be greater than zero.').finite();
const currency = z.string().length(3).default('INR');
export const transactionSchema = z.object({
  date: z.string().date(), type: z.enum(['income','expense','transfer','investment','debt_payment','asset_purchase','asset_sale']),
  category: z.string().trim().min(1).max(80), amount, currency, account_id: z.string().uuid().nullable().optional(), transfer_account_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(160).optional().default(''), notes: z.string().trim().max(2000).optional().default(''),
});
export const assetSchema = z.object({ name: z.string().trim().min(1).max(100), category: z.enum(['Cash','Bank Account','Stocks','ETF','Mutual Fund','Gold','Real Estate','Crypto','Business','Vehicle','Other']), purchase_value: z.coerce.number().min(0).finite(), current_value: z.coerce.number().min(0).finite(), purchase_date: z.string().date().nullable().optional(), quantity: z.coerce.number().nonnegative().nullable().optional(), currency, notes: z.string().max(2000).optional().default('') });
export const liabilitySchema = z.object({ name: z.string().trim().min(1).max(100), type: z.enum(['Credit Card','Personal Loan','Home Loan','Vehicle Loan','Education Loan','Business Loan','Other Debt']), original_amount: amount, outstanding_amount: z.coerce.number().min(0).finite(), interest_rate: z.coerce.number().min(0).max(100).default(0), monthly_payment: z.coerce.number().min(0).default(0), due_date: z.string().date().nullable().optional(), currency, notes: z.string().max(2000).optional().default('') });
export const goalSchema = z.object({ name: z.string().trim().min(1).max(120), goal_type: z.string().max(60).default('net_worth'), target_amount: amount, current_amount: z.coerce.number().min(0), target_date: z.string().date().nullable().optional(), priority: z.enum(['low','medium','high']).default('medium'), currency, notes: z.string().max(2000).optional().default('') });
export const allocationSchema = z.array(z.object({ category: z.string().trim().min(1).max(80), percentage: z.coerce.number().min(0).max(100), sort_order: z.number().int().nonnegative() })).max(20).refine(items => Math.abs(items.reduce((sum, item) => sum + item.percentage, 0) - 100) < 0.0001, 'Allocation percentages must total exactly 100%.');
