<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { Check, CheckCircle2 } from '$lib/assets/icons';
	import { cloneOrganization } from '../helpers';
	import PayoutConfigCards from '../components/PayoutConfigCards.svelte';
	import MerchantDetailsCards from '../components/MerchantDetailsCards.svelte';

	let { data } = $props();

	const organization = $derived(data.organization);

	// svelte-ignore state_referenced_locally (draft is a one-time snapshot, manually resynced below when organization.id changes)
	let payoutDraft = $state(cloneOrganization(data.organization.payoutConfiguration));
	// svelte-ignore state_referenced_locally (draft is a one-time snapshot, manually resynced below when organization.id changes)
	let commissionDraft = $state(cloneOrganization(data.organization.commissionRules));
	// svelte-ignore state_referenced_locally (draft is a one-time snapshot, manually resynced below when organization.id changes)
	let kybDraft = $state(cloneOrganization(data.organization.kyb));
	// svelte-ignore state_referenced_locally (draft is a one-time snapshot, manually resynced below when organization.id changes)
	let directorsDraft = $state(cloneOrganization(data.organization.directors));
	// svelte-ignore state_referenced_locally (one-time snapshot used to detect subsequent org changes)
	let lastOrgId = $state(data.organization.id);
	let draftSaved = $state(false);
	let savedClearTimer = $state<ReturnType<typeof setTimeout> | null>(null);

	$effect(() => {
		if (organization.id !== lastOrgId) {
			payoutDraft = cloneOrganization(organization.payoutConfiguration);
			commissionDraft = cloneOrganization(organization.commissionRules);
			kybDraft = cloneOrganization(organization.kyb);
			directorsDraft = cloneOrganization(organization.directors);
			lastOrgId = organization.id;
			clearSavedConfirmation();
		}
	});

	$effect(() => {
		return () => {
			if (savedClearTimer) clearTimeout(savedClearTimer);
		};
	});

	function clearSavedConfirmation() {
		draftSaved = false;
		if (savedClearTimer) {
			clearTimeout(savedClearTimer);
			savedClearTimer = null;
		}
	}

	function saveConfiguration() {
		organization.payoutConfiguration = cloneOrganization(payoutDraft);
		organization.commissionRules = cloneOrganization(commissionDraft);
		Object.assign(organization.kyb, cloneOrganization(kybDraft));
		organization.directors = cloneOrganization(directorsDraft);
		organization.kyb.directors = organization.directors;
		draftSaved = true;
		if (savedClearTimer) clearTimeout(savedClearTimer);
		savedClearTimer = setTimeout(() => {
			draftSaved = false;
			savedClearTimer = null;
		}, 3000);
	}
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
	<div
		class="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-400"
		role="status"
	>
		<CheckCircle2 class="size-3.5 shrink-0" aria-hidden="true" />
		<p>This organization is active — changes save immediately to the live configuration.</p>
	</div>

	<header>
		<h1 class="text-lg font-semibold text-foreground">Manage configuration</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Update payout configuration and merchant details for this organization.
		</p>
	</header>

	<PayoutConfigCards bind:payoutDraft bind:commissionDraft />

	<MerchantDetailsCards bind:kybDraft bind:directorsDraft />

	<div class="flex flex-wrap items-center justify-end gap-3">
		{#if draftSaved}
			<span class="text-sm text-muted-foreground">Saved</span>
		{/if}
		<Button onclick={saveConfiguration}>
			<Check class="size-4" />
			Save configuration
		</Button>
	</div>
</div>
