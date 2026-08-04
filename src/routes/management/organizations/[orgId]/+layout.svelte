<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { setContext } from 'svelte';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/reusable';
	import { MessageSquareWarning, XCircle } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { breadcrumb, type BreadcrumbItem } from '$lib/stores/breadcrumb.svelte';
	import ChangeOrganizationStatusModal from './components/ChangeOrganizationStatusModal.svelte';
	import { ORG_LAYOUT_CONTEXT_KEY, type OrgLayoutContext } from './layout-context';
	import {
		createFreezeTransition,
		createPutOnHoldTransition,
		createReactivateTransition,
		type OperationalProfileStatus,
		type StatusTransition
	} from './operational-status';
	import { getOrganizationSectionBreadcrumbLabel } from './helpers';

	let { data, children } = $props();

	let revision = $state(0);
	let changeStatusOpen = $state(false);
	let statusTransition = $state<StatusTransition | null>(null);

	afterNavigate(() => {
		revision += 1;
	});

	const organization = $derived.by(() => {
		void revision;
		return data.organization;
	});

	const statusBanner = $derived.by(() => {
		if (organization.status === 'ON_HOLD') {
			return {
				variant: 'secondary' as BadgeVariant,
				icon: MessageSquareWarning,
				title: 'Organization is on hold',
				description:
					'Processing is paused. Reactivate to resume, or freeze the profile if escalation is required.'
			};
		}
		if (organization.status === 'FROZEN') {
			return {
				variant: 'secondary' as BadgeVariant,
				icon: MessageSquareWarning,
				title: 'Organization is frozen',
				description:
					'Processing is fully paused. Reactivate when the outstanding issue has been cleared.'
			};
		}
		if (organization.status === 'REJECTED') {
			return {
				variant: 'destructive' as BadgeVariant,
				icon: XCircle,
				title: 'Application was rejected',
				description:
					'Review the failed KYB/documents feedback and resubmit the missing or corrected information.'
			};
		}
		return null;
	});

	function openPutOnHold() {
		if (organization.status !== 'ACTIVE') return;
		statusTransition = createPutOnHoldTransition();
		changeStatusOpen = true;
	}

	function openFreeze() {
		if (organization.status !== 'ON_HOLD') return;
		statusTransition = createFreezeTransition();
		changeStatusOpen = true;
	}

	function openReactivate() {
		if (organization.status !== 'ON_HOLD' && organization.status !== 'FROZEN') return;
		statusTransition = createReactivateTransition(organization.status);
		changeStatusOpen = true;
	}

	function handleStatusUpdated(nextStatus: OperationalProfileStatus) {
		organization.status = nextStatus;
		statusTransition = null;
		revision += 1;
	}

	setContext<OrgLayoutContext>(ORG_LAYOUT_CONTEXT_KEY, {
		bumpRevision: () => {
			revision += 1;
		},
		openPutOnHold,
		openFreeze,
		openReactivate
	});

	$effect(() => {
		const org = organization;
		const pathname = page.url.pathname.split('?')[0] ?? '';
		const orgHref = resolve('/management/organizations/[orgId]', { orgId: org.id });
		const items: BreadcrumbItem[] = [
			{ label: 'Organizations', href: resolve('/management/organizations') },
			{ label: org.name, href: orgHref }
		];

		const sectionLabel = getOrganizationSectionBreadcrumbLabel(pathname);
		if (sectionLabel) {
			items.push({ label: sectionLabel, href: pathname });
		}

		breadcrumb.set(items);
		return () => breadcrumb.clear();
	});
</script>

<div class="space-y-6">
	{#if statusBanner}
		<div
			class={cn(
				'rounded-xl border p-4',
				statusBanner.variant === 'destructive'
					? 'border-destructive/30 bg-destructive/5'
					: 'border-border/60 bg-muted/20'
			)}
		>
			<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div class="flex items-start gap-3">
					<statusBanner.icon class="mt-0.5 size-5 text-muted-foreground" />
					<div class="space-y-1">
						<p class="text-sm font-semibold">{statusBanner.title}</p>
						<p class="text-sm text-muted-foreground">{statusBanner.description}</p>
					</div>
				</div>
				{#if organization.status === 'ON_HOLD'}
					<div class="flex shrink-0 flex-wrap gap-2">
						<Button variant="outline" onclick={openReactivate}>Reactivate</Button>
						<Button variant="destructive" onclick={openFreeze}>Freeze</Button>
					</div>
				{:else if organization.status === 'FROZEN'}
					<Button variant="outline" class="shrink-0" onclick={openReactivate}>Reactivate</Button>
				{/if}
			</div>
		</div>
	{/if}

	{@render children()}

	{#if statusTransition}
		<ChangeOrganizationStatusModal
			bind:open={changeStatusOpen}
			orgId={organization.id}
			transition={statusTransition}
			onSuccess={handleStatusUpdated}
		/>
	{/if}
</div>
