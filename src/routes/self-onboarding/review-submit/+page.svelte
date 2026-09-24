<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
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

	let submitting = $state(false);
	let applicationId = $state('');
	let submitted = $state(false);

	const data = $derived(onboarding.formData);
	const details = $derived(data.businessDetails);
	const complete = $derived(allRequiredComplete(data));
	const docKeys = $derived(visibleDocumentKeys(data.documents));
	const readOnly = $derived(onboarding.onboardingStatus === 'read_only');

	function documentStatus(
		uploaded: boolean,
		required: boolean
	): { label: string; variant: 'success' | 'error' | 'warning' } {
		if (uploaded) return { label: 'Uploaded', variant: 'success' };
		if (required) return { label: 'Missing', variant: 'error' };
		return { label: 'Optional · Skipped', variant: 'warning' };
	}

	function addressText(address: typeof details.address): string {
		return (
			formatAddress(address.line1, address.line2, address.city, address.state, address.pincode) ||
			'—'
		);
	}

	function actionErrorMessage(data: unknown): string {
		if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
			return data.error;
		}
		return 'Could not submit your application. Please try again.';
	}

	const onSubmitEnhance: SubmitFunction = ({ cancel }) => {
		if (!complete || submitting) {
			cancel();
			return;
		}
		submitting = true;
		return async ({ result }) => {
			submitting = false;
			if (result.type === 'success') {
				const id =
					result.data && typeof result.data === 'object' && 'applicationId' in result.data
						? result.data.applicationId
						: '';
				applicationId = typeof id === 'string' ? id : '';
				onboarding.completeStep(6);
				submitted = true;
				toast.success('Application submitted.');
				return;
			}
			const message =
				result.type === 'failure'
					? actionErrorMessage(result.data)
					: 'Could not submit your application. Please try again.';
			toast.error(message);
			// Shown as a toast only; an error about another step's fields also takes the user there.
			await routeSaveError(message, 6);
		};
	};
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
	<form id="review-submit-form" method="POST" use:enhance={onSubmitEnhance}></form>

	{#snippet submitFooter()}
		<Button type="submit" form="review-submit-form" disabled={submitting || !complete}>
			{submitting ? 'Submitting…' : 'Submit'}
		</Button>
	{/snippet}

	<StepShell footer={readOnly ? undefined : submitFooter}>
		{#if readOnly}
			<div class="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
				Your application ({onboarding.profileStatus}) is no longer editable.
			</div>
		{/if}
		<div class="flex flex-col gap-5">
			<ReviewCard title="Tax and registration" editPath="business-identity" editable={!readOnly}>
				<div class="grid gap-2 text-sm">
					{@render row('PAN', data.businessPan, true)}
					{@render row('Entity type', data.entityName)}
					{@render row('GSTIN', data.gstin, true)}
					{@render row('CIN', details.cin, true)}
					{@render row('TAN', details.tan, true)}
					{@render row('Industry', details.industry)}
					{@render row('Registered year', details.registeredYear?.toString() ?? '')}
					{@render row('Phone', details.phone)}
					{@render row('Website', details.website)}
				</div>
			</ReviewCard>

			<ReviewCard title="Address" editPath="business-profile" editable={!readOnly}>
				<div class="grid gap-2 text-sm">
					{@render row('Communication address', details.communicationAddress)}
					{@render row('Registered address', addressText(details.address))}
				</div>
			</ReviewCard>

			<ReviewCard title="Bank details" editPath="bank-details" editable={!readOnly}>
				<div class="space-y-4">
					{#each data.bankAccounts as bank, index (index)}
						{#if data.bankAccounts.length > 1}
							<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
								Bank account {index + 1}
							</p>
						{/if}
						<div class="grid gap-2 text-sm">
							{@render row('Account holder', bank.accountHolderName)}
							{@render row('Account number', maskAccountNumber(bank.accountNumber), true)}
							{@render row('IFSC', bank.ifscCode, true)}
							{@render row('Bank', bank.bankName)}
							{@render row('Branch', bank.branchName)}
							{@render row('Account type', bank.accountType)}
						</div>
					{/each}
				</div>
			</ReviewCard>

			<ReviewCard title="Directors" editPath="directors" editable={!readOnly}>
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

			<ReviewCard title="Documents" editPath="documents" editable={!readOnly}>
				<div class="space-y-2">
					{#each docKeys as key (key)}
						{@const status = documentStatus(
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
	</StepShell>
{/if}
