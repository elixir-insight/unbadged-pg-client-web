import { describe, expect, it } from 'vitest';
import type { FeeSlabRow } from '$lib/fee-config/types';
import {
	denormalizeChargeType,
	feeSlabsContentEqual,
	hasChargeConfigurationChanges,
	hasUnsavedFeeConfigurationChanges,
	isPersistedChargeConfigurationId,
	mapSlabsToCreateItems,
	mapSlabToUpdatePayload,
	slabChangedFromBaseline
} from './map-from-slabs';
import type { ChargeConfigurationItem } from './types';

const slabs: FeeSlabRow[] = [
	{
		id: '1',
		baseAmount: '10000',
		feeType: 'percentage',
		feeRate: '1.80',
		gstExclusive: true
	},
	{
		id: '2',
		baseAmount: '100000',
		feeType: 'percentage',
		feeRate: '1.50',
		gstExclusive: false
	}
];

describe('map-from-slabs', () => {
	it('maps slabs to create payload items', () => {
		expect(
			mapSlabsToCreateItems(slabs, {
				methodConfigId: '1',
				pipelineCode: 'TEST',
				vaNumber: 'TEST202610019122'
			})
		).toEqual([
			{
				baseAmount: '1000000',
				chargeRate: '180',
				chargeType: 'PERCENTAGE',
				gstExclusive: true,
				gstPercentage: '0',
				methodConfigId: 1,
				pipelineCode: 'TEST',
				vaNumber: 'TEST202610019122'
			},
			{
				baseAmount: '10000000',
				chargeRate: '150',
				chargeType: 'PERCENTAGE',
				gstExclusive: false,
				gstPercentage: '0',
				methodConfigId: 1,
				pipelineCode: 'TEST',
				vaNumber: 'TEST202610019122'
			}
		]);
	});

	it('maps a slab to patch payload', () => {
		expect(mapSlabToUpdatePayload(slabs[0], slabs, '18')).toEqual({
			baseAmount: '1000000',
			chargeRate: '180',
			chargeType: 'PERCENTAGE',
			gstExclusive: true,
			gstPercentage: '18'
		});
	});

	it('detects persisted charge configuration ids', () => {
		expect(isPersistedChargeConfigurationId('12')).toBe(true);
		expect(isPersistedChargeConfigurationId('slab-12')).toBe(false);
	});

	it('detects base amount changes against baseline', () => {
		const baseline: ChargeConfigurationItem = {
			id: '2',
			methodConfigId: '1',
			pipelineCode: 'TEST',
			vaNumber: 'TEST202610019122',
			baseAmount: '10000000',
			chargeRate: '1.5',
			chargeType: 'PERCENTAGE',
			gstExclusive: false,
			gstPercentage: '18',
			effectiveFrom: '',
			effectiveTo: ''
		};

		expect(slabChangedFromBaseline({ ...slabs[1], baseAmount: '1000' }, slabs, baseline)).toBe(
			true
		);
	});

	it('detects slab changes against baseline', () => {
		const baseline: ChargeConfigurationItem = {
			id: '1',
			methodConfigId: '1',
			pipelineCode: 'TEST',
			vaNumber: 'TEST202610019122',
			baseAmount: '1000000',
			chargeRate: '1.8',
			chargeType: 'PERCENTAGE',
			gstExclusive: true,
			gstPercentage: '18',
			effectiveFrom: '',
			effectiveTo: ''
		};

		expect(slabChangedFromBaseline(slabs[0], slabs, baseline)).toBe(false);
		expect(slabChangedFromBaseline({ ...slabs[0], feeRate: '2.00' }, slabs, baseline)).toBe(true);
	});

	it('denormalizes fee types', () => {
		expect(denormalizeChargeType('flat')).toBe('FLAT');
		expect(denormalizeChargeType('percentage')).toBe('PERCENTAGE');
	});

	it('detects charge configuration changes', () => {
		const baseline: ChargeConfigurationItem = {
			id: '1',
			methodConfigId: '1',
			pipelineCode: 'TEST',
			vaNumber: 'TEST202610019122',
			baseAmount: '1000000',
			chargeRate: '1.8',
			chargeType: 'PERCENTAGE',
			gstExclusive: true,
			gstPercentage: '18',
			effectiveFrom: '',
			effectiveTo: ''
		};

		expect(hasChargeConfigurationChanges(slabs, [baseline])).toBe(true);
		expect(hasChargeConfigurationChanges([slabs[0]], [baseline])).toBe(false);
		expect(hasChargeConfigurationChanges([{ ...slabs[0], feeRate: '2.00' }], [baseline])).toBe(
			true
		);
		expect(
			hasChargeConfigurationChanges(
				[
					...slabs,
					{ id: 'slab-new', baseAmount: '0', feeType: 'flat', feeRate: '10', gstExclusive: true }
				],
				[baseline]
			)
		).toBe(true);
	});

	it('compares slab content for draft baselines', () => {
		expect(feeSlabsContentEqual(slabs, cloneSlabs(slabs))).toBe(true);
		expect(feeSlabsContentEqual(slabs, [{ ...slabs[0], feeRate: '2.00' }, slabs[1]])).toBe(false);
	});

	it('enables save for first-time setup and after edits', () => {
		const baseline: ChargeConfigurationItem = {
			id: '1',
			methodConfigId: '1',
			pipelineCode: 'TEST',
			vaNumber: 'TEST202610019122',
			baseAmount: '1000000',
			chargeRate: '1.8',
			chargeType: 'PERCENTAGE',
			gstExclusive: true,
			gstPercentage: '18',
			effectiveFrom: '',
			effectiveTo: ''
		};

		expect(hasUnsavedFeeConfigurationChanges(createDefaultSlabs(), [], [], false)).toBe(true);
		expect(hasUnsavedFeeConfigurationChanges([slabs[0]], [slabs[0]], [baseline], true)).toBe(false);
		expect(
			hasUnsavedFeeConfigurationChanges(
				[{ ...slabs[0], feeRate: '2.00' }],
				[slabs[0]],
				[baseline],
				true
			)
		).toBe(true);
	});
});

function cloneSlabs(rows: FeeSlabRow[]): FeeSlabRow[] {
	return rows.map((row) => ({ ...row }));
}

function createDefaultSlabs(): FeeSlabRow[] {
	return [
		{
			id: 'slab-1',
			baseAmount: '0',
			feeType: 'percentage',
			feeRate: '0',
			gstExclusive: true
		}
	];
}
