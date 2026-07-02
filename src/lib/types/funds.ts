export type FundSummary = {
	totalBalance: number;
	payInBalance: number;
	payoutBalance: number;
	lastUpdated: string;
};

export type BankAccount = {
	id: string;
	bankName: string;
	accountHolderName: string;
	accountNumber: string;
	ifsc: string;
	branchName: string;
	accountType: 'Savings' | 'Current';
	usage: 'PayIn' | 'Payout' | 'PayIn & Payout';
};

export type VirtualAccount = {
	id: string;
	virtualAccountNumber: string;
	bankName: string;
	status: 'Active' | 'Inactive';
	usage: 'PayIn' | 'Payout' | 'PayIn & Payout';
};

export type Transaction = {
	id: string;
	txnId: string;
	openingBalance: number;
	closingBalance: number;
	utr: string | null;
	crn: string;
	sourceAccount: string;
	accountNumber: string;
	amount: number;
	status: 'Completed' | 'Failed' | 'Reversed';
	dateTime: string;
	bankName: string;
	accountHolder: string;
	accountUsage: string;
};
