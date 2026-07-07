<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { organizations } from '$lib/data/mockData';
	import { Avatar, Chip, Dropdown, Modal, Button } from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { MailIcon, PhoneIcon, LockIcon } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { breadcrumb } from '$lib/stores/breadcrumb.svelte';
	import { formatStatusLabel } from '$lib/utils/status_rename';
	import { ORG_TABS, type TabKey } from '../tabs';
	import { getOrganizationOrgContext } from '../organization-org.svelte';

	let { children } = $props();

	const orgState = getOrganizationOrgContext();

	const orgId = $derived(page.params.orgId ?? '');
	const org = $derived(organizations.find((o) => o.id === orgId));

	const isPartnerOrReseller = $derived(
		org?.profileType === 'PARTNER' || org?.profileType === 'RESELLER'
	);

	const tabs = $derived(
		isPartnerOrReseller ? ORG_TABS.filter((t) => t.key !== 'configuration') : ORG_TABS
	);

	const activeTabKey = $derived(
		ORG_TABS.find((tab) => {
			if (tab.key === 'configuration') {
				return page.url.pathname.includes('/configuration');
			}
			return page.url.pathname.endsWith(`/${tab.key}`);
		})?.key ?? 'kyb'
	);

	function normalizeStatus(status: string): string {
		return status.toUpperCase().replace(/\s+/g, '_');
	}

	const effectiveStatus = $derived(orgState.effectiveStatus);
	const isApproved = $derived(normalizeStatus(effectiveStatus) === 'APPROVED');
	const isActive = $derived(normalizeStatus(effectiveStatus) === 'ACTIVE');
	const showStatusChange = $derived(isApproved || isActive);
	const configTabLocked = $derived(
		!isPartnerOrReseller && isApproved && !orgState.agreementUploaded
	);

	const statusChangeOptions = $derived(
		isApproved
			? [{ value: 'IN_PROGRESS', label: formatStatusLabel('IN_PROGRESS') }]
			: [
					{ value: 'ON_HOLD', label: formatStatusLabel('ON_HOLD') },
					{ value: 'FROZEN', label: formatStatusLabel('FROZEN') }
				]
	);

	const pendingStatusLabel = $derived(
		orgState.pendingStatusChange ? formatStatusLabel(orgState.pendingStatusChange) : ''
	);

	const statusVariantMap: Record<string, BadgeVariant> = {
		PENDING: 'warning',
		IN_REVIEW: 'info',
		IN_PROGRESS: 'alert',
		APPROVED: 'success',
		ACTIVE: 'success',
		ON_HOLD: 'warning',
		FROZEN: 'error',
		REJECTED: 'error'
	};

	const statusVariant = $derived(statusVariantMap[normalizeStatus(effectiveStatus)] ?? 'secondary');

	interface OrgInfoPart {
		icon: typeof MailIcon;
		text: string;
	}

	const orgInfoParts = $derived(
		[
			{ icon: MailIcon, text: orgState.detail.email },
			{ icon: PhoneIcon, text: orgState.detail.phone }
		].filter((part): part is OrgInfoPart => !!part.text)
	);

	function tabHref(tabKey: TabKey) {
		const routes = {
			kyb: '/management/organization/[orgId]/kyb',
			account: '/management/organization/[orgId]/account',
			documents: '/management/organization/[orgId]/documents',
			integration: '/management/organization/[orgId]/integration',
			configuration: '/management/organization/[orgId]/configuration/payout'
		} as const;

		return resolve(routes[tabKey], { orgId });
	}

	function handleStatusChange(status: string) {
		orgState.requestStatusChange(status);
	}

	function confirmStatusChange() {
		const nextStatus = orgState.pendingStatusChange;
		if (!nextStatus) return;
		orgState.confirmStatusChange();
		toast.success(`Organization status changed to ${formatStatusLabel(nextStatus)}`);
	}

	function cancelStatusChange() {
		orgState.cancelStatusChange();
	}

	$effect(() => {
		if (org && orgState.orgStatusOverride === null) {
			orgState.baseStatus = org.status;
		}
	});

	$effect(() => {
		if (!orgState.showStatusConfirmModal) {
			orgState.resetStatusModal();
		}
	});

	$effect(() => {
		if (isPartnerOrReseller && activeTabKey === 'configuration') {
			goto(resolve('/management/organization/[orgId]/kyb', { orgId }));
		}
	});

	$effect(() => {
		if (org) {
			breadcrumb.set([
				{ label: 'Organizations', href: '/management/organization' },
				{ label: org.name, href: `/management/organization/${org.id}/kyb` }
			]);
		}
		return () => breadcrumb.clear();
	});
