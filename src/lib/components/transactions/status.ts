import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
import type { TransactionStatus } from '$lib/data/payin-transactions-mock';

const variants: Record<TransactionStatus, BadgeVariant> = {
	success: 'success',
	pending: 'warning',
	failed: 'error',
	refunded: 'info',
	disputed: 'alert',
	chargeback: 'destructive'
};

const labels: Record<TransactionStatus, string> = {
	success: 'Success',
	pending: 'Pending',
	failed: 'Failed',
	refunded: 'Refunded',
	disputed: 'Disputed',
	chargeback: 'Chargeback'
};

export function statusVariant(status: TransactionStatus): BadgeVariant {
	return variants[status] ?? 'disabled';
}

export function statusLabel(status: TransactionStatus): string {
	return labels[status] ?? status;
}
