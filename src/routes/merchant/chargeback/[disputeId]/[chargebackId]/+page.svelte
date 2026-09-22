<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, CopyButton } from '$lib/components/reusable';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function display(value: string | null | undefined): string {
		const trimmed = value?.trim() ?? '';
		return trimmed || '—';
	}

	function openDispute(): void {
		const disputeId = data.disputeId.trim() || data.chargeback?.disputeId.trim() || '';
		if (!disputeId || disputeId === '—') return;
		goto(resolve('/merchant/dispute/[disputeId]', { disputeId }));
	}

	const chargeback = $derived(data.chargeback);
</script>

<section class="flex flex-col gap-4">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-lg font-semibold text-foreground">Chargeback details</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Details for chargeback raised against this dispute.
			</p>
		</div>
		{#if data.disputeId.trim()}
			<Button variant="outline" onclick={openDispute}>View dispute</Button>
		{/if}
	</div>

	{#if data.chargebackError}
		<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
			<p class="text-sm font-medium text-foreground">Unable to load chargeback</p>
			<p class="mt-1 text-xs text-destructive">{data.chargebackError}</p>
		</div>
	{:else if chargeback}
		<div class="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
			<dl class="grid gap-4 sm:grid-cols-2">
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Chargeback ID
					</dt>
					<dd class="mt-1 flex items-center gap-2 font-mono text-sm text-foreground">
						{display(chargeback.id)}
						{#if chargeback.id.trim() && chargeback.id !== '—'}
							<CopyButton value={chargeback.id} label="Copy chargeback ID" />
						{/if}
					</dd>
				</div>
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Dispute ID
					</dt>
					<dd class="mt-1 flex items-center gap-2 font-mono text-sm text-foreground">
						{display(chargeback.disputeId)}
						{#if chargeback.disputeId.trim() && chargeback.disputeId !== '—'}
							<CopyButton value={chargeback.disputeId} label="Copy dispute ID" />
						{/if}
					</dd>
				</div>
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Chargeback amount
					</dt>
					<dd class="mt-1 text-sm text-foreground">{chargeback.chargebackAmount}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Principal amount
					</dt>
					<dd class="mt-1 text-sm text-foreground">{chargeback.principalAmount}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Additional fees
					</dt>
					<dd class="mt-1 text-sm text-foreground">{chargeback.additionalFees}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Currency
					</dt>
					<dd class="mt-1 text-sm text-foreground">{display(chargeback.currency)}</dd>
				</div>
				<div class="sm:col-span-2">
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Bank reference
					</dt>
					<dd class="mt-1 font-mono text-sm break-all text-foreground">
						{chargeback.bankReference}
					</dd>
				</div>
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Recorded by
					</dt>
					<dd class="mt-1 text-sm text-foreground">{chargeback.recordedBy}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Created at
					</dt>
					<dd class="mt-1 text-sm text-foreground">{chargeback.createdAt}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Updated at
					</dt>
					<dd class="mt-1 text-sm text-foreground">{chargeback.updatedAt}</dd>
				</div>
				<div class="sm:col-span-2">
					<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Notes</dt>
					<dd class="mt-1 text-sm whitespace-pre-wrap text-foreground">
						{display(chargeback.notes)}
					</dd>
				</div>
			</dl>
		</div>
	{/if}
</section>
