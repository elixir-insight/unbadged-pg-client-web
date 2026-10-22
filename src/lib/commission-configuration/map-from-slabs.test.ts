import { describe, expect, it } from 'vitest';
import { mapSlabsToCommissionCreateItems } from './map-from-slabs';

describe('mapSlabsToCommissionCreateItems', () => {
	it('maps UI slabs to upstream commission create payload', () => {
		const items = mapSlabsToCommissionCreateItems(
			[
				{
					id: 'new-1',
					baseAmount: '50',
					feeType: 'flat',
					feeRate: '10',
					gstExclusive: true
				},
				{
					id: 'new-2',
					baseAmount: '100',
					feeType: 'percentage',
					feeRate: '2.5',
					gstExclusive: false
				}
			],
			{
				methodConfigId: '42',
				pipelineCode: 'TEST',
				vaNumber: 'VA123'
			},
			'18'
		);

		expect(items).toEqual([
			{
				baseAmount: '5000',
				commissionType: 'FLAT',
				feeRate: '10',
				gstExclusive: true,
				gstPercentage: '18',
				methodConfigId: 42,
				pipelineCode: 'TEST',
				vaNumber: 'VA123'
			},
			{
				baseAmount: '10000',
				commissionType: 'PERCENTAGE',
				feeRate: '250',
				gstExclusive: false,
				gstPercentage: '18',
				methodConfigId: 42,
				pipelineCode: 'TEST',
				vaNumber: 'VA123'
			}
		]);
	});
});
