import { merchants } from './refunds-mock';

export type TransactionType = 'UPI' | 'Net Banking' | 'Bank Transfer';
export type TransactionStatus =
	| 'success'
	| 'pending'
	| 'failed'
	| 'refunded'
	| 'disputed'
	| 'chargeback';

export interface FeeBreakdown {
	processingFee: number;
	gatewayFee: number;
	gst: number;
}

export interface RefundInfo {
	status: 'none' | 'partial' | 'full' | 'pending';
	amount: number;
	date: string | null;
}

export interface DisputeInfo {
	status: 'none' | 'raised' | 'resolved';
	reason?: string;
	raisedDate?: string;
	resolvedDate?: string;
}

export interface ChargebackInfo {
	status: 'none' | 'raised' | 'resolved';
	reason?: string;
	raisedDate?: string;
	resolvedDate?: string;
}

export type AuditEventType =
	| 'Payment Initiated'
	| 'Processing'
	| 'Success'
	| 'Failed'
	| 'Refund Initiated'
	| 'Refund Completed'
	| 'Dispute Raised'
	| 'Dispute Resolved'
	| 'Chargeback Raised'
	| 'Chargeback Resolved';

export interface AuditEvent {
	id: string;
	event: AuditEventType;
	timestamp: string;
	statusChange: string;
	performedBy: string;
	remarks: string;
}

export interface PayinTransaction extends Record<string, unknown> {
	id: string;
	merchantId: string;
	payerName: string;
	clientOrderId: string;
	crn: string;
	utr: string | null;
	gatewayTxnId: string;
	amount: number;
	transactionType: TransactionType;
	transactionDate: string;
	status: TransactionStatus;
	fees: FeeBreakdown;
	refund: RefundInfo;
	dispute: DisputeInfo;
	chargeback: ChargebackInfo;
	auditTrail: AuditEvent[];
}

function buildAuditTrail(status: TransactionStatus, base: string): AuditEvent[] {
	const trail: AuditEvent[] = [
		{
			id: 'evt-1',
			event: 'Payment Initiated',
			timestamp: `${base} 09:00`,
			statusChange: '— → Initiated',
			performedBy: 'Customer',
			remarks: 'Payment link opened by payer.'
		},
		{
			id: 'evt-2',
			event: 'Processing',
			timestamp: `${base} 09:01`,
			statusChange: 'Initiated → Processing',
			performedBy: 'System',
			remarks: 'Awaiting bank confirmation.'
		}
	];
	if (
		status === 'success' ||
		status === 'refunded' ||
		status === 'disputed' ||
		status === 'chargeback'
	) {
		trail.push({
			id: 'evt-3',
			event: 'Success',
			timestamp: `${base} 09:02`,
			statusChange: 'Processing → Success',
			performedBy: 'System',
			remarks: 'Payment confirmed by bank.'
		});
	}
	if (status === 'failed') {
		trail.push({
			id: 'evt-3',
			event: 'Failed',
			timestamp: `${base} 09:02`,
			statusChange: 'Processing → Failed',
			performedBy: 'System',
			remarks: 'Bank declined the transaction.'
		});
	}
	if (status === 'refunded') {
		trail.push(
			{
				id: 'evt-4',
				event: 'Refund Initiated',
				timestamp: `${base} 14:10`,
				statusChange: 'Success → Refund Initiated',
				performedBy: 'Ops Admin',
				remarks: 'Refund requested by merchant.'
			},
			{
				id: 'evt-5',
				event: 'Refund Completed',
				timestamp: `${base} 16:40`,
				statusChange: 'Refund Initiated → Refunded',
				performedBy: 'System',
				remarks: 'Refund credited to payer account.'
			}
		);
	}
	if (status === 'disputed') {
		trail.push({
			id: 'evt-4',
			event: 'Dispute Raised',
			timestamp: `${base} 18:00`,
			statusChange: 'Success → Disputed',
			performedBy: 'Payer',
			remarks: 'Payer raised a dispute with the issuing bank.'
		});
	}
	if (status === 'chargeback') {
		trail.push({
			id: 'evt-4',
			event: 'Chargeback Raised',
			timestamp: `${base} 18:00`,
			statusChange: 'Success → Chargeback',
			performedBy: 'Issuing Bank',
			remarks: 'Chargeback raised by issuing bank.'
		});
	}
	return trail;
}

