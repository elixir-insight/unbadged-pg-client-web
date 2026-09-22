<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { isOrgDocumentUploadSupported, submitOnboarding } from '$lib/api/onboarding';
	import { Button } from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { ReviewCard, StepShell } from '$lib/components/self-onboarding';
	import { routeSaveError } from '$lib/components/self-onboarding/navigation';
	import {
		DOCUMENT_LABELS,
		allRequiredComplete,
		formatAddress,
		maskAccountNumber,
		visibleDocumentKeys
	} from '$lib/components/self-onboarding/validation';
	import { CheckCircle2 } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import type { DocumentKey } from '$lib/types/onboarding';

	let submitting = $state(false);
	let submitError = $state('');
	let applicationId = $state('');
	let submitted = $state(false);

	const data = $derived(onboarding.formData);
	const details = $derived(data.businessDetails);
	const complete = $derived(allRequiredComplete(data));
	const docKeys = $derived(visibleDocumentKeys(data.documents));

	function documentStatus(
		key: DocumentKey,
		uploaded: boolean,
		required: boolean
	): { label: string; variant: 'success' | 'error' | 'warning' } {
		if (uploaded) return { label: 'Uploaded', variant: 'success' };
		if (!isOrgDocumentUploadSupported(key)) return { label: 'Upload pending', variant: 'warning' };
		if (required) return { label: 'Missing', variant: 'error' };
		return { label: 'Optional · Skipped', variant: 'warning' };
	}

	function addressText(address: typeof details.address): string {
		return (
			formatAddress(address.line1, address.line2, address.city, address.state, address.pincode) ||
			'—'
		);
	}

	async function handleSubmit() {
		if (!complete || submitting) return;
		submitting = true;
		submitError = '';
		try {
			const result = await submitOnboarding();
			applicationId = result.applicationId;
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: 'Could not submit your application. Please try again.';
			submitError = await routeSaveError(message, 6);
			submitting = false;
			return;
		}
		submitting = false;
		onboarding.completeStep(6);
		submitted = true;
	}
</script>

{#snippet row(label: string, value: string, mono = false)}
	<div class="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
		<span class="text-muted-foreground">{label}</span>
		<span class={['wrap-break-word sm:text-right', mono && 'font-mono tracking-wide']}>
			{value || '—'}
		</span>
	</div>
{/snippet}

{#if submitted}
	<div class="flex h-full items-center justify-center overflow-y-auto p-6">
		<div class="flex flex-col items-center text-center">
			<div class="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
				<CheckCircle2 class="size-8" />
			</div>
			<h1 class="mt-6 text-base font-semibold">Application submitted</h1>
			<p class="mt-2 max-w-md text-sm text-muted-foreground">
				Your application is in review. This typically takes up to 2 business days. We'll notify you
				once it's complete.
			</p>
			{#if applicationId}
				<p class="mt-4 font-mono text-sm tracking-wide text-primary">{applicationId}</p>
			{/if}
			<Button class="mt-8" onclick={() => goto(resolve('/management'))}>Go to dashboard</Button>
		</div>
	</div>
{:else}
	<StepShell error={submitError}>
		<div class="flex flex-col gap-5">
			<ReviewCard title="Business identity" editPath="business-identity">
				<div class="grid gap-2 text-sm">
					{@render row('PAN', data.businessPan, true)}
					{@render row('Entity type', data.entityName)}
					{@render row('GSTIN', data.gstin, true)}
					{@render row('CIN', details.cin, true)}
					{@render row('TAN', details.tan, true)}
					{@render row('Industry', details.industry)}
					{@render row('Registered year', details.registeredYear?.toString() ?? '')}
				</div>
			</ReviewCard>

			<ReviewCard title="Business profile" editPath="business-profile">
				<div class="grid gap-2 text-sm">
					{@render row('Brand name', details.brandName)}
					{@render row('Phone', details.phone)}
					{@render row('Website', details.website)}
					{@render row('Communication address', details.communicationAddress)}
					{@render row('Registered address', addressText(details.address))}
				</div>
			</ReviewCard>

			<ReviewCard title="Bank details" editPath="bank-details">
				<div class="grid gap-2 text-sm">
					{@render row('Account holder', data.bankDetails.accountHolderName)}
					{@render row('Account number', maskAccountNumber(data.bankDetails.accountNumber), true)}
					{@render row('IFSC', data.bankDetails.ifscCode, true)}
					{@render row('Bank', data.bankDetails.bankName)}
					{@render row('Branch', data.bankDetails.branchName)}
					{@render row('Account type', data.bankDetails.accountType)}
				</div>
			</ReviewCard>

			<ReviewCard title="Directors" editPath="directors">
				{#if data.directors.length === 0}
					<p class="text-sm text-muted-foreground">No directors added.</p>
				{:else}
					<div class="space-y-3">
						{#each data.directors as director, index (index)}
							<div class="text-sm">
								<p class="font-medium">{director.name || 'Unnamed'}</p>
								<p class="text-xs text-muted-foreground">
									<span class="font-mono tracking-wide">{director.pan || '—'}</span>
									· {director.email || '—'} · {director.phone || '—'}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</ReviewCard>

			<ReviewCard title="Documents" editPath="documents">
				<div class="space-y-2">
					{#each docKeys as key (key)}
						{@const status = documentStatus(
							key,
							data.documents[key].uploaded,
							data.documents[key].required
						)}
						<div
							class="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
						>
							<span>{DOCUMENT_LABELS[key]}</span>
							<Chip variant={status.variant}>{status.label}</Chip>
						</div>
					{/each}
				</div>
			</ReviewCard>
		</div>

		{#snippet footer()}
			<Button disabled={submitting || !complete} onclick={handleSubmit}>
				{submitting ? 'Submitting…' : 'Submit'}
			</Button>
		{/snippet}
	</StepShell>
{/if}
