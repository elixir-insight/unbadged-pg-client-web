import {
	getOrderStatsForDateAndMerchant,
	getOrderStatsForMerchant,
	getSettlementsForDateAndMerchant,
	getSettlementsForMerchant
} from './mock-data';
import type { OrderStats, SettlementListItem, SettlementMoneySummary } from './types';

// Simulated network latency so loading/error/retry states are exercisable
// against the mock backend — remove once real fetches provide real timing.
const MOCK_LATENCY_MS = 350;

function simulateFetch<T>(getValue: () => T): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(getValue()), MOCK_LATENCY_MS));
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

/**
 * Settlement rows for the selected day.
 * TODO: replace with real API — Omniware `getsettlements`.
 */
export function useSettlementsList(date: () => string, merchantId: () => string) {
	let items = $state<SettlementListItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let requestId = 0;

	async function load() {
		const id = ++requestId;
		const currentDate = date();
		const currentMerchantId = merchantId();
		if (!currentMerchantId) {
			items = [];
			loading = false;
			error = null;
			return;
		}
		loading = true;
		error = null;
		try {
			const result = await simulateFetch(() =>
				currentDate
					? getSettlementsForDateAndMerchant(currentDate, currentMerchantId)
					: getSettlementsForMerchant(currentMerchantId)
			);
			if (id !== requestId) return;
			items = result;
		} catch {
			if (id !== requestId) return;
			error = 'Failed to load settlements. Please try again.';
		} finally {
			if (id === requestId) loading = false;
		}
	}

	$effect(() => {
		date();
		merchantId();
		load();
	});

	return {
		get items() {
			return items;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		retry: load
	};
}

/**
 * Order-status counts for the day, aggregated across all merchants.
 * Fetched separately from money totals below — internal orders/transactions
 * service, not the settlement service — so each source can be swapped for a
 * real API independently.
 * TODO: replace with real API — internal orders/transactions service.
 */
export function useOrderStats(date: () => string, merchantId: () => string) {
	let stats = $state<OrderStats | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let requestId = 0;

	async function load() {
		const id = ++requestId;
		const currentDate = date();
		const currentMerchantId = merchantId();
		if (!currentMerchantId) {
			stats = null;
			loading = false;
			error = null;
			return;
		}
		loading = true;
		error = null;
		try {
			const result = await simulateFetch(() =>
				currentDate
					? getOrderStatsForDateAndMerchant(currentDate, currentMerchantId)
					: getOrderStatsForMerchant(currentMerchantId)
			);
			if (id !== requestId) return;
			stats = result;
		} catch {
			if (id !== requestId) return;
			error = 'Failed to load order stats.';
		} finally {
			if (id === requestId) loading = false;
		}
	}

	$effect(() => {
		date();
		merchantId();
		load();
	});

	return {
		get stats() {
			return stats;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		retry: load
	};
}

/**
 * Money-level aggregates for the day — settlement service, distinct from the
 * order-status counts above.
 * TODO: replace with real API — Omniware `getsettlements` aggregate/summary.
 */
export function useMoneySummary(date: () => string, merchantId: () => string) {
	let summary = $state<SettlementMoneySummary | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let requestId = 0;

	async function load() {
		const id = ++requestId;
		const currentDate = date();
		const currentMerchantId = merchantId();
		if (!currentMerchantId) {
			summary = null;
			loading = false;
			error = null;
			return;
		}
		loading = true;
		error = null;
		try {
			const result = await simulateFetch(() => {
				const settlements = currentDate
					? getSettlementsForDateAndMerchant(currentDate, currentMerchantId)
					: getSettlementsForMerchant(currentMerchantId);
				return settlements.reduce<SettlementMoneySummary>(
					(acc, s) => ({
						totalSaleAmount: round2(acc.totalSaleAmount + s.saleAmount),
						totalDeductions: round2(acc.totalDeductions + s.deductions),
						netSettled: round2(acc.netSettled + (s.status === 'completed' ? s.netPayout : 0)),
						merchantsPending: acc.merchantsPending + (s.status === 'pending' ? 1 : 0)
					}),
					{ totalSaleAmount: 0, totalDeductions: 0, netSettled: 0, merchantsPending: 0 }
				);
			});
			if (id !== requestId) return;
			summary = result;
		} catch {
			if (id !== requestId) return;
			error = 'Failed to load settlement summary.';
		} finally {
			if (id === requestId) loading = false;
		}
	}

	$effect(() => {
		date();
		merchantId();
		load();
	});

	return {
		get summary() {
			return summary;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		retry: load
	};
}