function fees(amount: number): FeeBreakdown {
	const processingFee = +(amount * 0.01).toFixed(2);
	const gatewayFee = +(amount * 0.005).toFixed(2);
	const gst = +((processingFee + gatewayFee) * 0.18).toFixed(2);
	return { processingFee, gatewayFee, gst };
}

function noRefund(): RefundInfo {
	return { status: 'none', amount: 0, date: null };
}
function noDispute(): DisputeInfo {
	return { status: 'none' };
}
function noChargeback(): ChargebackInfo {
	return { status: 'none' };
}

interface Seed {
	payerName: string;
	clientOrderId: string;
	crn: string;
	utr: string | null;
	gatewayTxnId: string;
	amount: number;
	transactionType: TransactionType;
	transactionDate: string;
	status: TransactionStatus;
	merchantId: string;
}

const seeds: Seed[] = [
	{
		payerName: 'Arjun Mehta',
		clientOrderId: 'ORD-2026-001',
		crn: 'CRN2026070100001',
		utr: 'AXISC2707010001',
		gatewayTxnId: 'GTX-100001',
		amount: 4500,
		transactionType: 'UPI',
		transactionDate: '2026-07-07',
		status: 'success',
		merchantId: 'M1'
	},
	{
		payerName: 'Priya Sharma',
		clientOrderId: 'ORD-2026-002',
		crn: 'CRN2026070100002',
		utr: null,
		gatewayTxnId: 'GTX-100002',
		amount: 12000,
		transactionType: 'Net Banking',
		transactionDate: '2026-07-07',
		status: 'pending',
		merchantId: 'M1'
	},
	{
		payerName: 'Vikram Nair',
		clientOrderId: 'ORD-2026-003',
		crn: 'CRN2026070100003',
		utr: null,
		gatewayTxnId: 'GTX-100003',
		amount: 2750,
		transactionType: 'Bank Transfer',
		transactionDate: '2026-07-06',
		status: 'failed',
		merchantId: 'M1'
	},
	{
		payerName: 'Ananya Rao',
		clientOrderId: 'ORD-2026-004',
		crn: 'CRN2026070100004',
		utr: 'HDFCC2707060004',
		gatewayTxnId: 'GTX-100004',
		amount: 8300,
		transactionType: 'UPI',
		transactionDate: '2026-07-06',
		status: 'refunded',
		merchantId: 'M1'
	},
	{
		payerName: 'Rahul Das',
		clientOrderId: 'ORD-2026-005',
		crn: 'CRN2026070100005',
		utr: 'ICICC2707050005',
		gatewayTxnId: 'GTX-100005',
		amount: 15688,
		transactionType: 'Net Banking',
		transactionDate: '2026-07-05',
		status: 'disputed',
		merchantId: 'M1'
	},
	{
		payerName: 'Suresh Kumar',
		clientOrderId: 'ORD-2026-006',
		crn: 'CRN2026070100006',
		utr: 'SBIC2707040006',
		gatewayTxnId: 'GTX-100006',
		amount: 28745.77,
		transactionType: 'UPI',
		transactionDate: '2026-07-04',
		status: 'chargeback',
		merchantId: 'M1'
	},
	{
		payerName: 'Lakshmi Pillai',
		clientOrderId: 'ORD-2026-007',
		crn: 'CRN2026070100007',
		utr: 'AXISC2707040007',
		gatewayTxnId: 'GTX-100007',
		amount: 5412.32,
		transactionType: 'Bank Transfer',
		transactionDate: '2026-07-04',
		status: 'success',
		merchantId: 'M2'
	},
	{
		payerName: 'Manish Verma',
		clientOrderId: 'ORD-2026-008',
		crn: 'CRN2026070100008',
		utr: null,
		gatewayTxnId: 'GTX-100008',
		amount: 9119.23,
		transactionType: 'UPI',
		transactionDate: '2026-07-03',
		status: 'pending',
		merchantId: 'M2'
	},
	{
		payerName: 'Priya Nair',
		clientOrderId: 'ORD-2026-009',
		crn: 'CRN2026070100009',
		utr: null,
		gatewayTxnId: 'GTX-100009',
		amount: 72340.5,
		transactionType: 'Net Banking',
		transactionDate: '2026-07-03',
		status: 'failed',
		merchantId: 'M2'
	},
	{
		payerName: 'Amit Patel',
		clientOrderId: 'ORD-2026-010',
		crn: 'CRN2026070100010',
		utr: 'KKBKC2707020010',
		gatewayTxnId: 'GTX-100010',
		amount: 37621.71,
		transactionType: 'UPI',
		transactionDate: '2026-07-02',
		status: 'success',
		merchantId: 'M2'
	},
	{
		payerName: 'Neha Joshi',
		clientOrderId: 'ORD-2026-011',
		crn: 'CRN2026070100011',
		utr: 'HDFCC2707010011',
		gatewayTxnId: 'GTX-100011',
		amount: 6400,
		transactionType: 'UPI',
		transactionDate: '2026-07-01',
		status: 'refunded',
		merchantId: 'M3'
	},
	{
		payerName: 'Karan Malhotra',
		clientOrderId: 'ORD-2026-012',
		crn: 'CRN2026070100012',
		utr: null,
		gatewayTxnId: 'GTX-100012',
		amount: 3200,
		transactionType: 'Bank Transfer',
		transactionDate: '2026-06-30',
		status: 'pending',
		merchantId: 'M3'
	},
	{
		payerName: 'Divya Menon',
		clientOrderId: 'ORD-2026-013',
		crn: 'CRN2026070100013',
		utr: 'SBIC2706290013',
		gatewayTxnId: 'GTX-100013',
		amount: 18999,
		transactionType: 'Net Banking',
		transactionDate: '2026-06-29',
		status: 'success',
		merchantId: 'M5'
	},
	{
		payerName: 'Rohit Bhatia',
		clientOrderId: 'ORD-2026-014',
		crn: 'CRN2026070100014',
		utr: null,
		gatewayTxnId: 'GTX-100014',
		amount: 950,
		transactionType: 'UPI',
		transactionDate: '2026-06-28',
		status: 'failed',
		merchantId: 'M5'
	},
	{
		payerName: 'Sneha Kulkarni',
		clientOrderId: 'ORD-2026-015',
		crn: 'CRN2026070100015',
		utr: 'ICICC2706270015',
		gatewayTxnId: 'GTX-100015',
		amount: 24500,
		transactionType: 'UPI',
		transactionDate: '2026-06-27',
		status: 'disputed',
		merchantId: 'M6'
	}
];

