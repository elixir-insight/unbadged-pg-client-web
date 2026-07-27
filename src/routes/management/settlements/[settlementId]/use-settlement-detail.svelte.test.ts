import { describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import { useSettlementDetail } from './use-settlement-detail.svelte';
import { buildSettlementId, getSettlementsForDate } from '../mock-data';
import { waitFor } from '../test-utils';

const DATE = '2026-07-08';

describe('useSettlementDetail', () => {
	it('resolves the full settlement detail for a known id', async () => {
		const [listItem] = getSettlementsForDate(DATE);
		let hook!: ReturnType<typeof useSettlementDetail>;
		const cleanup = $effect.root(() => {
			hook = useSettlementDetail(() => listItem.settlementId);
		});
		flushSync();

		expect(hook.loading).toBe(true);
		await waitFor(() => !hook.loading);

		expect(hook.error).toBeNull();
		expect(hook.detail?.settlementId).toBe(listItem.settlementId);
		expect(hook.detail?.merchantId).toBe(listItem.merchantId);
		expect(hook.detail?.transactions.length).toBeGreaterThan(0);

		cleanup();
	});

	it('resolves to null for an unknown settlement id', async () => {
		let hook!: ReturnType<typeof useSettlementDetail>;
		const cleanup = $effect.root(() => {
			hook = useSettlementDetail(() => buildSettlementId('NOPE', DATE));
		});
		flushSync();

		await waitFor(() => !hook.loading);

		expect(hook.detail).toBeNull();
		expect(hook.error).toBeNull();

		cleanup();
	});

	it('reloads when the settlement id changes', async () => {
		const [first, second] = getSettlementsForDate(DATE);
		let idValue = $state(first.settlementId);
		let hook!: ReturnType<typeof useSettlementDetail>;
		const cleanup = $effect.root(() => {
			hook = useSettlementDetail(() => idValue);
		});
		flushSync();

		await waitFor(() => !hook.loading);
		expect(hook.detail?.settlementId).toBe(first.settlementId);

		idValue = second.settlementId;
		flushSync();
		expect(hook.loading).toBe(true);

		await waitFor(() => !hook.loading);
		expect(hook.detail?.settlementId).toBe(second.settlementId);

		cleanup();
	});
});
