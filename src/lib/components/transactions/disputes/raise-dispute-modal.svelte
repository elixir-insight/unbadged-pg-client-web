<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Dropdown, Modal, toast } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { fetchUserDirectory } from '$lib/stores/user-management/users-api';
	import { formatSnakeCaseLabel } from '$lib/utils/format-display';

	const SOURCE_OPTIONS: DropdownOption[] = [
		{ value: 'AGGREGATOR_MANUAL', label: formatSnakeCaseLabel('AGGREGATOR_MANUAL') },
		{ value: 'BANK_MANUAL', label: formatSnakeCaseLabel('BANK_MANUAL') }
	];

	interface Props {
		open?: boolean;
		orgId: string;
		orderId: string;
		pipelineTransactionId: string;
		amountValue: string;
		amountDisplay: string;
		onsuccess?: (result: { disputeId: string; status: string; source: string }) => void;
	}

	let {
		open = $bindable(false),
		orgId,
		orderId,
		pipelineTransactionId,
		amountValue,
		amountDisplay,
		onsuccess
	}: Props = $props();

	let source = $state<string | undefined>(undefined);
	let assignedTo = $state<string | undefined>(undefined);
	let users = $state<DropdownOption[]>([]);
	let usersLoading = $state(false);
	let usersError = $state('');
	let sourceError = $state('');
	let assignedToError = $state('');
	let submitError = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (!open) return;

		source = undefined;
		assignedTo = undefined;
		sourceError = '';
		assignedToError = '';
		submitError = '';
		isSubmitting = false;
		usersError = '';
		void loadUsers();
	});

	async function loadUsers(): Promise<void> {
		usersLoading = true;
		try {
			const directory = await fetchUserDirectory('management');
			users = directory.map((user) => ({
				value: user.id,
				label: user.name.trim() || user.id
			}));
		} catch {
			users = [];
			usersError = 'Could not load users';
		} finally {
			usersLoading = false;
		}
	}

	function validate(): boolean {
		sourceError = source ? '' : 'Select a source';
		assignedToError = assignedTo ? '' : 'Select an assignee';
		return !sourceError && !assignedToError;
	}

	async function handleSubmit(): Promise<void> {
		submitError = '';
		if (!validate()) return;

		if (!orgId) {
			submitError = 'Organization is required to raise a dispute';
			return;
		}

		if (!orderId || orderId === '—') {
			submitError = 'Order ID is unavailable for this payment';
			return;
		}

		if (!pipelineTransactionId) {
			submitError = 'Pipeline transaction ID is unavailable for this payment';
			return;
		}

		if (!amountValue) {
			submitError = 'Amount is unavailable for this payment';
			return;
		}

		isSubmitting = true;
		try {
			const payload = {
				actorType: 'user',
				amount: amountValue,
				assignedTo,
				currency: 'INR',
				orderId,
				pipelineTransactionId,
				source,
				status: 'DISPUTE_RAISED'
			};
			console.log('raise dispute request', { orgId, payload });

			const response = await fetch(
				resolve('/api/management/organizations/[orgId]/disputes', { orgId }),
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}
			);

			const body: { message?: string; disputeId?: string; status?: string } = await response
				.json()
				.catch(() => ({}));

			if (!response.ok) {
				throw new Error(body.message ?? 'Could not raise dispute');
			}

			if (!body.disputeId) {
				throw new Error('Dispute was created but no dispute ID was returned');
			}

			toast.success(body.message ?? 'Dispute created successfully.');
			onsuccess?.({
				disputeId: body.disputeId,
				status: body.status ?? 'DISPUTE_RAISED',
				source: source ?? ''
			});
			open = false;
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Could not raise dispute';
			toast.error('Could not raise dispute', { description: submitError });
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Modal bind:open title="Raise a dispute" description="Assign this dispute and confirm the source.">
	<div class="flex flex-col gap-5">
		<div class="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
			<p class="text-xs font-medium text-muted-foreground">Amount</p>
			<p class="text-sm font-semibold text-foreground">{amountDisplay}</p>
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-foreground">
				Source <span class="text-destructive">*</span>
			</span>
			<Dropdown
				bind:value={source}
				options={SOURCE_OPTIONS}
				placeholder="Select source"
				ariaLabel="Dispute source"
				onValueChange={() => (sourceError = '')}
			/>
			{#if sourceError}
				<p class="text-xs text-destructive">{sourceError}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-foreground">
				Assigned to <span class="text-destructive">*</span>
			</span>
			<Dropdown
				bind:value={assignedTo}
				options={users}
				placeholder={usersLoading ? 'Loading users…' : 'Select user'}
				ariaLabel="Assigned to"
				search
				disabled={usersLoading || users.length === 0}
				onValueChange={() => (assignedToError = '')}
			/>
			{#if usersError}
				<p class="text-xs text-destructive">{usersError}</p>
			{:else if assignedToError}
				<p class="text-xs text-destructive">{assignedToError}</p>
			{/if}
		</div>

		{#if submitError}
			<p class="text-xs text-destructive">{submitError}</p>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" class="w-full sm:w-auto" onclick={() => (open = false)}>
				Cancel
			</Button>
			<Button
				variant="destructive"
				class="w-full sm:w-auto"
				onclick={handleSubmit}
				disabled={isSubmitting || usersLoading}
			>
				{#if isSubmitting}
					<span
						class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></span>
					Raising…
				{:else}
					Raise dispute
				{/if}
			</Button>
		</div>
	{/snippet}
</Modal>
