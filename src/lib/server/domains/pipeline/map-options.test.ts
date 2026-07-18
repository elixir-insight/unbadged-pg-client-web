import { describe, expect, it } from 'vitest';
import { toPipelineDropdownOptions } from './map-options';

describe('toPipelineDropdownOptions', () => {
	it('maps bankPipelineCode to value and name to label', () => {
		expect(
			toPipelineDropdownOptions({
				data: [
					{
						bankPipelineCode: '1234TET',
						name: 'BANK',
						allowedTransactionTypes: ['UPI', 'CARD', 'NET_BANKING']
					}
				],
				message: 'Pipelines fetched successfully',
				statusCode: 200
			})
		).toEqual([{ value: '1234TET', label: 'BANK' }]);
	});

	it('returns an empty list when data is missing', () => {
		expect(toPipelineDropdownOptions(null)).toEqual([]);
		expect(toPipelineDropdownOptions({ data: [], message: 'ok', statusCode: 200 })).toEqual([]);
	});
});
