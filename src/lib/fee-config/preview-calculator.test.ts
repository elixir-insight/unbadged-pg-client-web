import { describe, expect, it } from 'vitest';
import { calculateFeePreview } from './preview-calculator';
import {
	createCommissionDefaultSlabs,
	createDefaultSlabRows,
	createPartnerDefaultSlabs,
	validateSlabs
} from './slab-validation';

describe('slab-validation', () => {
	it('accepts valid ascending slabs with open-ended last row', () => {
		const result = validateSlabs(createDefaultSlabRows());
		expect(result.valid).toBe(true);
	});

	it('rejects duplicate thresholds', () => {
		const slabs = createDefaultSlabRows();
		slabs[1].baseAmount = '10000';
		const result = validateSlabs(slabs);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('rejects missing open-ended row', () => {
		const slabs = createDefaultSlabRows().filter((slab) => slab.baseAmount !== '');
		const result = validateSlabs(slabs);
		expect(result.valid).toBe(false);
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
