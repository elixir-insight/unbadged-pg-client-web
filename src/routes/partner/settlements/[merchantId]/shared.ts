import type { PartnerSettlementEntry, PartnerSettlementStatus } from './types';

export const currency = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 0
});

export const currencyDetailed = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

export const dateFormatter = new Intl.DateTimeFormat('en-IN', {
	day: '2-digit',
	month: 'short',
	year: 'numeric'
});

export function formatInr(value: number) {
	return currency.format(value);
}

export function formatInrDetailed(value: number) {
	return currencyDetailed.format(value);
}

export function formatRecordDate(value: string) {
	return dateFormatter.format(new Date(value));
}

export function calcEntryTaxes(amount: number) {
	return {
		tds: Number((amount * 0.05).toFixed(2)),
		gst: Number((amount * 0.18).toFixed(2))
	};
}

export function calculateSettlementStatus(
	commissionEarned: number,
	entryList: Pick<PartnerSettlementEntry, 'amount'>[]
): PartnerSettlementStatus {
	const totalSettled = entryList.reduce((sum, entry) => sum + entry.amount, 0);
	if (totalSettled === 0) return 'unsettled';
	if (totalSettled < commissionEarned) return 'partial';
	if (totalSettled === commissionEarned) return 'settled';
	return 'adjusted';
}

export const STATUS_CHIP_VARIANT = {
	unsettled: 'destructive',
	partial: 'warning',
	adjusted: 'default',
	settled: 'success'
} as const;

export const STATUS_LABEL = {
	unsettled: 'Unsettled',
	partial: 'Partial',
	adjusted: 'Adjusted',
	settled: 'Settled'
} as const;
