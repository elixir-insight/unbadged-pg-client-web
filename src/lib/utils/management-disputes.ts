export const DISPUTE_STATUSES = ['Raised', 'Open', 'Under review', 'Won', 'Lost'] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export interface StoredDispute {
	disputeId: string;
	orderId: string;
	transactionId: string;
	amount: string;
	status: DisputeStatus;
	raisedOn: string;
	evidenceDueBy: string;
	organization: string;
	bankReferenceNumber: string;
	reasonCode: string;
	resolvedBy: string;
	currency: string;
	source: string;
	gatewayDescription: string;
	pipelineDescription: string;
	resolutionNotes: string;
}

export type DisputeDraft = Pick<
	StoredDispute,
	'orderId' | 'transactionId' | 'amount' | 'status' | 'raisedOn'
>;

const DISPUTES_STORAGE_KEY = 'management-disputes-v1';

export function isDisputeStatus(value: unknown): value is DisputeStatus {
	return typeof value === 'string' && DISPUTE_STATUSES.some((status) => status === value);
}

function normalizeStoredDispute(value: unknown): StoredDispute | null {
	if (!value || typeof value !== 'object') return null;

	const row = value as Record<string, unknown>;
	if (
		typeof row.disputeId !== 'string' ||
		typeof row.orderId !== 'string' ||
		typeof row.transactionId !== 'string' ||
		typeof row.amount !== 'string' ||
		!isDisputeStatus(row.status) ||
		typeof row.raisedOn !== 'string'
	) {
		return null;
	}

	return {
		disputeId: row.disputeId,
		orderId: row.orderId,
		transactionId: row.transactionId,
		amount: row.amount,
		status: row.status,
		raisedOn: row.raisedOn,
		evidenceDueBy:
			typeof row.evidenceDueBy === 'string' && row.evidenceDueBy !== '—'
				? row.evidenceDueBy
				: createMockEvidenceDeadline(),
		organization: typeof row.organization === 'string' ? row.organization : 'ABC Pvt Ltd',
		bankReferenceNumber:
			typeof row.bankReferenceNumber === 'string' ? row.bankReferenceNumber : 'BRN1234567890',
		reasonCode:
			typeof row.reasonCode === 'string' ? row.reasonCode : '10.4 — Fraudulent Transaction',
		resolvedBy:
			typeof row.resolvedBy === 'string' && row.resolvedBy !== 'Sarah Khan' ? row.resolvedBy : '',
		currency: typeof row.currency === 'string' ? row.currency : 'INR',
		source: typeof row.source === 'string' ? row.source : 'BANK_MANUAL',
		gatewayDescription:
			typeof row.gatewayDescription === 'string'
				? row.gatewayDescription
				: 'Customer has raised a dispute stating unauthorized transaction. The bank has initiated chargeback.',
		pipelineDescription:
			typeof row.pipelineDescription === 'string'
				? row.pipelineDescription
				: 'Transaction was processed successfully via VISA pipeline. No risk rules were triggered at the time of transaction.',
		resolutionNotes:
			typeof row.resolutionNotes === 'string'
				? row.resolutionNotes
				: 'Merchant provided invoice and communication proof. Waiting for aggregator confirmation.'
	};
}

function createMockEvidenceDeadline(): string {
	const deadline = new Date();
	deadline.setDate(deadline.getDate() + 7);
	return deadline.toISOString().slice(0, 10);
}

export function loadStoredDisputes(): StoredDispute[] {
	if (typeof localStorage === 'undefined') return [];

	try {
		const storedValue = localStorage.getItem(DISPUTES_STORAGE_KEY);
		if (!storedValue) return [];

		const parsed: unknown = JSON.parse(storedValue);
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map(normalizeStoredDispute)
			.filter((dispute): dispute is StoredDispute => dispute !== null);
	} catch {
		return [];
	}
}

export function saveStoredDisputes(disputes: StoredDispute[]): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(DISPUTES_STORAGE_KEY, JSON.stringify(disputes));
}

export function hasDisputeForTransaction(transactionId: string): boolean {
	return loadStoredDisputes().some((dispute) => dispute.transactionId === transactionId);
}

export function getStoredDispute(disputeId: string): StoredDispute | undefined {
	return loadStoredDisputes().find((dispute) => dispute.disputeId === disputeId);
}

export function updateStoredDispute(updatedDispute: StoredDispute): void {
	const disputes = loadStoredDisputes().map((dispute) =>
		dispute.disputeId === updatedDispute.disputeId ? updatedDispute : dispute
	);
	saveStoredDisputes(disputes);
}

export function upsertStoredDispute(draft: DisputeDraft): StoredDispute[] {
	const storedDisputes = loadStoredDisputes();
	const alreadyRaised = storedDisputes.some(
		(dispute) => dispute.transactionId === draft.transactionId
	);

	const disputes = alreadyRaised
		? storedDisputes
		: [
				{
					disputeId: `DSP-${Date.now().toString().slice(-8)}`,
					...draft,
					evidenceDueBy: createMockEvidenceDeadline(),
					organization: 'ABC Pvt Ltd',
					bankReferenceNumber: 'BRN1234567890',
					reasonCode: '10.4 — Fraudulent Transaction',
					resolvedBy: '',
					currency: 'INR',
					source: 'BANK',
					gatewayDescription:
						'Customer has raised a dispute stating unauthorized transaction. The bank has initiated chargeback.',
					pipelineDescription:
						'Transaction was processed successfully via VISA pipeline. No risk rules were triggered at the time of transaction.',
					resolutionNotes:
						'Merchant provided invoice and communication proof. Waiting for aggregator confirmation.'
				},
				...storedDisputes
			];

	saveStoredDisputes(disputes);
	return disputes;
}
