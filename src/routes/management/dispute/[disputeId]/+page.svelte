<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { FileText, Landmark } from '$lib/assets/icons';
	import {
		Button,
		Chip,
		CopyButton,
		DatePicker,
		Dropdown,
		Input,
		Modal,
		Textarea,
		Tooltip
	} from '$lib/components/reusable';
	import DisputeStatusBadge from '$lib/components/transactions/disputes/dispute-status-badge.svelte';
	import DisputeStatusOverview from '$lib/components/transactions/disputes/dispute-status-overview.svelte';
	import DisputeSupportingDocuments from '$lib/components/transactions/disputes/dispute-supporting-documents.svelte';
	import DisputeTimeline from '$lib/components/transactions/disputes/dispute-timeline.svelte';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { userPermissions } from '$lib/stores/rbac';
	import {
		DISPUTE_STATUSES,
		getStoredDispute,
		isDisputeStatus,
		updateStoredDispute,
		type DisputeStatus,
		type StoredDispute
	} from '$lib/utils/management-disputes';

	const canEdit = $derived(userPermissions.can('PAYINS', 'write'));

	const statusOptions = DISPUTE_STATUSES.map((status) => ({ value: status, label: status }));

	let loaded = $state(false);
	let dispute = $state<StoredDispute | null>(null);
	let status = $state<DisputeStatus>('Raised');
	let bankReferenceNumber = $state('');
	let evidenceDueBy = $state('');
	let reasonCode = $state('');
	let resolvedBy = $state('');
	let gatewayDescription = $state('');
	let pipelineDescription = $state('');
	let resolutionNotes = $state('');
	let statusChangeOpen = $state(false);
	let pendingStatus = $state<DisputeStatus>('Raised');

	function openStatusChangeModal(): void {
		pendingStatus = status;
		statusChangeOpen = true;
	}

	function closeStatusChangeModal(): void {
		statusChangeOpen = false;
		pendingStatus = status;
	}

	function updatePendingStatus(value: string): void {
		if (isDisputeStatus(value)) pendingStatus = value;
	}

	function confirmStatusChange(): void {
		if (!dispute) return;
		if (pendingStatus === status) {
			closeStatusChangeModal();
			return;
		}

		status = pendingStatus;
		const updatedDispute: StoredDispute = {
			...dispute,
			status,
			bankReferenceNumber,
			evidenceDueBy,
			reasonCode,
			resolvedBy,
			gatewayDescription,
			pipelineDescription,
			resolutionNotes
		};

		updateStoredDispute(updatedDispute);
		dispute = updatedDispute;
		statusChangeOpen = false;
		toast.success(`Status updated to ${status}`);
	}

	function submitResolution(): void {
		if (!dispute) return;
		if (status !== 'Won' && status !== 'Lost') {
			toast.error('Change the status to Won or Lost before submitting the resolution');
			return;
		}

		const resolver =
			merchantSession.session?.merchantName?.trim() || merchantSession.session?.email?.trim();
		if (!resolver) {
			toast.error('Could not identify the logged-in user');
			return;
		}

		resolvedBy = resolver;

		const updatedDispute: StoredDispute = {
			...dispute,
			status,
			bankReferenceNumber,
			evidenceDueBy,
			reasonCode,
			resolvedBy,
			gatewayDescription,
			pipelineDescription,
			resolutionNotes
		};

		updateStoredDispute(updatedDispute);
		dispute = updatedDispute;
		toast.success(`Dispute resolved by ${resolver}`);
	}

	onMount(() => {
		const storedDispute = getStoredDispute(page.params.disputeId ?? '');
		if (storedDispute) {
			dispute = storedDispute;
			status = storedDispute.status;
			bankReferenceNumber = storedDispute.bankReferenceNumber;
			evidenceDueBy = storedDispute.evidenceDueBy.slice(0, 10);
			reasonCode = storedDispute.reasonCode;
			resolvedBy = storedDispute.resolvedBy;
			gatewayDescription = storedDispute.gatewayDescription;
			pipelineDescription = storedDispute.pipelineDescription;
			resolutionNotes = storedDispute.resolutionNotes;
		}
		loaded = true;
	});
