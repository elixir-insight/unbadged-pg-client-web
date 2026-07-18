<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { setContext } from 'svelte';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { Button, Modal } from '$lib/components/reusable';
	import { Check, MessageSquareWarning, XCircle } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { ORG_LAYOUT_CONTEXT_KEY, type OrgLayoutContext } from './layout-context';

	let { data, children } = $props();

	let revision = $state(0);
	let changeStatusOpen = $state(false);
	let selectedStatusDraft = $state<'ON_HOLD' | 'ACTIVE'>('ON_HOLD');

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
					'Processing is paused until the profile is reactivated or the outstanding issue is cleared.'
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

	function openChangeStatus() {
		selectedStatusDraft = organization.status === 'ACTIVE' ? 'ON_HOLD' : 'ACTIVE';
		changeStatusOpen = true;
	}

	function updateStatusOverride() {
		organization.status = selectedStatusDraft;
		changeStatusOpen = false;
		revision += 1;
	}

	setContext<OrgLayoutContext>(ORG_LAYOUT_CONTEXT_KEY, {
		bumpRevision: () => {
			revision += 1;
		},
		openChangeStatus
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
			<div class="flex items-start gap-3">
				<statusBanner.icon class="mt-0.5 size-5 text-muted-foreground" />
				<div class="space-y-1">
					<p class="text-sm font-semibold">{statusBanner.title}</p>
					<p class="text-sm text-muted-foreground">{statusBanner.description}</p>
				</div>
			</div>
		</div>
	{/if}

	{@render children()}

	<Modal
		bind:open={changeStatusOpen}
		title="Change organization status"
		description="Use the existing status values only; “Frozen” stays UI copy for this step."
	>
		<div class="space-y-3">
			<label class="space-y-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
					>Next status</span
				>
				<select
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
					value={selectedStatusDraft}
					onchange={(event) => {
						selectedStatusDraft = (event.currentTarget as HTMLSelectElement).value as
							| 'ON_HOLD'
							| 'ACTIVE';
					}}
				>
					<option value="ON_HOLD">On Hold</option>
					<option value="ACTIVE">Active</option>
				</select>
			</label>
			<p class="text-sm text-muted-foreground">
				Operational copy can describe this as a “Frozen” override, but the backing mock status
				remains `ON_HOLD`.
			</p>
		</div>
		{#snippet footer()}
			<div class="flex gap-2">
				<Button variant="ghost" class="flex-1" onclick={() => (changeStatusOpen = false)}
					>Cancel</Button
				>
				<Button class="flex-1" onclick={updateStatusOverride}>
					<Check class="size-4" />
					Apply status
				</Button>
			</div>
		{/snippet}
	</Modal>
</div>
