import { describe, expect, it } from 'vitest';
import { extractDirectorIds } from './director-ids';

const ada = { pan: 'PQRST2345P', email: 'ada@acme.test' };
const bo = { pan: 'PQRST2345Q', email: 'bo@acme.test' };

describe('extractDirectorIds', () => {
	it('reads ids from an org record carrying directors, by position when nothing else matches', () => {
		const data = [{ directors: [{ id: 10 }, { id: '11' }] }];
		expect(extractDirectorIds(data, [ada, bo])).toEqual([10, 11]);
	});

	it('reads ids from a bare director list', () => {
		expect(extractDirectorIds([{ id: 7 }], [ada])).toEqual([7]);
	});

	it('matches by PAN, then email, even when upstream holds extra directors', () => {
		const data = [
			{
				directors: [
					{ id: 1, pan: 'OLDPN1234X', email: 'old@acme.test' },
					{ id: 2, pan: 'pqrst2345q', email: 'x@acme.test' },
					{ id: 3, pan: 'XXXXX2345P', email: 'ADA@acme.test' }
				]
			}
		];
		expect(extractDirectorIds(data, [ada, bo])).toEqual([3, 2]);
	});

	it('keeps an id the director already has', () => {
		const data = [{ directors: [{ id: 5, pan: 'OTHER' }, { id: 9, pan: 'OTHER2' }, { id: 4 }] }];
		expect(extractDirectorIds(data, [{ ...ada, id: 9 }])).toEqual([9]);
	});

	it('returns null when a director cannot be matched and the counts differ', () => {
		expect(extractDirectorIds([{ directors: [{ id: 1 }] }], [ada, bo])).toBeNull();
	});

	it('returns null when an id is missing or the payload is unusable', () => {
		expect(extractDirectorIds([{ directors: [{ name: 'no id' }] }], [ada])).toBeNull();
		expect(extractDirectorIds(null, [ada])).toBeNull();
		expect(extractDirectorIds([], [ada])).toBeNull();
	});
});

describe('extractDirectorIds with masked PANs', () => {
	it('matches by email, not by the masked PAN every director shares', () => {
		const masked = '**********';
		const upstream = [
			{ id: 11, pan: masked, email: 'bo@x.test' },
			{ id: 12, pan: masked, email: 'ada@x.test' }
		];
		const local = [
			{ pan: masked, email: 'ADA@x.test' },
			{ pan: masked, email: 'bo@x.test' }
		];
		expect(extractDirectorIds([{ directors: upstream }], local)).toEqual([12, 11]);
	});
});
