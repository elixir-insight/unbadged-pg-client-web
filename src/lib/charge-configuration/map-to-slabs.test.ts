import { describe, expect, it } from 'vitest';
import {
	mapChargeConfigurationRecords,
	mapChargeConfigurationsToSlabs,
	normalizeChargeType
} from './map-to-slabs';
import type { ChargeConfigurationItem } from './types';

describe('mapChargeConfigurationsToSlabs', () => {
	const configurations: ChargeConfigurationItem[] = [
		{
			id: '2',
			methodConfigId: '1',
			pipelineCode: 'TEST',
			vaNumber: 'TEST202610019122',
			baseAmount: '100000',
			chargeRate: '1.5',
			chargeType: 'PERCENTAGE',
			gstExclusive: false,
			gstPercentage: '18',
			effectiveFrom: '2026-07-28T09:07:14.96373Z',
			effectiveTo: ''
		},
		{
			id: '1',
			methodConfigId: '1',
			pipelineCode: 'TEST',
			vaNumber: 'TEST202610019122',
			baseAmount: '10000',
			chargeRate: '1.8',
			chargeType: 'PERCENTAGE',
			gstExclusive: true,
			gstPercentage: '18',
			effectiveFrom: '2026-07-28T09:07:14.96373Z',
			effectiveTo: ''
		},
		{
			id: '3',
			methodConfigId: '2',
			pipelineCode: 'TEST',
			vaNumber: 'TEST202610019122',
			baseAmount: '',
			chargeRate: '1.20',
			chargeType: 'FLAT',
			gstExclusive: false,
			gstPercentage: '0',
			effectiveFrom: '2026-07-28T09:07:14.96373Z',
			effectiveTo: ''
		}
	];

	it('maps and sorts charge configurations for a method config', () => {
		const configurations: ChargeConfigurationItem[] = [
			{
				id: '2',
				methodConfigId: '1',
				pipelineCode: 'TEST',
				vaNumber: 'TEST202610019122',
				baseAmount: '10000000',
				chargeRate: '1.5',
				chargeType: 'PERCENTAGE',
				gstExclusive: false,
				gstPercentage: '18',
				effectiveFrom: '2026-07-28T09:07:14.96373Z',
				effectiveTo: ''
			},
			{
				id: '1',
				methodConfigId: '1',
				pipelineCode: 'TEST',
				vaNumber: 'TEST202610019122',
				baseAmount: '2000',
				chargeRate: '1.8',
				chargeType: 'PERCENTAGE',
				gstExclusive: true,
				gstPercentage: '18',
				effectiveFrom: '2026-07-28T09:07:14.96373Z',
				effectiveTo: ''
			}
		];

		const section = mapChargeConfigurationsToSlabs(configurations, '1', 'TEST202610019122');

		expect(section.hasConfigurations).toBe(true);
		expect(section.slabs).toHaveLength(2);
		expect(section.slabs[0]?.baseAmount).toBe('20');
		expect(section.slabs[0]?.feeRate).toBe('1.8');
		expect(section.slabs[0]?.feeType).toBe('percentage');
		expect(section.slabs[1]?.baseAmount).toBe('100000');
		expect(section.slabs[1]?.feeRate).toBe('1.5');
		expect(section.effectiveFrom).toBe('2026-07-28');
	});

	it('normalizes and skips legacy open-ended upstream base amounts', () => {
		const section = mapChargeConfigurationsToSlabs(configurations, '2', 'TEST202610019122');

		expect(section.hasConfigurations).toBe(false);
		expect(section.slabs).toEqual([]);
	});

	it('returns empty section when no configs match', () => {
		const section = mapChargeConfigurationsToSlabs(configurations, '99');
		expect(section.hasConfigurations).toBe(false);
		expect(section.slabs).toEqual([]);
	});
});

describe('normalizeChargeType', () => {
	it('maps flat and percentage charge types', () => {
		expect(normalizeChargeType('FLAT')).toBe('flat');
		expect(normalizeChargeType('PERCENTAGE')).toBe('percentage');
	});
});

describe('mapChargeConfigurationRecords', () => {
	it('preserves raw upstream charge configuration records', () => {
		expect(
			mapChargeConfigurationRecords([
				{
					id: 1,
					methodConfigId: 1,
					pipelineCode: 'TEST',
					vaNumber: 'TEST202610019122',
					baseAmount: '5000',
					chargeRate: '180',
					chargeType: 'PERCENTAGE',
					gstExclusive: true,
					gstPercentage: '18',
					effectiveFrom: '2026-07-28T09:07:14.96373Z',
					effectiveTo: null
				}
			])
		).toEqual([
			{
				id: '1',
				methodConfigId: '1',
				pipelineCode: 'TEST',
				vaNumber: 'TEST202610019122',
				baseAmount: '5000',
				chargeRate: '1.8',
				chargeType: 'PERCENTAGE',
				gstExclusive: true,
				gstPercentage: '18',
				effectiveFrom: '2026-07-28T09:07:14.96373Z',
				effectiveTo: ''
			}
		]);
	});
});
