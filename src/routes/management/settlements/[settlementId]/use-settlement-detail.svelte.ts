import { getSettlementDetail } from '../mock-data';
import type { SettlementDetail } from '../types';

// TODO: remove once real fetches provide real timing.
const MOCK_LATENCY_MS = 350;

/**
 * Full settlement detail (header + transactions) for one settlement.
 * TODO: replace with real API — Omniware `getsettlementdetails`.
 */
export function useSettlementDetail(settlementId: () => string) {
	let detail = $state<SettlementDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let requestId = 0;

	async function load() {
		const id = ++requestId;
		loading = true;
		error = null;
		try {
			const id_ = settlementId();
			const result = await new Promise<SettlementDetail | null>((resolve) =>
				setTimeout(() => resolve(getSettlementDetail(id_)), MOCK_LATENCY_MS)
			);
			if (id !== requestId) return;
			detail = result;
		} catch {
			if (id !== requestId) return;
			error = 'Failed to load settlement details. Please try again.';
		} finally {
			if (id === requestId) loading = false;
		}
	}

	$effect(() => {
		settlementId();
		load();
	});

	return {
		get detail() {
			return detail;
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
