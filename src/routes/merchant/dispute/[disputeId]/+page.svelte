<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { FileText, Landmark } from '$lib/assets/icons';
	import { Chip, CopyButton } from '$lib/components/reusable';
	import DisputeStatusBadge from '$lib/components/transactions/disputes/dispute-status-badge.svelte';
	import DisputeStatusOverview from '$lib/components/transactions/disputes/dispute-status-overview.svelte';
	import DisputeSupportingDocuments from '$lib/components/transactions/disputes/dispute-supporting-documents.svelte';
	import DisputeTimeline from '$lib/components/transactions/disputes/dispute-timeline.svelte';
	import { getStoredDispute, type StoredDispute } from '$lib/utils/management-disputes';

	let loaded = $state(false);
	let dispute = $state<StoredDispute | null>(null);

	function formatDate(value: string): string {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '—';

		return new Intl.DateTimeFormat('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(date);
	}

	onMount(() => {
		dispute = getStoredDispute(page.params.disputeId ?? '') ?? null;
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
	</div>
{:else if dispute}
	<div class="flex flex-col gap-5">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">#{dispute.disputeId}</h1>
			<DisputeStatusBadge status={dispute.status} class="uppercase" />
		</div>

		<div class="grid items-stretch gap-5 xl:grid-cols-3">
			<div class="flex flex-col gap-5 xl:col-span-2">
				<div class="rounded-xl border border-border bg-background p-6 shadow-sm">
					<div class="flex items-center gap-3">
						<span
							class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<Landmark class="size-5" />
						</span>
						<h2 class="text-base font-semibold text-foreground">Dispute Information</h2>
					</div>

					<div class="mt-6 grid gap-8 lg:grid-cols-2 lg:divide-x lg:divide-border">
						<div class="flex flex-col gap-5 lg:pr-8">
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
						</div>

						<div class="flex flex-col gap-5 lg:pl-8">
							{@render detailRow('Status', dispute.status)}
							{@render detailRow('Bank Reference Number', dispute.bankReferenceNumber || '—')}
							{@render detailRow('Raised On', dispute.raisedOn)}
							{@render detailRow('Evidence Due By', formatDate(dispute.evidenceDueBy))}
							{@render detailRow('Reason Code', dispute.reasonCode || '—')}
							{@render detailRow('Resolved By', dispute.resolvedBy || '—')}
						</div>
					</div>
				</div>

				<div class="rounded-xl border border-border bg-background p-6 shadow-sm">
					<div class="flex items-center gap-3">
						<span
							class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<FileText class="size-5" />
						</span>
						<h2 class="text-base font-semibold text-foreground">Dispute Details</h2>
					</div>

					<div class="mt-6 divide-y divide-border rounded-xl border border-border">
						<div
							class="grid gap-3 px-4 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start sm:gap-6"
						>
							<p class="text-sm text-muted-foreground">Gateway Description</p>
							<p class="text-sm whitespace-pre-wrap text-foreground">
								{dispute.gatewayDescription || '—'}
							</p>
						</div>
						<div
							class="grid gap-3 px-4 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start sm:gap-6"
						>
							<p class="text-sm text-muted-foreground">Pipeline Description</p>
							<p class="text-sm whitespace-pre-wrap text-foreground">
								{dispute.pipelineDescription || '—'}
							</p>
						</div>
						<div
							class="grid gap-3 px-4 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start sm:gap-6"
						>
							<p class="text-sm text-muted-foreground">Resolution Notes</p>
							<p class="text-sm whitespace-pre-wrap text-foreground">
								{dispute.resolutionNotes || '—'}
							</p>
						</div>
					</div>
				</div>
				<DisputeSupportingDocuments mode="merchant" />
			</div>

			<div class="flex flex-col gap-5 xl:sticky xl:top-4">
				<DisputeStatusOverview status={dispute.status} evidenceDueBy={dispute.evidenceDueBy} />
				<DisputeTimeline
					status={dispute.status}
					evidenceDueBy={dispute.evidenceDueBy}
					raisedOn={dispute.raisedOn}
				/>
			</div>
		</div>
	</div>
{/if}
