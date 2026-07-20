import { describe, expect, it } from 'vitest';
import { resolveMethodConfigId } from './mock-method-configs';
import { resolveSlabFee, resolveSlabForAmount } from './slab-resolver';
import { createDefaultSlabRows } from './slab-validation';

describe('slab-resolver', () => {
	const slabs = createDefaultSlabRows();

	it('picks middle slab for ₹50,000 gross amount', () => {
		const slab = resolveSlabForAmount(slabs, 50_000);
		expect(slab?.feeRate).toBe('1.50');
	});

	it('computes gateway fee for ₹50,000 at 1.50%', () => {
		const fee = resolveSlabFee(50_000, slabs);
		expect(fee?.amount).toBe(750);
		expect(fee?.rateLabel).toBe('1.50%');
	});

	it('uses open-ended slab for amounts above highest threshold', () => {
		const slab = resolveSlabForAmount(slabs, 150_000);
		expect(slab?.feeRate).toBe('1.20');
	});

	it('resolves method config id for valid path', () => {
		const id = resolveMethodConfigId({
			pipeline: 'omiware',
			method: 'payins',
			instrument: 'CREDIT',
			paymentRails: 'VISA'
		});
		expect(id).toBe('mc-001');
	});
});
