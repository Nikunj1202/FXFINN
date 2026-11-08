import { describe, expect, it } from 'vitest';
import { calculateAllocation, calculateGoalProgress, calculateNetWorth, calculateROI, calculateSavingsRate, sumMoney, toMinor } from '../src/lib/finance';

describe('FXFINN financial calculations', () => {
  it('uses integer minor units for exact decimal addition', () => {
    expect(sumMoney(['0.10', '0.20', '100.25'])).toBe('100.55');
    expect(toMinor('123.45')).toBe(12345n);
  });
  it('calculates net worth as assets less liabilities', () => {
    expect(calculateNetWorth('2000000.00', '500000.00')).toBe('1500000.00');
    expect(calculateNetWorth('100.00', '250.00')).toBe('-150.00');
  });
  it('calculates savings rate and protects zero income', () => {
    expect(calculateSavingsRate('100000', '70000')).toBe(30);
    expect(calculateSavingsRate('0', '10')).toBe(0);
  });
  it('calculates ROI and handles zero purchase value', () => {
    expect(calculateROI('1000', '1250')).toBe(25);
    expect(calculateROI('0', '100')).toBe(0);
  });
  it('clamps goal progress and calculates allocation values', () => {
    expect(calculateGoalProgress('650000', '1000000')).toBe(65);
    expect(calculateGoalProgress('110', '100')).toBe(100);
    const allocation = calculateAllocation('100000', [20, 30, 50]);
    expect(allocation.valid).toBe(true);
    expect(allocation.amounts).toEqual(['20000.00', '30000.00', '50000.00']);
  });
});
