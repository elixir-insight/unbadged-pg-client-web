<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { FileText, Landmark } from '$lib/assets/icons';
	import {
		Button,
		Chip,
		CopyButton,
		DatePicker,
		Input,
		Modal,
		Textarea,
		Tooltip,
		toast
	} from '$lib/components/reusable';
	import ChangeDisputeStatusModal from '$lib/components/transactions/disputes/change-dispute-status-modal.svelte';
	import DisputeStatusBadge from '$lib/components/transactions/disputes/dispute-status-badge.svelte';
	import DisputeStatusOverview from '$lib/components/transactions/disputes/dispute-status-overview.svelte';
	import DisputeSupportingDocuments from '$lib/components/transactions/disputes/dispute-supporting-documents.svelte';
	import DisputeTimeline from '$lib/components/transactions/disputes/dispute-timeline.svelte';
	import RaiseChargebackModal from '$lib/components/transactions/disputes/raise-chargeback-modal.svelte';
	import { canRaiseChargeback } from '$lib/utils/dispute-status';
	import { userPermissions } from '$lib/stores/rbac';
	import { formatDate, formatEvidenceDueByForApi } from '$lib/utils/format-time';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const canEdit = $derived(userPermissions.can('PAYINS', 'write'));

	const dispute = $derived(data.dispute);
	let statusChangeOpen = $state(false);
	let chargebackOpen = $state(false);
	let confirmOpen = $state(false);
	let isUpdating = $state(false);
	let updateError = $state('');

	let bankRefNumber = $state('');
	let evidenceDueBy = $state('');
	let reasonCode = $state('');
	let gatewayDescription = $state('');
	let pipelineDescription = $state('');
	let resolutionNotes = $state('');
	let syncedFormKey = $state('');

	type DisputeFieldChange = {
		label: string;
		previous: string;
		next: string;
	};

	function toIsoDate(value: string): string {
		const trimmed = value.trim();
		if (!trimmed) return '';
		const iso = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
		if (iso) return iso[1];
		const date = new Date(trimmed);
		if (Number.isNaN(date.getTime())) return '';
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function displayOrEmpty(value: string): string {
		return value.trim() || 'Empty';
	}

	function displayDateOrEmpty(value: string): string {
		const iso = toIsoDate(value);
		if (!iso) return 'Empty';
		return formatDate(iso);
	}

	$effect(() => {
		if (!dispute) return;

		const formKey = [
			dispute.disputeId,
			dispute.bankRefNumber,
			dispute.evidenceDueByRaw,
			dispute.reasonCode,
			dispute.gatewayDescription,
			dispute.pipelineDescription,
			dispute.resolutionNotes
		].join('|');

		if (formKey === syncedFormKey) return;

		syncedFormKey = formKey;
		bankRefNumber = dispute.bankRefNumber;
		evidenceDueBy = toIsoDate(dispute.evidenceDueByRaw);
		reasonCode = dispute.reasonCode;
		gatewayDescription = dispute.gatewayDescription;
		pipelineDescription = dispute.pipelineDescription;
		resolutionNotes = dispute.resolutionNotes;
	});

	const pendingChanges = $derived.by((): DisputeFieldChange[] => {
		if (!dispute) return [];

		const changes: DisputeFieldChange[] = [];
		const currentEvidenceDueBy = toIsoDate(dispute.evidenceDueByRaw);

		if (bankRefNumber !== dispute.bankRefNumber) {
			changes.push({
				label: 'Bank Reference Number',
				previous: displayOrEmpty(dispute.bankRefNumber),
				next: displayOrEmpty(bankRefNumber)
			});
		}
		if (evidenceDueBy !== currentEvidenceDueBy) {
			changes.push({
				label: 'Evidence Due By',
				previous: displayDateOrEmpty(currentEvidenceDueBy),
				next: displayDateOrEmpty(evidenceDueBy)
			});
		}
		if (reasonCode !== dispute.reasonCode) {
			changes.push({
				label: 'Reason Code',
				previous: displayOrEmpty(dispute.reasonCode),
				next: displayOrEmpty(reasonCode)
			});
		}
		if (gatewayDescription !== dispute.gatewayDescription) {
			changes.push({
				label: 'Gateway description',
				previous: displayOrEmpty(dispute.gatewayDescription),
				next: displayOrEmpty(gatewayDescription)
			});
		}
		if (pipelineDescription !== dispute.pipelineDescription) {
			changes.push({
				label: 'Pipeline description',
				previous: displayOrEmpty(dispute.pipelineDescription),
				next: displayOrEmpty(pipelineDescription)
			});
		}
		if (resolutionNotes !== dispute.resolutionNotes) {
			changes.push({
				label: 'Resolution notes',
				previous: displayOrEmpty(dispute.resolutionNotes),
				next: displayOrEmpty(resolutionNotes)
			});
		}

		return changes;
	});

	const hasChanges = $derived(pendingChanges.length > 0);

	function openConfirmModal(): void {
		updateError = '';
		if (!hasChanges) return;
		confirmOpen = true;
	}

	function closeConfirmModal(): void {
		if (isUpdating) return;
		confirmOpen = false;
	}

	async function confirmUpdate(): Promise<void> {
		if (!dispute || !hasChanges) return;

		updateError = '';
		isUpdating = true;
		try {
			const payload: {
				bankRefNumber?: string;
				evidenceDueBy?: string;
				gatewayDescription?: string;
				pipelineDescription?: string;
				reasonCode?: string;
				resolutionNotes?: string;
			} = {};

			if (bankRefNumber !== dispute.bankRefNumber) payload.bankRefNumber = bankRefNumber;
			if (evidenceDueBy !== toIsoDate(dispute.evidenceDueByRaw)) {
				payload.evidenceDueBy = formatEvidenceDueByForApi(evidenceDueBy);
			}
			if (reasonCode !== dispute.reasonCode) payload.reasonCode = reasonCode;
			if (gatewayDescription !== dispute.gatewayDescription) {
				payload.gatewayDescription = gatewayDescription;
			}
			if (pipelineDescription !== dispute.pipelineDescription) {
				payload.pipelineDescription = pipelineDescription;
			}
			if (resolutionNotes !== dispute.resolutionNotes) {
				payload.resolutionNotes = resolutionNotes;
			}

			const response = await fetch(
				resolve('/api/management/organizations/[orgId]/disputes/[disputeId]', {
					orgId: data.orgId,
					disputeId: dispute.disputeId
				}),
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}
			);

			const body: { message?: string } = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(body.message ?? 'Could not update dispute');
			}

			toast.success(body.message ?? 'Dispute updated successfully.');
			confirmOpen = false;
			await invalidate('management-disputes:detail');
		} catch (error) {
			updateError = error instanceof Error ? error.message : 'Could not update dispute';
			toast.error('Could not update dispute', { description: updateError });
		} finally {
			isUpdating = false;
		}
	}
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

