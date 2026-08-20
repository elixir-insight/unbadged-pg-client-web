<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, Dropdown, Modal, toast } from '$lib/components/reusable';
	import { disputeStatusDescription, type DisputeStatusOption } from '$lib/utils/dispute-status';

	interface Props {
		open?: boolean;
		orgId: string;
		disputeId: string;
		currentStatus: string;
		currentStatusLabel: string;
		statuses: DisputeStatusOption[];
	}

	let {
		open = $bindable(false),
		orgId,
		disputeId,
		currentStatus,
		currentStatusLabel,
		statuses
	}: Props = $props();

	let pendingStatus = $state('');
	let statusError = $state('');
	let submitError = $state('');
	let isSubmitting = $state(false);

	const statusOptions = $derived(
		statuses.map((status) => ({
			value: status.value,
			label: status.label
		}))
	);

	const selectedStatusDescription = $derived(disputeStatusDescription(pendingStatus, statuses));

	$effect(() => {
		if (!open) return;
		pendingStatus = currentStatus;
		statusError = '';
		submitError = '';
		isSubmitting = false;
	});

	function closeModal(): void {
		open = false;
	}

	async function confirmChange(): Promise<void> {
		submitError = '';
		if (!pendingStatus) {
			statusError = 'Select a status';
			return;
		}

		if (pendingStatus === currentStatus) {
			closeModal();
			return;
		}

		if (!orgId || !disputeId) {
			submitError = 'Dispute details are required to change status';
			return;
		}

		isSubmitting = true;
		try {
			const payload = {
				status: pendingStatus
			};

			const response = await fetch(
				resolve('/api/management/organizations/[orgId]/disputes/[disputeId]', {
					orgId,
					disputeId
				}),
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}
			);

			const body: { message?: string; status?: string } = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(body.message ?? 'Could not update dispute status');
			}

			toast.success(body.message ?? 'Dispute status updated successfully.');
			closeModal();
			await invalidate('management-disputes:detail');
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Could not update dispute status';
			toast.error('Could not update dispute status', { description: submitError });
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Modal bind:open title="Change Status" contentClass="-mt-16 text-base">
	<div class="flex flex-col gap-3">
		<p class="text-sm font-semibold text-muted-foreground">
			Current status: <span class="font-medium text-foreground">{currentStatusLabel}</span>
		</p>
		<div class="flex flex-col gap-2">
			<span class="text-sm font-medium text-foreground">New status</span>
			<Dropdown
				name="pending-dispute-status"
				ariaLabel="New status"
				value={pendingStatus || undefined}
				options={statusOptions}
				placeholder="Select status"
				disabled={statusOptions.length === 0}
				expand
				side="bottom"
				avoidCollisions={false}
				onValueChange={(value) => {
					pendingStatus = value;
					statusError = '';
				}}
			/>
			{#if selectedStatusDescription}
				<div
					class="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3"
					role="status"
				>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-semibold text-primary">Description</p>
						<p class="mt-1 text-sm font-medium text-foreground">{selectedStatusDescription}</p>
					</div>
				</div>
			{/if}
			{#if statusError}
				<p class="text-xs text-destructive">{statusError}</p>
			{/if}
		</div>
		{#if submitError}
			<p class="text-xs text-destructive">{submitError}</p>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" class="w-full sm:w-auto" onclick={closeModal}>Cancel</Button>
			<Button
				class="w-full sm:w-auto"
				onclick={confirmChange}
				disabled={isSubmitting || statusOptions.length === 0}
			>
				{#if isSubmitting}
					<span
						class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></span>
					Updating…
				{:else}
					Confirm change
				{/if}
			</Button>
		</div>
	{/snippet}
</Modal>
