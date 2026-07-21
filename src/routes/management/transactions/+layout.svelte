<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- scoped tab hrefs append query params after resolve() */
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Dropdown } from '$lib/components/reusable';
	import { getMerchantsWithVans, getVansByOrgId } from '$lib/data/management-van-mock';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import {
		getCurrentScope,
		gotoScopedPath,
		scopedListHref,
		setMerchant,
		setVan
	} from '$lib/utils/transaction-scope.svelte';

	let { children } = $props();

	const merchants = getMerchantsWithVans();

	const scope = $derived(getCurrentScope());
	const vans = $derived(getVansByOrgId(scope.orgId));

	const merchantOptions = merchants.map((merchant) => ({
		value: merchant.orgId,
		label: merchant.merchantName
	}));

	const vanOptions = $derived(
		vans.map((van) => ({
			value: van.vanId,
			label: `${van.vanNumber} (${van.vanId})`
		}))
	);

	const tabs = $derived([
		...(merchantSession.hasPayinAccess()
			? [{ label: 'Collections', path: '/management/transactions/collections' as const }]
			: []),
		...(merchantSession.hasPayoutAccess()
			? [{ label: 'Disbursements', path: '/management/transactions/disbursements' as const }]
			: [])
	]);

	const isDetailPage = $derived(
		/\/collections\/orders\/[^/]+$/.test(page.url.pathname) ||
			/\/collections\/payments\/[^/]+$/.test(page.url.pathname) ||
			(page.url.pathname.startsWith(resolve('/management/transactions/disbursements') + '/') &&
				page.url.pathname !== resolve('/management/transactions/disbursements'))
	);

	$effect(() => {
		const path = page.url.pathname;
		if (merchantSession.loading) return;

		if (path === resolve('/management/transactions')) {
			if (merchantSession.hasPayinAccess()) {
				gotoScopedPath('/management/transactions/collections/payments', scope);
			} else if (merchantSession.hasPayoutAccess()) {
				gotoScopedPath('/management/transactions/disbursements', scope);
			} else {
				goto(resolve('/management'));
			}
		} else if (
			path.startsWith(resolve('/management/transactions/collections')) &&
			!merchantSession.hasPayinAccess()
		) {
			goto(resolve('/management'));
		} else if (
			path.startsWith(resolve('/management/transactions/disbursements')) &&
			!merchantSession.hasPayoutAccess()
		) {
			goto(resolve('/management'));
		}
	});

	function collectionsTabHref(): string {
		if (page.url.pathname.includes('/collections/orders')) {
			return scopedListHref('/management/transactions/collections/orders', scope);
		}
		return scopedListHref('/management/transactions/collections/payments', scope);
	}
</script>

<div class="flex flex-col gap-4">
	<div
		class="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-sm sm:flex-row sm:items-end"
	>
		<div class="w-full sm:max-w-xs">
			<p class="mb-1.5 text-xs font-medium text-muted-foreground">Merchant</p>
			<Dropdown
				value={scope.orgId}
				placeholder="Select merchant"
				disabled={false}
				bordered={true}
				search={true}
				options={merchantOptions}
				onValueChange={(value) => setMerchant(value)}
			/>
		</div>
		<div class="w-full sm:max-w-xs">
			<p class="mb-1.5 text-xs font-medium text-muted-foreground">Virtual Account (VAN)</p>
			<Dropdown
				value={scope.vanId}
				placeholder="Select VAN"
				disabled={vanOptions.length === 0}
				bordered={true}
				search={false}
				options={vanOptions}
				onValueChange={(value) => setVan(value)}
			/>
		</div>
	</div>

	{#if !isDetailPage}
		<nav class="flex gap-1 border-b border-border">
			{#each tabs as tab (tab.path)}
				<a
					href={tab.path === '/management/transactions/collections'
						? collectionsTabHref()
						: scopedListHref('/management/transactions/disbursements', scope)}
					class="relative px-3 pb-2 text-sm font-medium transition-colors {page.url.pathname.startsWith(
						resolve(tab.path)
					)
						? '-mb-px border-b-2 border-foreground text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{tab.label}
				</a>
			{/each}
		</nav>
	{/if}

	{@render children()}
</div>