{#snippet detailCard(
	id: string,
	label: string,
	value: string,
	onValueChange: (next: string) => void,
	placeholder: string
)}
	<div class="rounded-lg border border-border bg-background p-5">
		<label for={id} class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
			{label}
		</label>
		<Textarea
			{id}
			{value}
			{placeholder}
			rows={3}
			class="mt-2 field-sizing-fixed min-h-0 resize-none overflow-y-auto border-0 bg-transparent p-0 text-sm leading-6 text-foreground shadow-none outline-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
			oninput={(event) => {
				const target = event.currentTarget;
				if (target instanceof HTMLTextAreaElement) onValueChange(target.value);
			}}
		/>
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
			<div class="flex flex-wrap items-center gap-2">
				<Button
					variant="outline"
					disabled={!canRaiseChargeback(dispute.status)}
					onclick={() => (chargebackOpen = true)}
				>
					Raise a chargeback
				</Button>
				{#if canEdit}
					<Button disabled={!hasChanges || isUpdating} onclick={openConfirmModal}>
						Update dispute
					</Button>
				{:else}
					<Tooltip content="You don't have permission to perform this action.">
						<Button disabled>Update dispute</Button>
					</Tooltip>
				{/if}
			</div>
		</div>

		<div class="grid items-start gap-5 xl:grid-cols-3">
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
							{@render detailRow('Raised on', dispute.raisedOn)}
							<div class="grid grid-cols-2 items-center gap-6">
								<p class="text-sm text-muted-foreground">Source</p>
								<p>
									<Chip variant="secondary">{dispute.sourceLabel}</Chip>
								</p>
							</div>
						</div>

						<div class="flex min-w-0 flex-col gap-5 lg:pl-8">
							<fieldset disabled={!canEdit} class="contents">
								<div class="grid grid-cols-2 items-center gap-6">
									<label for="bank-reference-number" class="text-sm font-medium text-foreground">
										Bank Reference Number
									</label>
									<Input
										id="bank-reference-number"
										bind:value={bankRefNumber}
										placeholder="Enter bank reference number"
									/>
								</div>

								<div class="grid grid-cols-2 items-center gap-6">
									<p class="text-sm font-medium text-foreground">Evidence Due By</p>
									<DatePicker bind:value={evidenceDueBy} placeholder="Select a date" />
								</div>
								{@render detailRow('Assigned to', dispute.assignedTo)}
								{@render detailRow('Raised by', dispute.raisedBy)}
								<div class="grid grid-cols-2 items-center gap-6">
									<label for="reason-code" class="text-sm font-medium text-foreground">
										Reason Code
									</label>
									<Input id="reason-code" bind:value={reasonCode} placeholder="Enter reason code" />
								</div>
								{@render detailRow('Resolved by', dispute.resolvedBy)}
							</fieldset>
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

					<div class="mt-6 flex flex-col gap-3">
						<fieldset disabled={!canEdit} class="contents">
							{@render detailCard(
								'gateway-description',
								'Gateway description',
								gatewayDescription,
								(value) => (gatewayDescription = value),
								'Enter gateway description'
							)}
							{@render detailCard(
								'pipeline-description',
								'Pipeline description',
								pipelineDescription,
								(value) => (pipelineDescription = value),
								'Enter pipeline description'
							)}
							{@render detailCard(
								'resolution-notes',
								'Resolution notes',
								resolutionNotes,
								(value) => (resolutionNotes = value),
								'Enter resolution notes'
							)}
						</fieldset>
					</div>
				</div>
			</div>

			<div class="flex min-h-0 flex-col gap-5 overflow-hidden xl:h-0 xl:min-h-full xl:self-stretch">
				<div class="shrink-0">
					<DisputeStatusOverview
						status={dispute.status}
						catalog={data.statusOptions}
						evidenceDueBy={dispute.evidenceDueByRaw}
						changeDisabled={!canEdit || data.statusOptions.length === 0}
						onChangeStatus={() => (statusChangeOpen = true)}
					/>
				</div>
				<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
					<DisputeTimeline events={data.events} eventsError={data.eventsError} />
				</div>
			</div>
		</div>

		<DisputeSupportingDocuments
			mode="management"
			orgId={data.orgId}
			disputeId={dispute.disputeId}
			documents={data.documents}
			documentsError={data.documentsError}
			readOnly={!canEdit}
		/>
	</div>
	<ChangeDisputeStatusModal
		bind:open={statusChangeOpen}
		orgId={data.orgId}
		disputeId={dispute.disputeId}
		currentStatus={dispute.status}
		currentStatusLabel={dispute.statusLabel}
		statuses={data.statusOptions}
	/>
	<RaiseChargebackModal
		bind:open={chargebackOpen}
		orgId={data.orgId}
		disputeId={dispute.disputeId}
		bankReference={bankRefNumber || dispute.bankRefNumber}
		currency={dispute.currency || 'INR'}
		principalAmount={dispute.amountRaw}
	/>
	<Modal
		bind:open={confirmOpen}
		title="Update dispute"
		description="Confirm the updated changes before they are applied."
	>
		<div class="flex flex-col gap-4">
			{#each pendingChanges as change (change.label)}
				<div class="flex flex-col gap-1">
					<p class="text-sm font-medium text-foreground">{change.label}</p>
					<p class="text-sm whitespace-pre-wrap text-muted-foreground">
						{change.previous}
						<span class="text-foreground"> → </span>
						<span class="font-medium text-foreground">{change.next}</span>
					</p>
				</div>
			{/each}
			{#if updateError}
				<p class="text-xs text-destructive">{updateError}</p>
			{/if}
		</div>

		{#snippet footer()}
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					class="w-full sm:w-auto"
					disabled={isUpdating}
					onclick={closeConfirmModal}
				>
					Cancel
				</Button>
				<Button class="w-full sm:w-auto" disabled={isUpdating} onclick={confirmUpdate}>
					{#if isUpdating}
						<span
							class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></span>
						Updating…
					{:else}
						Confirm update
					{/if}
				</Button>
			</div>
		{/snippet}
	</Modal>
{/if}
