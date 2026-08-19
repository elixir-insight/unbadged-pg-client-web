<script lang="ts">
	import { FileText, Landmark } from '$lib/assets/icons';
	import { Chip, CopyButton } from '$lib/components/reusable';
	import ChangeDisputeStatusModal from '$lib/components/transactions/disputes/change-dispute-status-modal.svelte';
	import DisputeStatusBadge from '$lib/components/transactions/disputes/dispute-status-badge.svelte';
	import DisputeStatusOverview from '$lib/components/transactions/disputes/dispute-status-overview.svelte';
	import DisputeTimeline from '$lib/components/transactions/disputes/dispute-timeline.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const dispute = $derived(data.dispute);
	let statusChangeOpen = $state(false);
</script>

{#snippet copyableValue(label: string, value: string)}
	<div class="flex items-center justify-end gap-2 sm:justify-start">
		<span class="text-sm font-medium text-foreground">{value}</span>
		{#if value !== '—'}
			<CopyButton {value} label="Copy {label}" />
		{/if}
	</div>
{/snippet}

{#snippet detailRow(label: string, value: string)}
	<div class="grid grid-cols-2 items-center gap-6">
		<p class="text-sm text-muted-foreground">{label}</p>
		<p class="min-w-0 text-sm font-medium text-foreground">{value}</p>
	</div>
{/snippet}

{#if !dispute}
	<div class="rounded-xl border border-border bg-background p-8 text-center shadow-sm">
		<p class="text-sm font-medium text-foreground">Dispute not found</p>
		<p class="mt-1 text-xs text-muted-foreground">
			{data.disputeError ?? 'This dispute is not available.'}
		</p>
	</div>
{:else}
	<div class="flex flex-col gap-5">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex flex-wrap items-center gap-3">
				<h1 class="text-2xl font-semibold tracking-tight text-foreground">#{dispute.disputeId}</h1>
				<DisputeStatusBadge status={dispute.status} catalog={data.statusOptions} />
			</div>
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

					<div class="mt-6 grid min-w-0 gap-8 lg:grid-cols-2 lg:divide-x lg:divide-border">
						<div class="flex min-w-0 flex-col gap-5 lg:pr-8">
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
							{@render detailRow('Pipeline', dispute.pipelineCode)}
							{@render detailRow('Organization', dispute.organization)}
							<div class="grid grid-cols-2 items-center gap-6">
								<p class="text-sm text-muted-foreground">Amount</p>
								<p class="text-sm font-medium text-foreground">{dispute.amount}</p>
							</div>
							<div class="grid grid-cols-2 items-center gap-6">
								<p class="text-sm text-muted-foreground">Source</p>
								<p>
									<Chip variant="secondary">{dispute.sourceLabel}</Chip>
								</p>
							</div>
						</div>

						<div class="flex min-w-0 flex-col gap-5 lg:pl-8">
							{@render detailRow('Bank reference number', dispute.bankRefNumber)}
							{@render detailRow('Raised on', dispute.raisedOn)}
							{@render detailRow('Evidence due by', dispute.evidenceDueBy)}
							{@render detailRow('Assigned to', dispute.assignedTo)}
							{@render detailRow('Raised by', dispute.raisedBy)}
							{@render detailRow('Reason code', dispute.reasonCode)}
							{@render detailRow('Resolved by', dispute.resolvedBy)}
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
							<p class="text-sm text-muted-foreground">Gateway description</p>
							<p class="text-sm whitespace-pre-wrap text-foreground">
								{dispute.gatewayDescription}
							</p>
						</div>
						<div
							class="grid gap-3 px-4 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start sm:gap-6"
						>
							<p class="text-sm text-muted-foreground">Pipeline description</p>
							<p class="text-sm whitespace-pre-wrap text-foreground">
								{dispute.pipelineDescription}
							</p>
						</div>
						<div
							class="grid gap-3 px-4 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start sm:gap-6"
						>
							<p class="text-sm text-muted-foreground">Resolution notes</p>
							<p class="text-sm whitespace-pre-wrap text-foreground">{dispute.resolutionNotes}</p>
						</div>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-5 xl:sticky xl:top-4">
				<DisputeStatusOverview
					status={dispute.status}
					catalog={data.statusOptions}
					evidenceDueBy={dispute.evidenceDueByRaw}
					changeDisabled={data.statusOptions.length === 0}
					onChangeStatus={() => (statusChangeOpen = true)}
				/>
				<DisputeTimeline events={data.events} eventsError={data.eventsError} />
			</div>
		</div>
	</div>
	<ChangeDisputeStatusModal
		bind:open={statusChangeOpen}
		orgId={data.orgId}
		disputeId={dispute.disputeId}
		currentStatus={dispute.status}
		currentStatusLabel={dispute.statusLabel}
		statuses={data.statusOptions}
	/>
{/if}
