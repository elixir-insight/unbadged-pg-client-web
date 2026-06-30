import type { TransferMethod } from '../types';

export const transferMethods: TransferMethod[] = [
	{
		id: 'IMPS',
		label: 'IMPS',
		description: 'Instant transfer',
		limitLabel: '≤ ₹5L per txn',
		icon: 'zap',
		info: 'Immediate credit, available 24×7 including holidays.'
	},
	{
		id: 'NEFT',
		label: 'NEFT',
		description: 'Hourly batch',
		limitLabel: 'No limit',
		icon: 'clock',
		info: 'Settled in hourly batches during banking hours.'
	},
	{
		id: 'RTGS',
		label: 'RTGS',
		description: 'Real-time gross',
		limitLabel: 'Min ₹2L',
		icon: 'landmark',
		info: 'High-value real-time settlement for large transfers.'
	},
	{
		id: 'UPI',
		label: 'UPI',
		description: 'Instant VPA',
		limitLabel: '≤ ₹1L per txn',
		icon: 'smartphone',
		info: 'Transfer to a UPI ID or VPA instantly.'
	}
];
