import { describe, expect, it } from 'vitest';
import { extractDirectorIds } from './director-ids';

describe('extractDirectorIds', () => {
	it('reads ids from an org record carrying directors', () => {
		const data = [{ directors: [{ id: 10 }, { id: '11' }] }];
		expect(extractDirectorIds(data, 2)).toEqual([10, 11]);
	});

	it('reads ids from a bare director list', () => {
		expect(extractDirectorIds([{ id: 7 }], 1)).toEqual([7]);
	});

	it('returns null when the counts do not line up', () => {
		expect(extractDirectorIds([{ directors: [{ id: 1 }] }], 2)).toBeNull();
	});

	it('returns null when an id is missing or the payload is unusable', () => {
		expect(extractDirectorIds([{ directors: [{ name: 'no id' }] }], 1)).toBeNull();
		expect(extractDirectorIds(null, 1)).toBeNull();
		expect(extractDirectorIds([], 1)).toBeNull();
	});
});
