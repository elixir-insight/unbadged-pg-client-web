<script lang="ts">
	import { Drawer, CopyButton } from '$lib/components/reusable';
	import { CheckCircle2, Clock, XCircle } from '$lib/assets/icons';
	import type { Settlement } from '$lib/types/settlement';

	let {
		open = $bindable(false),
		settlement,
		currency,
		dateTimeFormatter
	}: {
		open?: boolean;
		settlement: Settlement;
		currency: Intl.NumberFormat;
		dateTimeFormatter: Intl.DateTimeFormat;
	} = $props();
</script>

<Drawer bind:open direction="right" title="Deposit status">
	<div class="flex flex-col gap-4">
		{#if settlement.status === 'settled'}
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
				>
					<CheckCircle2 class="size-5" />
				</div>
				<div>
					<p class="text-sm font-semibold text-foreground">Settlement deposited</p>
					<p class="text-xs text-muted-foreground">
						{settlement.settledOn ? dateTimeFormatter.format(new Date(settlement.settledOn)) : '—'}
					</p>
				</div>
			</div>

			<div class="rounded-lg border border-border p-4">
				<p class="text-xs text-muted-foreground">Net amount deposited</p>
				<p class="mt-1 font-mono text-xl font-semibold text-foreground">
					{currency.format(settlement.netAmount)}
				</p>
			</div>

			<div class="flex items-center justify-between rounded-lg border border-border p-4">
				<div>
					<p class="text-xs text-muted-foreground">UTR</p>
					<p class="font-mono text-sm text-foreground">{settlement.utr}</p>
				</div>
				{#if settlement.utr}
					<CopyButton value={settlement.utr} label="Copy UTR" />
				{/if}
			</div>

			<p class="text-xs text-muted-foreground">
				If funds haven't arrived in your bank account, contact your bank and quote UTR
				<span class="font-mono text-foreground">{settlement.utr}</span>.
			</p>
		{:else if settlement.status === 'processing'}
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning"
				>
					<Clock class="size-5" />
				</div>
				<div>
					<p class="text-sm font-semibold text-foreground">Settlement in progress</p>
					<p class="text-xs text-muted-foreground">
						Expected {settlement.expectedOn
							? dateTimeFormatter.format(new Date(settlement.expectedOn))
							: '—'}
					</p>
				</div>
			</div>

			<div class="rounded-lg border border-border p-4">
				<p class="text-xs text-muted-foreground">Estimated net amount</p>
				<p class="mt-1 font-mono text-xl font-semibold text-foreground">
					{currency.format(settlement.netAmount)}
				</p>
			</div>

			<div class="rounded-lg border border-border p-4">
				<p class="text-xs text-muted-foreground">UTR</p>
				<p class="text-sm italic text-muted-foreground">Assigned after processing</p>
			</div>

			<p class="text-xs text-muted-foreground">
				A UTR will appear here once this settlement has been processed and deposited.
			</p>
		{:else}
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
				>
					<XCircle class="size-5" />
				</div>
				<div>
					<p class="text-sm font-semibold text-foreground">Settlement failed</p>
					<p class="text-xs text-muted-foreground">This settlement could not be deposited.</p>
				</div>
			</div>
			<p class="text-xs text-muted-foreground">
				Contact support with settlement ID <span class="font-mono text-foreground"
					>{settlement.id}</span
				>
				for the reason and next steps.
			</p>
		{/if}
	</div>
</Drawer>
