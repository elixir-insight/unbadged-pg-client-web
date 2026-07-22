<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- scoped tab hrefs append query params after resolve() */
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Dropdown } from '$lib/components/reusable';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { gotoScopedPath, scopedListHref, setScope } from '$lib/utils/transaction-scope.svelte';
	import {
		getDefaultScope,
		resolveScopeFromMerchantsAndVans
	} from '$lib/utils/management-merchant-catalog';

	let { data, children } = $props();

	const merchants = $derived(data.merchants);
	const vans = $derived(data.vans);
	const scope = $derived(
		resolveScopeFromMerchantsAndVans(
			merchants,
			vans,
			page.url.searchParams.get('merchantId') ?? data.selectedOrgId,
			page.url.searchParams.get('vanId')
		) ??
			getDefaultScope(merchants, vans) ?? { orgId: '', vanId: '' }
	);

	const merchantOptions = $derived(
		merchants.map((merchant) => ({
			value: merchant.orgId,
			label: merchant.merchantName
		}))
	);

	const vanOptions = $derived(
		vans.map((van) => ({
			value: van.vanId,
			label: van.vanNumber
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

		const defaultScope = getDefaultScope(merchants, vans);
		if (!defaultScope?.orgId) return;

		if (path === resolve('/management/transactions')) {
			if (merchantSession.hasPayinAccess()) {
				gotoScopedPath('/management/transactions/collections/payments', defaultScope);
			} else if (merchantSession.hasPayoutAccess()) {
				gotoScopedPath('/management/transactions/disbursements', defaultScope);
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

	// After merchant change, VANs reload; pick the first VAN when current selection is invalid.
	$effect(() => {
		const orgId = scope.orgId;
		if (!orgId || vans.length === 0) return;

		const hasSelectedVan = vans.some((van) => van.vanId === scope.vanId);
		if (hasSelectedVan) return;

		const nextVanId = vans[0]?.vanId;
		if (!nextVanId) return;
		setScope({ orgId, vanId: nextVanId });
	});

	function collectionsTabHref(): string {
		if (page.url.pathname.includes('/collections/orders')) {
			return scopedListHref('/management/transactions/collections/orders', scope);
		}
		return scopedListHref('/management/transactions/collections/payments', scope);
	}

	function onMerchantChange(orgId: string): void {
		setScope({ orgId, vanId: '' });
	}

	function onVanChange(vanId: string): void {
		const orgId = page.url.searchParams.get('merchantId') || scope.orgId;
		if (!orgId) return;
		setScope({ orgId, vanId });
	}
</script>

<div class="flex flex-col gap-4">
	{#if !isDetailPage}
		<div
			class="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-sm sm:flex-row sm:items-end"
		>
			<div class="w-full sm:max-w-xs">
				<p class="mb-1.5 text-xs font-medium text-muted-foreground">Merchant</p>
				<Dropdown
					value={scope.orgId}
					placeholder={data.merchantsError ? 'Failed to load merchants' : 'Select merchant'}
					disabled={merchantOptions.length === 0}
					bordered={true}
					search={true}
					options={merchantOptions}
					onValueChange={onMerchantChange}
				/>
				{#if data.merchantsError}
					<p class="mt-1.5 text-xs text-destructive">{data.merchantsError}</p>
				{/if}
			</div>
			<div class="w-full sm:max-w-xs">
				<p class="mb-1.5 text-xs font-medium text-muted-foreground">Virtual Account (VAN)</p>
				<Dropdown
					value={scope.vanId}
					placeholder={data.vansError ? 'Failed to load VANs' : 'Select VAN'}
					disabled={vanOptions.length === 0}
					bordered={true}
					search={false}
					options={vanOptions}
					onValueChange={onVanChange}
				/>
				{#if data.vansError}
					<p class="mt-1.5 text-xs text-destructive">{data.vansError}</p>
				{/if}
			</div>
		</div>

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
