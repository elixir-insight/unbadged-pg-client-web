import { describe, expect, it } from 'vitest';
import {
	chargeBaseAmountsMatch,
	coerceBaseAmountValue,
	denormalizeChargeBaseAmountToApi,
	isOpenEndedChargeBaseAmount,
	normalizeChargeBaseAmountFromApi,
	toChargeBaseAmountDisplay
} from './base-amount';

describe('charge-configuration base amount', () => {
	it('detects legacy open-ended upstream values', () => {
		expect(isOpenEndedChargeBaseAmount('')).toBe(true);
		expect(isOpenEndedChargeBaseAmount('-1')).toBe(true);
		expect(isOpenEndedChargeBaseAmount('10000')).toBe(false);
	});

	it('formats scaled upstream amounts for slab display', () => {
		expect(toChargeBaseAmountDisplay('2000')).toBe('20');
		expect(toChargeBaseAmountDisplay('5000')).toBe('50');
		expect(toChargeBaseAmountDisplay('100000')).toBe('1000');
		expect(toChargeBaseAmountDisplay('5000.00')).toBe('50');
	});

	it('keeps already-formatted UI amounts unchanged', () => {
		expect(toChargeBaseAmountDisplay('20')).toBe('20');
		expect(toChargeBaseAmountDisplay('50')).toBe('50');
		expect(toChargeBaseAmountDisplay('99')).toBe('99');
	});

	it('denormalizes UI amounts back to upstream integers', () => {
		expect(denormalizeChargeBaseAmountToApi('10000')).toBe('1000000');
		expect(denormalizeChargeBaseAmountToApi('10')).toBe('1000');
	});

	it('matches display and raw API base amounts', () => {
		expect(chargeBaseAmountsMatch('20', '2000')).toBe(true);
		expect(chargeBaseAmountsMatch('50', '5000')).toBe(true);
		expect(chargeBaseAmountsMatch('50', '50')).toBe(true);
		expect(chargeBaseAmountsMatch('1000', '100000')).toBe(true);
		expect(chargeBaseAmountsMatch('1000', '1000')).toBe(true);
	});

	it('normalizes legacy open-ended values for UI slabs', () => {
		expect(normalizeChargeBaseAmountFromApi('-1')).toBe('');
	});

	it('coerces numeric upstream values', () => {
		expect(coerceBaseAmountValue(1000000)).toBe('1000000');
	});
});
