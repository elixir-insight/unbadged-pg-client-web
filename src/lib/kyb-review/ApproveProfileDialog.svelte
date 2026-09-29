<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button, Modal, type RadioOption } from '$lib/components/reusable';
	import { OrganizationProfileForm } from '$lib/components/onboarding';
	import { submitReviewDecision, updateOrganizationProfile } from './api';
	import {
		affiliateIdsFor,
		buildProfilePayload,
		validateProfileForm,
		type ProfileFormOptions,
		type ProfileType
	} from './profile';

	let {
		open = $bindable(false),
		orgId,
		initial,
		options
	}: {
		open?: boolean;
		orgId: string;
		/** The org's current profile, used to pre-fill the form each time the popup opens. */
		initial: { profileType: ProfileType; serviceTypes: string[]; affiliateId: string };
		options: ProfileFormOptions;
	} = $props();

	let profileType = $state('');
	let selectedServiceTypes = $state<string[]>([]);
	let servicePipelines = $state<Record<string, string>>({});
	let affiliateId = $state('');
	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	let busy = $state<'profile' | 'status' | null>(null);
	/** PATCH /profile succeeded; a retry only resends PUT /status. */
	let profileSaved = $state(false);
	let errorMessage = $state('');

	const profileTypeOptions = $derived<RadioOption[]>([
		{ value: 'MERCHANT', label: 'Merchant' },
		{ value: 'PARTNER', label: 'Partner' },
		// Only offered to orgs that already are PLATFORM so approving doesn't silently demote them.
		...(initial.profileType === 'PLATFORM' ? [{ value: 'PLATFORM', label: 'Platform' }] : [])
	]);

	const submitLabel = $derived(
		busy === 'profile'
			? 'Saving profile…'
			: busy === 'status'
				? 'Approving…'
				: profileSaved
					? 'Retry approval'
					: 'Save & Approve'
	);

	function reset() {
		profileType = initial.profileType;
		selectedServiceTypes = [...initial.serviceTypes];
		servicePipelines = {};
		affiliateId = initial.affiliateId;
		errors = {};
		submitAttempted = false;
		profileSaved = false;
		errorMessage = '';
	}

	/** Every close discards unsaved edits, so the next open starts from the org's current profile. */
	function close() {
		open = false;
		reset();
	}

	reset();

	function formInput() {
		return {
			profileType: profileType as ProfileType | '',
			selectedServiceTypes,
			servicePipelines,
			affiliateId
		};
	}

	function validate(): boolean {
		errors = validateProfileForm(formInput());
		return Object.keys(errors).length === 0;
	}

	function toggleService(value: string, checked: boolean) {
		// MerchantConfigSection's switches don't honour `disabled`, so lock them here.
		if (busy || profileSaved) return;
		if (checked) {
			if (!selectedServiceTypes.includes(value)) {
				selectedServiceTypes = [...selectedServiceTypes, value];
			}
		} else {
			selectedServiceTypes = selectedServiceTypes.filter((s) => s !== value);
			const next = { ...servicePipelines };
			delete next[value];
			servicePipelines = next;
			affiliateId = '';
		}
		if (submitAttempted) validate();
	}

	function onPipelineChange() {
		// Keep the pre-filled affiliate while it's still offered for the chosen pipelines.
		if (
			affiliateId &&
			!affiliateIdsFor(formInput(), options.affiliatesByPipeline).has(affiliateId)
		) {
			affiliateId = '';
		}
		if (submitAttempted) validate();
	}

	function errorText(cause: unknown, fallback: string): string {
		const message = cause instanceof Error ? cause.message.trim() : '';
		return message || fallback;
	}

	async function approve() {
		busy = 'status';
		errorMessage = '';
		try {
			await submitReviewDecision(orgId, { profileStatus: 'APPROVED', remarks: '' });
		} catch (cause) {
			errorMessage = errorText(cause, 'Profile saved, but approval failed. Try again.');
			busy = null;
			return;
		}
		busy = null;
		close();
		toast.success('Organization approved');
		await invalidateAll();
	}

	async function saveAndApprove() {
		if (profileSaved) {
			await approve();
			return;
		}

		submitAttempted = true;
		if (!validate()) return;

		busy = 'profile';
		errorMessage = '';
		try {
			await updateOrganizationProfile(orgId, buildProfilePayload(formInput()));
		} catch (cause) {
			errorMessage = errorText(cause, "Couldn't save the organization profile. Try again.");
			busy = null;
			return;
		}
		profileSaved = true;
		await approve();
	}

	function cancel() {
		if (!busy) close();
	}
</script>

<Modal
	bind:open={
		() => open,
		(next) => {
			// Esc, the X and outside clicks can't close the popup mid-request.
			if (!next && busy) return;
			if (next) open = true;
			else close();
		}
	}
	title="Update organization profile"
	contentClass="sm:max-w-2xl"
>
	<div class="space-y-4">
		{#if options.pipelinesError}
			<p
				class="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				role="alert"
			>
				Could not load bank pipelines: {options.pipelinesError}
			</p>
		{/if}

		{#if profileSaved}
			<p
				class="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
			>
				Profile saved. Retrying only sends the approval.
			</p>
		{/if}

		<OrganizationProfileForm
			bind:profileType
			{profileTypeOptions}
			bind:selectedServiceTypes
			bind:servicePipelines
			bind:affiliateId
			{errors}
			availableServiceTypes={options.availableServiceTypes}
			bankPipelinesByService={options.bankPipelinesByService}
			affiliatesByPipeline={options.affiliatesByPipeline}
			onToggleService={toggleService}
			{onPipelineChange}
			disabled={busy !== null || profileSaved}
		/>

		{#if errorMessage}
			<p class="text-sm text-destructive" role="alert">{errorMessage}</p>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex w-full flex-wrap items-center justify-end gap-2">
			<Button variant="outline" disabled={busy !== null} onclick={cancel}>Cancel</Button>
			<Button disabled={busy !== null} onclick={saveAndApprove}>{submitLabel}</Button>
		</div>
	{/snippet}
</Modal>