</script>

{#if org}
	<div data-app-shell-bleed class="-m-5 flex min-h-full flex-col">
		<div class="sticky top-0 z-10 bg-background">
			<div class="relative overflow-hidden" style="background: var(--gradient-card)">
				<div class="gradient-primary absolute inset-x-0 top-0 h-0.5"></div>

				<div
					class="flex flex-col gap-4 px-4 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pb-5"
				>
					<div class="flex items-center gap-4">
						<Avatar name={org.name} size="lg" shape="square" />
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h1 class="text-xl font-bold tracking-tight sm:text-2xl">{org.name}</h1>
								<Chip variant={statusVariant}>{formatStatusLabel(effectiveStatus)}</Chip>
							</div>
							<div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
								{#each orgInfoParts as part, i (part.text + i)}
									{#if i > 0}
										<span class="text-border">•</span>
									{/if}
									<span class="inline-flex items-center gap-1">
										<part.icon class="size-3.5 shrink-0" />
										{part.text}
									</span>
								{/each}
								{#if orgInfoParts.length > 0}
									<span class="text-border">•</span>
								{/if}
								<span>{formatStatusLabel(org.profileType)}</span>
								<span class="text-border">•</span>
								<span>{formatStatusLabel(org.businessType)}</span>
							</div>
						</div>
					</div>

					{#if showStatusChange}
						<div class="w-full shrink-0 sm:w-52">
							<p class="mb-1.5 text-xs font-medium text-muted-foreground">Change status</p>
							<Dropdown
								bind:value={orgState.statusChangeSelection}
								options={statusChangeOptions}
								placeholder="Select status"
								onValueChange={handleStatusChange}
							/>
						</div>
					{/if}
				</div>
			</div>

			<div class="border-b border-border/60 bg-background/98 backdrop-blur-sm">
				<nav aria-label="Organization sections" class="flex px-4 sm:px-6">
					{#each tabs as tab (tab.key)}
						{@const locked = tab.key === 'configuration' && configTabLocked}
						{@const active = tab.key === activeTabKey}
						<a
							href={tabHref(tab.key)}
							role="tab"
							aria-current={active ? 'page' : undefined}
							title={locked ? 'Upload agreement document to unlock Configuration' : undefined}
							class={cn(
								'relative flex shrink-0 items-center gap-1.5 px-4 py-3.5 text-sm font-medium transition-colors',
								active
									? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t-full after:bg-primary'
									: locked
										? 'text-muted-foreground/60 hover:text-muted-foreground'
										: 'text-muted-foreground hover:text-foreground'
							)}
						>
							{#if locked}
								<LockIcon class="size-3.5 shrink-0" aria-hidden="true" />
							{/if}
							{tab.label}
						</a>
					{/each}
				</nav>
			</div>
		</div>

		<div class="overflow-x-clip p-4 sm:p-6">
			{@render children()}
		</div>
	</div>
{:else}
	<div class="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground">
		Organization not found.
	</div>
{/if}

<Modal title="Are you sure?" bind:open={orgState.showStatusConfirmModal}>
	<div class="space-y-5">
		<p class="text-sm text-muted-foreground">
			Are you sure you want to change the status from {formatStatusLabel(effectiveStatus)} to
			{pendingStatusLabel}?
		</p>
		<div class="flex justify-end gap-2 border-t border-border pt-4">
			<Button variant="outline" onclick={cancelStatusChange}>Cancel</Button>
			<Button class="gradient-primary text-primary-foreground" onclick={confirmStatusChange}>
				Yes, Change Status
			</Button>
		</div>
	</div>
</Modal>
