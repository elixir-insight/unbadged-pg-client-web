<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/reusable';
	import { getReviewOutcome } from '$lib/onboarding/reviewState';
	import { submitReviewDecision } from './api';
	import ApproveProfileDialog from './ApproveProfileDialog.svelte';
	import type { ProfileFormOptions, ProfileType } from './profile';
	import type { FieldReview, ReviewDecision, ReviewSection } from './types';

	let {
		orgId,
		profileStatus,
		sections,
		saved,
		profile,
		profileOptions
	}: {
		orgId: string;
		profileStatus: string;
		/** Current profile, pre-filled into the approve popup. */
		profile: { profileType: ProfileType; serviceTypes: string[]; affiliateId: string };
		profileOptions: ProfileFormOptions;
		sections: ReviewSection[];
		/** Statuses from GET /verifications, keyed by fieldName. */
		saved: Record<string, FieldReview>;
	} = $props();

	let saving = $state(false);
	let approveOpen = $state(false);
	let errorMessage = $state('');

	const labels = $derived<Record<string, string>>(
		Object.fromEntries(
			sections.flatMap((section) => section.fields.map((field) => [field.fieldName, field.label]))
		)
	);

	// Every tracked field counts: the backend refuses approval while any of them is unverified
	// (buildSections puts each one on screen so it can be reviewed).
	const records = $derived(
		Object.entries(saved).map(([fieldName, review]) => ({
			fieldName,
			label: labels[fieldName] ?? fieldName,
			...review
		}))
	);

	const outcome = $derived(getReviewOutcome(records));
	const pendingCount = $derived(records.filter((record) => record.status === 'PENDING').length);
	const rejected = $derived(records.filter((record) => record.status === 'REJECTED'));

	async function decide(decision: ReviewDecision) {
		saving = true;
		errorMessage = '';
		try {
			await submitReviewDecision(orgId, decision);
			await invalidateAll();
		} catch (cause) {
			const message = cause instanceof Error ? cause.message.trim() : '';
			errorMessage = message || "Couldn't complete the review. Try again.";
		} finally {
			saving = false;
		}
	}

	function sendRemarks() {
		const remarks = rejected
			.map((record) => `${record.label}: ${record.remarks || 'Rejected'}`)
			.join('; ');
		void decide({ profileStatus: 'REMARKED', remarks });
	}
</script>

{#if profileStatus === 'IN_REVIEW'}
	<div class="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
		{#if outcome === 'PENDING'}
			<p class="text-sm text-muted-foreground">
				{pendingCount}
				{pendingCount === 1 ? 'field' : 'fields'} still pending review
			</p>
		{:else if outcome === 'REMARKED'}
			<div class="flex flex-col gap-2">
				<p class="text-sm font-medium text-foreground">
					{rejected.length} rejected {rejected.length === 1 ? 'field' : 'fields'} will be sent back to
					the merchant
				</p>
				<ul class="flex flex-col gap-1 text-sm">
					{#each rejected as record (record.fieldName)}
						<li>
							<span class="font-medium text-foreground">{record.label}:</span>
							<span class="text-muted-foreground">{record.remarks || 'No note'}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div class="flex justify-end">
				<Button variant="destructive" disabled={saving} onclick={sendRemarks}>
					{saving ? 'Sending…' : 'Send Remarks'}
				</Button>
			</div>
		{:else}
			<div class="flex flex-wrap items-center justify-between gap-3">
				<p class="text-sm text-foreground">All fields are verified.</p>
				<Button onclick={() => (approveOpen = true)}>Approve</Button>
			</div>
		{/if}

		{#if errorMessage}
			<p class="text-sm text-destructive" role="alert">{errorMessage}</p>
		{/if}
	</div>
{/if}

<ApproveProfileDialog bind:open={approveOpen} {orgId} initial={profile} options={profileOptions} />
