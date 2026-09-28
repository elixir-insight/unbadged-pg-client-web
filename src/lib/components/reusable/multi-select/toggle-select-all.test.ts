import { describe, expect, it } from 'vitest';
import { areAllSelected, toggleSelectAllValues } from './toggle-select-all';

const methods = ['UPI', 'CARD', 'NETBANKING'];

describe('toggleSelectAllValues', () => {
	it('selects every enabled option when none are selected', () => {
		expect(toggleSelectAllValues([], methods)).toEqual(methods);
	});

	it('selects remaining enabled options when some are already selected', () => {
		expect(toggleSelectAllValues(['UPI'], methods)).toEqual(['UPI', 'CARD', 'NETBANKING']);
	});

	it('clears every enabled option when all are selected', () => {
		expect(toggleSelectAllValues(methods, methods)).toEqual([]);
	});

	it('leaves values that are not in the enabled list unchanged', () => {
		expect(toggleSelectAllValues(['OTHER', 'UPI', 'CARD', 'NETBANKING'], methods)).toEqual([
			'OTHER'
		]);
	});
});

describe('areAllSelected', () => {
	it('is true only when every enabled option is selected', () => {
		expect(areAllSelected([], methods)).toBe(false);
		expect(areAllSelected(['UPI'], methods)).toBe(false);
		expect(areAllSelected(methods, methods)).toBe(true);
		expect(areAllSelected(methods, [])).toBe(false);
	});
});
