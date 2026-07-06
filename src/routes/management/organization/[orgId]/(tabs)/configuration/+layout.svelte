<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { organizations } from '$lib/data/mockData';
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import { AgreementActivationPanel } from '$lib/components/organization';
	import { getOrganizationOrgContext } from '../../organization-org.svelte';
	import { CONFIG_SERVICE_TABS, type ConfigServiceTabKey } from './service-tabs';

	let { children } = $props();

	const orgState = getOrganizationOrgContext();

	const orgId = $derived(page.params.orgId ?? '');
	const org = $derived(organizations.find((o) => o.id === orgId));

	const isPartnerOrReseller = $derived(
		org?.profileType === 'PARTNER' || org?.profileType === 'RESELLER'
	);

	const isApproved = $derived(
		orgState.effectiveStatus.toUpperCase().replace(/\s+/g, '_') === 'APPROVED'
	);

	const configLocked = $derived(!isPartnerOrReseller && isApproved && !orgState.agreementUploaded);

	const activeServiceTab = $derived(
		CONFIG_SERVICE_TABS.find((tab) => page.url.pathname.endsWith(`/${tab.key}`))?.key ?? 'payout'
	);

	function serviceTabHref(tabKey: ConfigServiceTabKey) {
		const routes = {
			payout: '/management/organization/[orgId]/configuration/payout',
			payin: '/management/organization/[orgId]/configuration/payin'
		} as const;

		return resolve(routes[tabKey], { orgId });
	}

	function handleViewDocuments() {
		goto(resolve('/management/organization/[orgId]/documents', { orgId }));
	}

	afterNavigate(({ from, to }) => {
		const switchedServiceTab =
			from?.url.pathname.includes('/configuration/') &&
			to?.url.pathname.includes('/configuration/') &&
			from.url.pathname !== to.url.pathname;

		if (switchedServiceTab) {
			document.querySelector<HTMLElement>('.app-shell-content')?.scrollTo({ top: 0 });
		}
	});
</script>

{#key orgState.agreementUploaded}
	{#if configLocked}
		<div in:fade={{ duration: 250 }}>
			<AgreementActivationPanel
				variant="configuration"
				orgName={org?.name}
				agreementUploaded={orgState.agreementUploaded}
				onAgreementChange={(file) => orgState.syncAgreementDocument(file)}
				onViewDocuments={handleViewDocuments}
			/>
		</div>
	{:else}
		<div class="flex flex-col gap-6" in:fade={{ duration: 250 }}>
			<div>
				<h2 class="text-base font-semibold tracking-tight">Service Configuration</h2>
				<p class="mt-0.5 text-sm text-muted-foreground">
					Configure limits, fees, and accounts separately for payin and payout services.
				</p>
			</div>

			<div class="border-b border-border/60">
				<nav aria-label="Service configuration" class="flex gap-6">
					{#each CONFIG_SERVICE_TABS as tab (tab.key)}
						{@const active = tab.key === activeServiceTab}
						<a
							href={serviceTabHref(tab.key)}
							role="tab"
							aria-current={active ? 'page' : undefined}
							class={cn(
								'relative flex shrink-0 items-center gap-2 px-1 py-3 text-sm font-medium transition-colors',
								active
									? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t-full after:bg-primary'
									: 'text-muted-foreground hover:text-foreground'
							)}
						>
							<tab.icon class="size-4" />
							{tab.label}
						</a>
					{/each}
				</nav>
			</div>

			{@render children()}
		</div>
	{/if}
{/key}
