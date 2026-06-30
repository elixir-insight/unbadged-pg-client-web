export type VirtualAccountType =
	| 'Corporate'
	| 'Payroll'
	| 'Vendor'
	| 'Expense'
	| 'Collections'
	| 'Treasury';

export interface VirtualAccount {
	id: string;
	name: string;
	accountNumber: string;
	balance: number;
	limit: number;
	type: VirtualAccountType;
	icon: string;
}

export interface TransferMethod {
	id: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';
	label: string;
	description: string;
	limitLabel: string;
	icon: string;
	info: string;
}

export interface Beneficiary {
	name: string;
	accountNumber: string;
	confirmAccountNumber: string;
	ifsc: string;
	bankName: string;
	upiId: string;
}

export interface TransferStep {
	id: string;
	label: string;
	sublabel: string;
}

export type TxnStatus = 'idle' | 'pending' | 'processing' | 'success' | 'failed';

export type BalanceStatus = 'ok' | 'warning' | 'error';

export type TimelineState = 'done' | 'active' | 'pending' | 'failed';

export interface TimelineStep {
	label: string;
	sublabel: string;
	state: TimelineState;
}

export interface StepConfig {
	id: string;
	label: string;
	sublabel: string;
}

export interface TransferSummary {
	amount: number;
	fromAccount: VirtualAccount | null;
	method: TransferMethod | null;
	beneficiary: Beneficiary;
	remarks: string;
	reference: string;
	status: TxnStatus;
	userName: string;
	userRole: string;
	utr?: string;
	errorCode?: string;
	failureReason?: string;
	processedAt?: string;
}

export interface ReviewRow {
	label: string;
	value: string;
}

export function formatInr(amount: number): string {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	}).format(amount);
}

export function maskAccountNumber(accountNumber: string): string {
	if (accountNumber.length <= 4) return accountNumber;
	return `•••• ${accountNumber.slice(-4)}`;
}
