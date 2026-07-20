import { describe, expect, it } from 'vitest';
import {
	createFreezeTransition,
	createPutOnHoldTransition,
	createReactivateTransition,
	statusChangeRequiresRemarks
} from './operational-status';

describe('operational status helpers', () => {
	it('requires remarks only for frozen status', () => {
		expect(statusChangeRequiresRemarks('FROZEN')).toBe(true);
		expect(statusChangeRequiresRemarks('ON_HOLD')).toBe(false);
		expect(statusChangeRequiresRemarks('ACTIVE')).toBe(false);
	});

	it('builds supported transitions', () => {
		expect(createPutOnHoldTransition()).toEqual({ current: 'ACTIVE', next: 'ON_HOLD' });
		expect(createFreezeTransition()).toEqual({ current: 'ON_HOLD', next: 'FROZEN' });
		expect(createReactivateTransition('ON_HOLD')).toEqual({ current: 'ON_HOLD', next: 'ACTIVE' });
		expect(createReactivateTransition('FROZEN')).toEqual({ current: 'FROZEN', next: 'ACTIVE' });
	});
});
