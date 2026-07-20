<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Button, Modal, Textarea } from '$lib/components/reusable';
	import { Check, MessageSquareWarning } from '$lib/assets/icons';
	import { formatLabel } from '../helpers';
	import {
		statusChangeRequiresRemarks,
		type OperationalProfileStatus,
		type StatusTransition
	} from '../operational-status';

	let {
		open = $bindable(false),
		orgId,
		transition,
		onSuccess
	}: {
		open?: boolean;
		orgId: string;
		transition: StatusTransition;
		onSuccess?: (status: OperationalProfileStatus) => void;
	} = $props();

	let remarks = $state('');
	let remarksError = $state('');
	let submitting = $state(false);

	const { current: currentStatus, next: nextStatus } = $derived(transition);
	const requiresRemarks = $derived(statusChangeRequiresRemarks(nextStatus));

	const title = $derived.by(() => {
		if (nextStatus === 'ON_HOLD') return 'Put organization on hold';
		if (nextStatus === 'FROZEN') return 'Freeze organization';
		return 'Reactivate organization';
	});

	const description = $derived.by(() => {
		if (nextStatus === 'ON_HOLD') {
			return 'Processing will pause until the profile is reactivated or escalated to frozen.';
		}
		if (nextStatus === 'FROZEN') {
			return 'This escalates the on-hold profile to frozen. A remark is required for the audit trail.';
		}
		return 'The organization will resume normal processing.';
	});

	const submitLabel = $derived.by(() => {
		if (nextStatus === 'ON_HOLD') return 'Put on hold';
		if (nextStatus === 'FROZEN') return 'Freeze';
		return 'Reactivate';
	});

	const successMessage = $derived.by(() => {
		if (nextStatus === 'ON_HOLD') return 'Organization put on hold';
		if (nextStatus === 'FROZEN') return 'Organization frozen';
		return 'Organization reactivated';
	});

	const formAction = $derived(
		`${resolve('/management/organizations/[orgId]', { orgId })}?/updateStatus`
	);

	function resetForm() {
		remarks = '';
		remarksError = '';
	}

	function closeModal() {
		open = false;
		resetForm();
	}

	$effect(() => {
		if (open) {
			resetForm();
		}
	});

	const onSubmitEnhance: SubmitFunction = ({ formData, cancel }) => {
		remarksError = '';
		const trimmedRemarks = remarks.trim();

		if (requiresRemarks && !trimmedRemarks) {
			remarksError = 'A remark is required when freezing an organization.';
			cancel();
			return;
		}

		formData.set('profileStatus', nextStatus);
		formData.set('remarks', trimmedRemarks);

		submitting = true;
		return async ({ result, update }) => {
			submitting = false;

			if (result.type === 'failure') {
				const message =
					result.data &&
					typeof result.data === 'object' &&
					'message' in result.data &&
					typeof result.data.message === 'string'
						? result.data.message
						: 'Something went wrong';
				toast.error('Failed to update status', { description: message });
				await update({ reset: false });
				return;
			}

			if (result.type === 'success') {
				closeModal();
				onSuccess?.(nextStatus);
				toast.success(successMessage);
				await invalidate('org');
			}

			await update({ reset: false });
		};
	};
</script>

<Modal bind:open {title} {description}>
	<form
		id="change-org-status-form"
		method="POST"
		action={formAction}
		use:enhance={onSubmitEnhance}
		class="space-y-4"
	>
		<input type="hidden" name="profileStatus" value={nextStatus} />

		<div class="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
			<p class="text-muted-foreground">
				Current status:
				<span class="font-medium text-foreground">{formatLabel(currentStatus)}</span>
			</p>
			<p class="text-muted-foreground">
				Next status: <span class="font-medium text-foreground">{formatLabel(nextStatus)}</span>
			</p>
		</div>

		{#if requiresRemarks}
			<div class="space-y-2">
				<Textarea
					bind:value={remarks}
					label="Remarks"
					required
					placeholder="Why is this organization being frozen?"
					disabled={submitting}
					aria-invalid={remarksError ? 'true' : undefined}
				/>
				{#if remarksError}
					<p class="text-sm text-destructive">{remarksError}</p>
				{/if}
			</div>

			<div class="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
				<MessageSquareWarning class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<p class="text-sm text-muted-foreground">
					Only the frozen status requires remarks. Putting an organization on hold does not.
				</p>
			</div>
		{:else if nextStatus === 'ON_HOLD'}
			<div class="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
				<MessageSquareWarning class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<p class="text-sm text-muted-foreground">
					No remark is sent for on hold. Use freeze later if you need to record a reason.
				</p>
			</div>
		{/if}
	</form>

	{#snippet footer()}
		<div class="flex gap-2">
			<Button variant="ghost" class="flex-1" disabled={submitting} onclick={closeModal}
				>Cancel</Button
			>
			<Button
				type="submit"
				form="change-org-status-form"
				class="flex-1"
				variant={nextStatus === 'FROZEN'
					? 'destructive'
					: nextStatus === 'ON_HOLD'
						? 'destructive'
						: 'default'}
				disabled={submitting}
			>
				<Check class="size-4" />
				{submitting ? 'Saving…' : submitLabel}
			</Button>
		</div>
	{/snippet}
</Modal>
