import { describe, expect, it } from 'vitest';
import {
	formatReferralBusinessType,
	parseReferralBusinessType,
	REFERRAL_BUSINESS_TYPES
} from './business-types';

describe('parseReferralBusinessType', () => {
	it('accepts known API business type values', () => {
		for (const option of REFERRAL_BUSINESS_TYPES) {
			expect(parseReferralBusinessType(option.value)).toBe(option.value);
		}
	});

	it('rejects unknown values', () => {
		expect(parseReferralBusinessType('INVALID')).toBeUndefined();
		expect(parseReferralBusinessType('')).toBeUndefined();
	});
});

describe('formatReferralBusinessType', () => {
	it('formats known business types for display', () => {
		expect(formatReferralBusinessType('SOLE_PROPRIETORSHIP')).toBe('Sole Proprietorship');
		expect(formatReferralBusinessType('LIMITED_LIABILITY_PARTNERSHIP')).toBe('LLP');
	});
});
