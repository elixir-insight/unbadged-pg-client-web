import { describe, expect, it } from 'vitest';
import { calculateFeePreview } from './preview-calculator';
import {
	createCommissionDefaultSlabs,
	createDefaultSlabRows,
	createPartnerDefaultSlabs,
	suggestNextSlabBaseAmount,
	validateSlabs
} from './slab-validation';

describe('slab-validation', () => {
	it('accepts valid bounded slabs', () => {
		const result = validateSlabs(createDefaultSlabRows());
		expect(result.valid).toBe(true);
	});

	it('accepts non-ascending base amounts', () => {
		const slabs = createDefaultSlabRows();
		slabs[0].baseAmount = '100';
		slabs[1].baseAmount = '50';
		const result = validateSlabs(slabs);
		expect(result.valid).toBe(true);
	});

	it('accepts duplicate base amounts', () => {
		const slabs = createDefaultSlabRows();
		slabs[1].baseAmount = '10000';
		const result = validateSlabs(slabs);
		expect(result.valid).toBe(true);
	});

	it('rejects rows without base amount', () => {
		const slabs = createDefaultSlabRows();
		slabs[0].baseAmount = '';
		const result = validateSlabs(slabs);
		expect(result.valid).toBe(false);
	});

	it('suggests the next base amount from the highest slab', () => {
		expect(suggestNextSlabBaseAmount(createDefaultSlabRows())).toBe('1000000');
	});
});

describe('preview-calculator', () => {
	it('computes net amount for mockup example', () => {
		const breakdown = calculateFeePreview(
			50_000,
			createDefaultSlabRows(),
			createCommissionDefaultSlabs(),
			createPartnerDefaultSlabs()
		);
		expect(breakdown.gatewayFee?.amount).toBe(750);
		expect(breakdown.commissionFee?.amount).toBe(125);
		expect(breakdown.partnerFee?.amount).toBe(50);
		expect(breakdown.netAmount).toBe(49_075);
		expect(breakdown.retainedPercent).toBeCloseTo(98.15, 2);
	});
});