function toTransaction(seed: Seed): PayinTransaction {
	const status = seed.status;
	const t: PayinTransaction = {
		id: `TXN-${seed.gatewayTxnId.split('-')[1]}`,
		merchantId: seed.merchantId,
		payerName: seed.payerName,
		clientOrderId: seed.clientOrderId,
		crn: seed.crn,
		utr: seed.utr,
		gatewayTxnId: seed.gatewayTxnId,
		amount: seed.amount,
		transactionType: seed.transactionType,
		transactionDate: seed.transactionDate,
		status,
		fees: fees(seed.amount),
		refund: noRefund(),
		dispute: noDispute(),
		chargeback: noChargeback(),
		auditTrail: buildAuditTrail(status, seed.transactionDate)
	};

	if (status === 'refunded') {
		t.refund = { status: 'full', amount: seed.amount, date: seed.transactionDate };
	}
	if (status === 'disputed') {
		t.dispute = {
			status: 'raised',
			reason: 'Payer claims the transaction was unauthorized.',
			raisedDate: seed.transactionDate
		};
	}
	if (status === 'chargeback') {
		t.chargeback = {
			status: 'raised',
			reason: 'Issuing bank raised a chargeback for this transaction.',
			raisedDate: seed.transactionDate
		};
	}
	return t;
}

