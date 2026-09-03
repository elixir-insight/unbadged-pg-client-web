<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { submitOnboarding } from '$lib/api/onboarding';
	import { Button } from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { ReviewCard, StepShell } from '$lib/components/self-onboarding';
	import {
		DOCUMENT_LABELS,
		allRequiredComplete,
		maskAccountNumber,
		visibleDocumentKeys
	} from '$lib/components/self-onboarding/validation';
	import { CheckCircle2 } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';

	let submitting = $state(false);
	let submitError = $state('');
	let applicationId = $state('');
	let submitted = $state(false);

	const data = $derived(onboarding.formData);
	const complete = $derived(allRequiredComplete(data));
	const docKeys = $derived(visibleDocumentKeys(data.documents));

	function documentStatus(
		uploaded: boolean,
		required: boolean
	): { label: string; variant: 'success' | 'error' | 'warning' } {
		if (uploaded) return { label: 'Uploaded', variant: 'success' };
		if (required) return { label: 'Missing', variant: 'error' };
		return { label: 'Optional · Skipped', variant: 'warning' };
	}

	async function handleSubmit() {
		if (!complete || submitting) return;
		submitting = true;
		submitError = '';
		onboarding.commitCurrentAddressFromContact();
		const result = await submitOnboarding(onboarding.formData);
		submitting = false;
		if (!result.success) {
			submitError = result.error;
			return;
		}
		onboarding.completeStep(7);
		applicationId = result.applicationId;
		submitted = true;
	}
</script>

{#if submitted}
	<StepShell>
		<div class="flex flex-col items-center py-8 text-center">
			<div class="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
				<CheckCircle2 class="size-8" />
			</div>
			<h3 class="mt-6 text-base font-semibold">Application Submitted</h3>
			<p class="mt-2 max-w-md text-sm text-muted-foreground">
				Your application is in review. This typically takes up to 2 business days. We'll notify you
				once it's complete.
			</p>
			<p class="mt-4 font-mono text-sm tracking-wide text-primary">{applicationId}</p>
			<Button class="mt-8" onclick={() => goto(resolve('/management'))}>Go to Dashboard</Button>
		</div>
	</StepShell>
{:else}
	<StepShell>
		<div class="flex flex-col gap-4">
			<ReviewCard title="Business Information" editPath="business-details">
				<div class="grid gap-2 text-sm">
					<div class="flex flex-col gap-0.5 md:flex-row md:justify-between md:gap-4">
						<span class="text-muted-foreground">PAN</span>
						<span class="font-mono tracking-wide break-all">{data.businessPan || '—'}</span>
					</div>
					<div class="flex flex-col gap-0.5 md:flex-row md:justify-between md:gap-4">
						<span class="text-muted-foreground">Entity Type</span>
						<span class="md:text-right">{data.entityName || '—'}</span>
					</div>
					<div class="flex flex-col gap-0.5 md:flex-row md:justify-between md:gap-4">
						<span class="text-muted-foreground">GSTIN</span>
						<span class="font-mono tracking-wide break-all">{data.gstin || '—'}</span>
					</div>
					<div class="flex flex-col gap-0.5 md:flex-row md:justify-between md:gap-4">
						<span class="text-muted-foreground">Company Name</span>
						<span class="md:text-right">{data.businessDetails.companyName || '—'}</span>
					</div>
					<div class="flex flex-col gap-0.5 md:flex-row md:justify-between md:gap-4">
						<span class="text-muted-foreground">Brand Name</span>
						<span class="md:text-right">{data.businessDetails.brandName || '—'}</span>
					</div>
				</div>
			</ReviewCard>

			<ReviewCard title="Bank Information" editPath="bank-details">
				<div class="grid gap-2 text-sm">
					<div class="flex flex-col gap-0.5 md:flex-row md:justify-between md:gap-4">
						<span class="text-muted-foreground">Account Holder</span>
						<span class="md:text-right">{data.bankDetails.accountHolderName || '—'}</span>
					</div>
					<div class="flex flex-col gap-0.5 md:flex-row md:justify-between md:gap-4">
						<span class="text-muted-foreground">Account Number</span>
						<span class="font-mono tracking-wide break-all"
							>{maskAccountNumber(data.bankDetails.accountNumber)}</span
						>
					</div>
					<div class="flex flex-col gap-0.5 md:flex-row md:justify-between md:gap-4">
						<span class="text-muted-foreground">IFSC</span>
						<span class="font-mono tracking-wide break-all">{data.bankDetails.ifscCode || '—'}</span
						>
					</div>
					<div class="flex flex-col gap-0.5 md:flex-row md:justify-between md:gap-4">
						<span class="text-muted-foreground">Bank / Branch</span>
						<span class="md:text-right">
							{data.bankDetails.bankName
								? `${data.bankDetails.bankName} — ${data.bankDetails.branchName}`
								: '—'}
						</span>
					</div>
				</div>
			</ReviewCard>

			<ReviewCard title="Directors" editPath="directors">
				{#if data.directors.length === 0}
					<p class="text-sm text-muted-foreground">No directors added.</p>
				{:else}
					<div class="space-y-3">
						{#each data.directors as director (director.pan + director.name)}
							<div class="text-sm">
								<p class="font-medium">{director.name || 'Unnamed'}</p>
								<p class="font-mono text-xs tracking-wide text-muted-foreground">
									{director.pan || '—'}
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
							data.documents[key].uploaded,
							data.documents[key].required
						)}
						<div
							class="flex flex-col gap-1 text-sm md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3"
						>
							<span>{DOCUMENT_LABELS[key]}</span>
							<Chip variant={status.variant}>{status.label}</Chip>
						</div>
					{/each}
				</div>
			</ReviewCard>

			{#if submitError}
				<p class="text-sm text-destructive">{submitError}</p>
			{/if}
		</div>

		{#snippet footer()}
			<Button disabled={submitting || !complete} onclick={handleSubmit}>
				{submitting ? 'Submitting…' : 'Submit'}
			</Button>
		{/snippet}
	</StepShell>
{/if}
