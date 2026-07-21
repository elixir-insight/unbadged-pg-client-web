import type { SingleResult } from '$lib/types/check-status';

/** Example API fixtures for verifying Single Transaction result card styling. */
export const SINGLE_TRANSACTION_FIXTURES = {
	success: {
		status: 'Success',
		transactionId: 'TXN-2024-AB12CD',
		amount: 25000,
		date: '2024-05-12T14:32:00Z',
		merchantName: 'VidyaTech Solutions'
	},
	pending: {
		status: 'Pending',
		transactionId: 'TXN-2024-EF34GH',
		amount: 12500,
		date: '2024-05-12T09:10:00Z',
		merchantName: 'Orion Retail Pvt Ltd'
	},
	failed: {
		status: 'Failed',
		transactionId: 'TXN-2024-IJ56KL',
		amount: 5000,
		date: '2024-05-11T18:45:00Z',
		merchantName: 'Northgate Traders',
		failureReason: 'Insufficient funds'
	}
} as const satisfies Record<string, SingleResult>;

/** Lookup keys for demo / manual testing in the Single Transaction tab. */
export const SINGLE_TRANSACTION_DEMO_KEYS = {
	success: 'TXN-2024-AB12CD',
	pending: 'TXN-2024-EF34GH',
	failed: 'TXN-2024-IJ56KL'
} as const;