export const payinTransactions: PayinTransaction[] = seeds.map(toTransaction);

// ── Simulated API layer ──────────────────────────────────────────────────────

function delay<T>(value: T, ms = 300): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface TransactionSummary {
	availableFunds: number;
	todayVolume: number;
	todayCount: number;
}

export async function getTransactionSummary(merchantId: string): Promise<TransactionSummary> {
	const own = payinTransactions.filter((t) => t.merchantId === merchantId);
	const today =
		own.length > 0
			? [...own].sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : -1))[0].transactionDate
			: '';
	const todayTxns = own.filter((t) => t.transactionDate === today);
	const availableFunds = own
		.filter((t) => t.status === 'success')
		.reduce((sum, t) => sum + t.amount - t.fees.processingFee - t.fees.gatewayFee - t.fees.gst, 0);
	const todayVolume = todayTxns
		.filter((t) => t.status === 'success' || t.status === 'refunded')
		.reduce((sum, t) => sum + t.amount, 0);
	return delay({ availableFunds, todayVolume, todayCount: todayTxns.length });
}

export interface TransactionListParams {
	merchantId: string;
	searchField?: 'crn' | 'clientOrderId' | 'utr';
	searchValue?: string;
	type?: TransactionType | '';
	status?: TransactionStatus | '';
	from?: string;
	to?: string;
	skip: number;
	limit: number;
}

export interface TransactionListResult {
	data: PayinTransaction[];
	total: number;
}

export async function getTransactionList(
	params: TransactionListParams
): Promise<TransactionListResult> {
	const filtered = payinTransactions.filter((t) => {
		if (t.merchantId !== params.merchantId) return false;
		if (params.searchValue) {
			const field = params.searchField ?? 'crn';
			const haystack = (t[field] ?? '') as string;
			if (!haystack.toLowerCase().includes(params.searchValue.toLowerCase())) return false;
		}
		if (params.type && t.transactionType !== params.type) return false;
		if (params.status && t.status !== params.status) return false;
		if (params.from && t.transactionDate < params.from) return false;
		if (params.to && t.transactionDate > params.to) return false;
		return true;
	});
	const data = filtered.slice(params.skip, params.skip + params.limit);
	return delay({ data, total: filtered.length });
}

export async function getTransactionById(
	id: string,
	merchantId: string
): Promise<PayinTransaction | null> {
	const found = payinTransactions.find((t) => t.id === id && t.merchantId === merchantId) ?? null;
	return delay(found);
}

export async function getAuditHistory(id: string, merchantId: string): Promise<AuditEvent[]> {
	const found = payinTransactions.find((t) => t.id === id && t.merchantId === merchantId);
	return delay(found ? found.auditTrail : []);
}

const nonRefundableStatuses: TransactionStatus[] = ['pending', 'failed', 'disputed', 'chargeback'];

export function isRefundEligible(t: PayinTransaction): boolean {
	if (nonRefundableStatuses.includes(t.status)) return false;
	if (t.refund.status === 'full') return false;
	return t.status === 'success';
}

export function recordRefundInitiated(id: string, amount: number, remarks: string): void {
	const t = payinTransactions.find((tx) => tx.id === id);
	if (!t) return;
	const isFull = amount >= t.amount;
	const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
	t.refund = { status: isFull ? 'full' : 'partial', amount, date: timestamp };
	t.auditTrail.push({
		id: `evt-${t.auditTrail.length + 1}`,
		event: 'Refund Initiated',
		timestamp,
		statusChange: `${t.status} → Refund Initiated`,
		performedBy: 'Ops Admin',
		remarks: remarks || 'Refund initiated from transaction details.'
	});
}

export { merchants };