</script>

{#snippet copyableValue(label: string, value: string)}
	<div class="flex items-center gap-2">
		<span class="font-medium text-foreground">{value}</span>
		<CopyButton {value} label="Copy {label}" />
	</div>
{/snippet}

{#snippet detailRow(label: string, value: string)}
	<div class="grid grid-cols-2 items-center gap-6">
		<p class="text-sm text-muted-foreground">{label}</p>
		<p class="min-w-0 text-sm font-medium text-foreground">{value}</p>
	</div>
{/snippet}

{#if loaded && !dispute}
	<div class="rounded-xl border border-border bg-background p-8 text-center shadow-sm">
		<p class="text-sm font-medium text-foreground">Dispute not found</p>
		<p class="mt-1 text-xs text-muted-foreground">
			This dispute is not available in browser storage.
		</p>
		<Button variant="outline" class="mt-4" onclick={() => goto(resolve('/management/dispute'))}>
			Back to disputes
		</Button>
	</div>
{:else if dispute}
	<section class="flex flex-col gap-5">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">#{dispute.disputeId}</h1>
			<DisputeStatusBadge status={dispute.status} class="uppercase" />
		</div>

		<div class="grid items-stretch gap-5 xl:grid-cols-3">
			<div class="flex flex-col gap-5 xl:col-span-2">
				<section class="rounded-xl border border-border bg-background p-6 shadow-sm">
					<div class="flex items-center gap-3">
						<span
							class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<Landmark class="size-5" />
						</span>
						<h2 class="text-base font-semibold text-foreground">Dispute Information</h2>
					</div>

					<div class="mt-6 grid gap-8 lg:grid-cols-2 lg:divide-x lg:divide-border">
						<dl class="flex flex-col gap-5 lg:pr-8">
							<div class="grid grid-cols-2 items-center gap-6">
								<p class="text-sm text-muted-foreground">Dispute ID</p>
								<p>{@render copyableValue('Dispute ID', dispute.disputeId)}</p>
							</div>
							<div class="grid grid-cols-2 items-center gap-6">
								<p class="text-sm text-muted-foreground">Order ID</p>
								<p>{@render copyableValue('Order ID', dispute.orderId)}</p>
							</div>
							<div class="grid grid-cols-2 items-center gap-6">
								<p class="text-sm text-muted-foreground">Transaction ID</p>
								<p>{@render copyableValue('Transaction ID', dispute.transactionId)}</p>
							</div>
							{@render detailRow('Organization', dispute.organization)}
							<div class="grid grid-cols-2 items-center gap-6">
								<p class="text-sm text-muted-foreground">Amount</p>
								<p>
									{`${dispute.amount.replace('₹', '').trim()} ${dispute.currency}`}
								</p>
							</div>
							<div class="grid grid-cols-2 items-center gap-6">
								<p class="text-sm text-muted-foreground">Source</p>
								<p><Chip variant="secondary">{dispute.source}</Chip></p>
							</div>
						</dl>

						<div class="flex flex-col gap-4 lg:pl-8">
							<div class="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
								<span class="text-sm font-medium text-foreground">Status</span>
								<div class="flex flex-wrap items-center gap-3">
									<DisputeStatusBadge {status} class="uppercase" />
									{#if canEdit}
										<Button variant="ghost" size="sm" onclick={openStatusChangeModal}>
											Change Status
										</Button>
									{:else}
										<Tooltip content="You don't have permission to perform this action.">
											<Button variant="ghost" size="sm" disabled>Change Status</Button>
										</Tooltip>
									{/if}
								</div>
							</div>

							<fieldset disabled={!canEdit} class="contents">
								<div class="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
									<label for="bank-reference" class="text-sm font-medium text-foreground">
										Bank Reference Number
									</label>
									<Input id="bank-reference" bind:value={bankReferenceNumber} />
								</div>

								<div class="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
									<label for="evidence-due" class="text-sm font-medium text-foreground">
										Evidence Due By
									</label>
									<DatePicker bind:value={evidenceDueBy} />
								</div>

								<div class="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
									<label for="reason-code" class="text-sm font-medium text-foreground">
										Reason Code
									</label>
									<Input id="reason-code" bind:value={reasonCode} placeholder="Enter reason code" />
								</div>

								<div class="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
									<span class="text-sm font-medium text-foreground">Resolved By</span>
									<p
										class={resolvedBy
											? 'text-sm font-medium text-foreground'
											: 'text-sm text-muted-foreground'}
									>
										{resolvedBy || '—'}
									</p>
								</div>
							</fieldset>
						</div>
					</div>
				</section>

				<section class="rounded-xl border border-border bg-background p-6 shadow-sm">
					<div class="flex items-center gap-3">
						<span
							class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<FileText class="size-5" />
						</span>
						<h2 class="text-base font-semibold text-foreground">Dispute Details</h2>
					</div>

					<div class="mt-6 flex flex-col gap-4">
						<fieldset disabled={!canEdit} class="contents">
							<div
								class="rounded-xl border border-input bg-background p-4 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
							>
								<label
									for="gateway-description"
									class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
								>
									Gateway Description
								</label>
								<Textarea
									id="gateway-description"
									class="mt-1 min-h-16 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
									placeholder="Describe the gateway dispute details..."
									bind:value={gatewayDescription}
								/>
							</div>

							<div
								class="rounded-xl border border-input bg-background p-4 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
							>
								<label
									for="pipeline-description"
									class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
								>
									Pipeline Description
								</label>
								<Textarea
									id="pipeline-description"
									class="mt-1 min-h-16 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
									placeholder="Describe the pipeline dispute details..."
									bind:value={pipelineDescription}
								/>
							</div>

							<div
								class="rounded-xl border border-input bg-background p-4 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
							>
								<label
									for="resolution-notes"
									class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
								>
									Resolution Notes
								</label>
								<Textarea
									id="resolution-notes"
									class="mt-1 min-h-16 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
									placeholder="Add internal resolution notes, evidence summary and next steps..."
									bind:value={resolutionNotes}
								/>
							</div>
						</fieldset>
					</div>
				</section>
			</div>

			<aside class="flex flex-col gap-5 xl:sticky xl:top-4">
				<DisputeStatusOverview {status} {evidenceDueBy} />
				<DisputeTimeline {status} {evidenceDueBy} raisedOn={dispute.raisedOn} />
			</aside>
		</div>

		<DisputeSupportingDocuments readOnly={!canEdit} />

		<div class="flex justify-end border-t border-border pt-5">
			{#if canEdit}
				<Button size="lg" onclick={submitResolution}>Submit Resolution</Button>
			{/if}
		</div>

		<Modal
			bind:open={statusChangeOpen}
			title="Change Status"
			description="Confirm the new dispute status before applying this change."
		>
			<div class="flex flex-col gap-3">
				<p class="text-sm text-muted-foreground">
					Current status: <span class="font-medium text-foreground">{status}</span>
				</p>
				<div class="flex flex-col gap-2">
					<span class="text-sm font-medium text-foreground">New status</span>
					<Dropdown
						name="pending-dispute-status"
						ariaLabel="New status"
						value={pendingStatus}
						options={statusOptions}
						onValueChange={updatePendingStatus}
					/>
				</div>
			</div>

			{#snippet footer()}
				<Button variant="outline" onclick={closeStatusChangeModal}>Cancel</Button>
				<Button onclick={confirmStatusChange}>Confirm change</Button>
			{/snippet}
		</Modal>
	</section>
{/if}
