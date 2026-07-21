import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { CollectionsTrendResponseSchema } from '../../schema';
import { mapCollectionsTrend } from './collections-trend';

describe('mapCollectionsTrend', () => {
	it('maps upstream string amounts into chart points', () => {
		const parsed = v.parse(CollectionsTrendResponseSchema, {
			data: [
				{
					date: '2026-07-14',
					grossAmount: '154000',
					netAmount: '149688',
					transactionCount: 42
				},
				{
					date: '2026-07-16',
					grossAmount: '181000',
					netAmount: '175932',
					transactionCount: 51
				}
			],
			message: 'Collections trend fetched successfully',
			statusCode: 200
		});

		expect(mapCollectionsTrend(parsed.data)).toEqual([
			{ label: '07-14', gross: 154000, net: 149688, transactionCount: 42 },
			{ label: '07-16', gross: 181000, net: 175932, transactionCount: 51 }
		]);
	});
});
