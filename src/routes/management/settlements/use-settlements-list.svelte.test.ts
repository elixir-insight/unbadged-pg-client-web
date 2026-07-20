import { describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import { useSettlementsList, useOrderStats, useMoneySummary } from './use-settlements-list.svelte';
import { getDefaultSettlementMerchantId } from './mock-data';
import { waitFor } from './test-utils';

const DATE = '2026-07-08';
const MERCHANT_ID = getDefaultSettlementMerchantId();

describe('useSettlementsList', () => {
	it('starts loading, then resolves one settlement row per merchant', async () => {
		let hook!: ReturnType<typeof useSettlementsList>;
		const cleanup = $effect.root(() => {
			hook = useSettlementsList(
				() => DATE,
				() => MERCHANT_ID
			);
		});
		flushSync();

		expect(hook.loading).toBe(true);
		expect(hook.items).toEqual([]);

		await waitFor(() => !hook.loading);

		expect(hook.error).toBeNull();
		expect(hook.items.length).toBe(1);
		expect(hook.items[0]?.merchantId).toBe(MERCHANT_ID);

		cleanup();
	});

	it('reloads when the date changes', async () => {
		let dateValue = $state(DATE);
		let hook!: ReturnType<typeof useSettlementsList>;
		const cleanup = $effect.root(() => {
			hook = useSettlementsList(
				() => dateValue,
				() => MERCHANT_ID
			);
		});
		flushSync();

		await waitFor(() => !hook.loading);
		const firstDayIds = hook.items.map((i) => i.settlementId);

		dateValue = '2026-07-09';
		flushSync();
		expect(hook.loading).toBe(true);

		await waitFor(() => !hook.loading);
		const secondDayIds = hook.items.map((i) => i.settlementId);

		expect(secondDayIds).not.toEqual(firstDayIds);

		cleanup();
	});

	it('retry() re-fetches the same date', async () => {
		let hook!: ReturnType<typeof useSettlementsList>;
		const cleanup = $effect.root(() => {
			hook = useSettlementsList(
				() => DATE,
				() => MERCHANT_ID
			);
		});
		flushSync();

		await waitFor(() => !hook.loading);
		const before = hook.items;

		hook.retry();
		expect(hook.loading).toBe(true);

		await waitFor(() => !hook.loading);
		expect(hook.items).toEqual(before);

		cleanup();
	});

	it('loads all recent settlements when no date is selected', async () => {
		let hook!: ReturnType<typeof useSettlementsList>;
		const cleanup = $effect.root(() => {
			hook = useSettlementsList(
				() => '',
				() => MERCHANT_ID
			);
		});
		flushSync();

		await waitFor(() => !hook.loading);

		expect(hook.error).toBeNull();
		expect(hook.items.length).toBeGreaterThan(1);
		expect(hook.items.every((item) => item.merchantId === MERCHANT_ID)).toBe(true);

		cleanup();
	});
});

describe('useOrderStats', () => {
	it('resolves order-status counts that sum to the total', async () => {
		let hook!: ReturnType<typeof useOrderStats>;
		const cleanup = $effect.root(() => {
			hook = useOrderStats(
				() => DATE,
				() => MERCHANT_ID
			);
		});
		flushSync();

		expect(hook.loading).toBe(true);
		await waitFor(() => !hook.loading);

		expect(hook.error).toBeNull();
		const stats = hook.stats;
		expect(stats).not.toBeNull();
		expect(stats!.successful + stats!.pending + stats!.created + stats!.failed).toBe(stats!.orders);

		cleanup();
	});
});

describe('useMoneySummary', () => {
	it('resolves money-level aggregates', async () => {
		let hook!: ReturnType<typeof useMoneySummary>;
		const cleanup = $effect.root(() => {
			hook = useMoneySummary(
				() => DATE,
				() => MERCHANT_ID
			);
		});
		flushSync();

		expect(hook.loading).toBe(true);
		await waitFor(() => !hook.loading);

		expect(hook.error).toBeNull();
		expect(hook.summary).not.toBeNull();
		expect(hook.summary!.totalSaleAmount).toBeGreaterThan(0);

		cleanup();
	});
});
