import type { VirtualAccount } from '../types';

export const virtualAccounts: VirtualAccount[] = [
	{
		id: 'va-001',
		name: 'Operations A/C',
		accountNumber: '8901234567890123',
		balance: 48_75_000,
		limit: 50_00_000,
		type: 'Corporate',
		icon: 'briefcase'
	},
	{
		id: 'va-002',
		name: 'Payroll A/C',
		accountNumber: '8901234567890456',
		balance: 22_40_000,
		limit: 25_00_000,
		type: 'Payroll',
		icon: 'users'
	},
	{
		id: 'va-003',
		name: 'Vendor Payments',
		accountNumber: '8901234567890789',
		balance: 15_60_000,
		limit: 20_00_000,
		type: 'Vendor',
		icon: 'handshake'
	},
	{
		id: 'va-004',
		name: 'Petty Cash A/C',
		accountNumber: '8901234567891011',
		balance: 1_85_000,
		limit: 2_00_000,
		type: 'Expense',
		icon: 'coins'
	},
	{
		id: 'va-005',
		name: 'Marketing Escrow',
		accountNumber: '8901234567891213',
		balance: 8_20_000,
		limit: 10_00_000,
		type: 'Corporate',
		icon: 'trending-up'
	},
	{
		id: 'va-006',
		name: 'HR Reimbursements',
		accountNumber: '8901234567891415',
		balance: 3_45_000,
		limit: 5_00_000,
		type: 'Payroll',
		icon: 'receipt'
	},
	{
		id: 'va-007',
		name: 'GST Collections',
		accountNumber: '8901234567891617',
		balance: 12_30_000,
		limit: 15_00_000,
		type: 'Collections',
		icon: 'landmark'
	},
	{
		id: 'va-008',
		name: 'Treasury Reserve',
		accountNumber: '8901234567891819',
		balance: 1_25_00_000,
		limit: 1_50_00_000,
		type: 'Treasury',
		icon: 'wallet'
	},
	{
		id: 'va-009',
		name: 'Advance Salary',
		accountNumber: '8901234567892021',
		balance: 6_75_000,
		limit: 8_00_000,
		type: 'Payroll',
		icon: 'banknote'
	},
	{
		id: 'va-010',
		name: 'Office Expenses',
		accountNumber: '8901234567892223',
		balance: 4_10_000,
		limit: 6_00_000,
		type: 'Expense',
		icon: 'building-2'
	},
	{
		id: 'va-011',
		name: 'Client Refunds',
		accountNumber: '8901234567892425',
		balance: 9_80_000,
		limit: 12_00_000,
		type: 'Collections',
		icon: 'rotate-ccw'
	},
	{
		id: 'va-012',
		name: 'Insurance Premium',
		accountNumber: '8901234567892627',
		balance: 2_90_000,
		limit: 4_00_000,
		type: 'Vendor',
		icon: 'shield'
	}
];
