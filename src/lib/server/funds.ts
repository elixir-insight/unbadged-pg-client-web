import type { BankAccount, VirtualAccount, Transaction } from '$lib/types/funds';

export const BANK_ACCOUNTS: BankAccount[] = [
	{
		id: 'ba1',
		bankName: 'HDFC Bank',
		accountHolderName: 'ElixirPay Technologies Pvt Ltd',
		accountNumber: '****7842',
		ifsc: 'HDFC0001234',
		branchName: 'Koramangala, Bengaluru',
		accountType: 'Current',
		usage: 'PayIn & Payout'
	},
	{
		id: 'ba2',
		bankName: 'ICICI Bank',
		accountHolderName: 'ElixirPay Technologies Pvt Ltd',
		accountNumber: '****3391',
		ifsc: 'ICIC0002567',
		branchName: 'MG Road, Bengaluru',
		accountType: 'Current',
		usage: 'PayIn'
	},
	{
		id: 'ba3',
		bankName: 'Axis Bank',
		accountHolderName: 'ElixirPay Technologies Pvt Ltd',
		accountNumber: '****5509',
		ifsc: 'UTIB0003892',
		branchName: 'Indiranagar, Bengaluru',
		accountType: 'Current',
		usage: 'Payout'
	},
	{
		id: 'ba4',
		bankName: 'State Bank of India',
		accountHolderName: 'ElixirPay Technologies Pvt Ltd',
		accountNumber: '****8823',
		ifsc: 'SBIN0010045',
		branchName: 'Church Street, Bengaluru',
		accountType: 'Current',
		usage: 'PayIn & Payout'
	},
	{
		id: 'ba5',
		bankName: 'Kotak Mahindra Bank',
		accountHolderName: 'ElixirPay Technologies Pvt Ltd',
		accountNumber: '****2210',
		ifsc: 'KKBK0004123',
		branchName: 'Whitefield, Bengaluru',
		accountType: 'Current',
		usage: 'PayIn'
	},
	{
		id: 'ba6',
		bankName: 'Yes Bank',
		accountHolderName: 'ElixirPay Technologies Pvt Ltd',
		accountNumber: '****6647',
		ifsc: 'YESB0000789',
		branchName: 'Electronic City, Bengaluru',
		accountType: 'Savings',
		usage: 'Payout'
	}
];

export const VIRTUAL_ACCOUNTS: VirtualAccount[] = [
	{
		id: 'va1',
		virtualAccountNumber: 'VA00192837465',
		bankName: 'HDFC Bank',
		status: 'Active',
		usage: 'PayIn'
	},
	{
		id: 'va2',
		virtualAccountNumber: 'VA00847362910',
		bankName: 'ICICI Bank',
		status: 'Active',
		usage: 'PayIn & Payout'
	}
];

const STATUSES: Transaction['status'][] = ['Completed', 'Failed', 'Reversed'];
const BANKS = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI', 'Kotak Bank'];
const SOURCES = ['NEFT', 'RTGS', 'IMPS', 'UPI'];

function padNum(n: number, len = 8) {
	return String(n).padStart(len, '0');
}

function mockDate(daysAgo: number, hour: number): string {
	const d = new Date('2026-07-02T00:00:00Z');
	d.setDate(d.getDate() - daysAgo);
	d.setHours(hour, (daysAgo * 13) % 60, (daysAgo * 7) % 60, 0);
	return d.toISOString();
}

function generateTransactions(): Transaction[] {
	const txns: Transaction[] = [];
	let balance = 5_000_000;
	for (let i = 1; i <= 120; i++) {
		const status = STATUSES[i % 3];
		const amount = (((i * 13337 + 999) % 90_000) + 500) * 100;
		const opening = balance;
		const closing = status === 'Completed' ? balance + amount : balance;
		if (status === 'Completed') balance += amount;
		txns.push({
			id: String(i),
			txnId: `TXN${padNum(i)}`,
			openingBalance: opening,
			closingBalance: closing,
			utr: i % 4 === 0 ? null : `UTR${padNum(i * 12345, 16)}`,
			crn: `CRN${padNum(i * 98765, 12)}`,
			sourceAccount: SOURCES[i % SOURCES.length],
			accountNumber: `****${padNum((i * 1234) % 10000, 4)}`,
			amount,
			status,
			dateTime: mockDate(Math.floor(i / 4), (i * 3) % 24),
			bankName: BANKS[i % BANKS.length],
			accountHolder: 'ElixirPay Technologies Pvt Ltd',
			accountUsage: ['PayIn', 'Payout', 'PayIn & Payout'][i % 3]
		});
	}
	return txns;
}

export const ALL_TRANSACTIONS: Transaction[] = generateTransactions();
