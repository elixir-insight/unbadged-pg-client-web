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
		evidenceDueBy: typeof row.evidenceDueBy === 'string' ? row.evidenceDueBy : '',
		organization: typeof row.organization === 'string' ? row.organization : '',
		bankReferenceNumber: typeof row.bankReferenceNumber === 'string' ? row.bankReferenceNumber : '',
		reasonCode: typeof row.reasonCode === 'string' ? row.reasonCode : '',
		resolvedBy: typeof row.resolvedBy === 'string' ? row.resolvedBy : '',
		currency: typeof row.currency === 'string' ? row.currency : 'INR',
		source: typeof row.source === 'string' ? row.source : '',
		gatewayDescription: typeof row.gatewayDescription === 'string' ? row.gatewayDescription : '',
		pipelineDescription: typeof row.pipelineDescription === 'string' ? row.pipelineDescription : '',
		resolutionNotes: typeof row.resolutionNotes === 'string' ? row.resolutionNotes : ''
	};
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

export function getStoredDispute(disputeId: string): StoredDispute | undefined {
	return loadStoredDisputes().find((dispute) => dispute.disputeId === disputeId);
}
