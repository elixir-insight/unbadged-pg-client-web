<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { ResolvedPathname } from '$app/types';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		createSettlementsStore,
		setSettlementsStore,
		type SettlementsStore
	} from './settlements.svelte';
	import { getMerchantById, getPartnerById, partners } from '$lib/data/partnerSettlementsDummyData';
	import PartnerSelector from './settlements-components/PartnerSelector.svelte';
	import MerchantRail from './settlements-components/MerchantRail.svelte';
	import MerchantQuickView from './settlements-components/MerchantQuickView.svelte';
	import MerchantFullHistory from './settlements-components/MerchantFullHistory.svelte';
	import ManagementSettlementDrawer from './settlements-components/ManagementSettlementDrawer.svelte';

	function initializeStoreFromUrl(store: SettlementsStore) {
		const partnerParam = page.url.searchParams.get('partner');
		const merchantParam = page.url.searchParams.get('merchant');

		if (partnerParam && getPartnerById(partnerParam)) {
			store.selectPartner(partnerParam);
			if (merchantParam && getMerchantById(merchantParam)) {
				store.selectMerchant(merchantParam);
			}
			return;
		}

		if (partners[0]) {
			store.selectPartner(partners[0].id);
		}
	}

	const store = createSettlementsStore();
	initializeStoreFromUrl(store);
	setSettlementsStore(store);

	function settlementsUrl(partnerId: string | null, merchantId: string | null): ResolvedPathname {
		const params = new SvelteURLSearchParams();
		if (partnerId) params.set('partner', partnerId);
		if (merchantId) params.set('merchant', merchantId);
		const query = params.toString();
		const base = resolve('/management/settlements');

		return (query ? `${base}?${query}` : base) as ResolvedPathname;
	}

	function syncUrl(partnerId: string | null, merchantId: string | null) {
		replaceState(settlementsUrl(partnerId, merchantId), page.state);
	}

	onMount(() => {
		if (!store.selectedPartnerId) return;

		const partnerParam = page.url.searchParams.get('partner');
		const merchantParam = page.url.searchParams.get('merchant');

		if (partnerParam !== store.selectedPartnerId || merchantParam !== store.selectedMerchantId) {
			syncUrl(store.selectedPartnerId, store.selectedMerchantId);
		}
	});

	function handlePartnerSelect(partner: import('$lib/data/partnerSettlementsDummyData').Partner) {
		store.selectPartner(partner.id);
		syncUrl(partner.id, store.selectedMerchantId);
	}

	function handleMerchantSelect(merchantId: string) {
		store.selectMerchant(merchantId);
		syncUrl(store.selectedPartnerId, merchantId);
	}
</script>

<div class="space-y-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">Partner settlements</h1>
		<p class="text-sm text-muted-foreground">
			Select a partner to browse merchant settlement cycles and manage entries.
		</p>
	</div>

	<PartnerSelector value={store.selectedPartner} onSelect={handlePartnerSelect} />

	{#if store.selectedPartner}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-[210px_1fr]">
			<aside class="lg:sticky lg:top-4 lg:self-start">
				<div class="rounded-lg border border-border/50 bg-card p-2">
					<p class="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Merchants
					</p>
					<MerchantRail
						merchants={store.partnerMerchants}
						selectedMerchantId={store.selectedMerchantId}
						onSelect={handleMerchantSelect}
					/>
				</div>
			</aside>

			<section class="min-w-0">
				{#if store.viewMode === 'full'}
					<MerchantFullHistory />
				{:else}
					<MerchantQuickView />
				{/if}
			</section>
		</div>
	{:else}
		<div
			class="flex h-72 items-center justify-center rounded-lg border border-dashed border-border bg-muted/10"
		>
			<p class="text-sm text-muted-foreground">
				Choose a partner to see merchants and settlements.
			</p>
		</div>
	{/if}
</div>

<ManagementSettlementDrawer />
