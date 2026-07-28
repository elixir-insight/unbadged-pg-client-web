import { describe, expect, it } from 'vitest';
import { formatLabel } from './format-label';

describe('formatLabel', () => {
	it('title-cases snake_case enum values', () => {
		expect(formatLabel('DEBIT_CARD')).toBe('Debit Card');
		expect(formatLabel('CREDIT_CARD')).toBe('Credit Card');
		expect(formatLabel('NET_BANKING')).toBe('Net Banking');
	});

	it('preserves common payment acronyms', () => {
		expect(formatLabel('UPI')).toBe('UPI');
		expect(formatLabel('upi')).toBe('UPI');
	});

	it('returns em dash for empty values', () => {
		expect(formatLabel('')).toBe('—');
		expect(formatLabel('—')).toBe('—');
	});
});
