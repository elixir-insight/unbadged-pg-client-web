import { describe, expect, it } from 'vitest';
import {
	coerceRateValue,
	denormalizeChargeRateToApi,
	normalizeChargeRateFromApi
} from './charge-rate';

describe('charge-rate', () => {
	it('converts percentage charge rates from API integers to UI decimals', () => {
		expect(normalizeChargeRateFromApi('250', 'PERCENTAGE')).toBe('2.5');
		expect(normalizeChargeRateFromApi('180', 'PERCENTAGE')).toBe('1.8');
		expect(normalizeChargeRateFromApi(150, 'PERCENTAGE')).toBe('1.5');
	});

	it('keeps decimal display values unchanged', () => {
		expect(normalizeChargeRateFromApi('1.8', 'PERCENTAGE')).toBe('1.8');
		expect(normalizeChargeRateFromApi('2.5', 'PERCENTAGE')).toBe('2.5');
	});

	it('converts percentage UI decimals back to API integers', () => {
		expect(denormalizeChargeRateToApi('2.5', 'percentage')).toBe('250');
		expect(denormalizeChargeRateToApi('1.8', 'percentage')).toBe('180');
	});

	it('leaves flat rates unchanged', () => {
		expect(normalizeChargeRateFromApi('250', 'FLAT')).toBe('250');
		expect(normalizeChargeRateFromApi(250, 'FLAT')).toBe('250');
		expect(denormalizeChargeRateToApi('250', 'flat')).toBe('250');
	});

	it('coerces numeric upstream values', () => {
		expect(coerceRateValue(180)).toBe('180');
	});
});
