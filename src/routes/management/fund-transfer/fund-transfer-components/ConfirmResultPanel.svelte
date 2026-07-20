<script lang="ts">
	import { getTransferStore, formatInr, maskAccountNumber } from '../fund-transfer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Check, XCircle, FileClock } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	const store = getTransferStore();

	const showIdle = $derived(
		store.confirmStepStatus === 'pending' && !store.otpVerified && store.txnStatus !== 'processing'
	);

	const showSuccess = $derived(
		store.otpVerified &&
			store.confirmStepStatus !== 'failed' &&
			(store.txnStatus === 'processing' || store.txnStatus === 'success')
	);

	const showFailure = $derived(store.confirmStepStatus === 'failed');

	const formattedDate = $derived(
		store.txnProcessedAt
			? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(store.txnProcessedAt)
				)
			: '—'
	);

	const statusLabel = $derived(
		store.txnStatus === 'processing'
			? 'Processing'
			: store.txnStatus === 'success'
				? 'Completed'
				: '—'
	);

	const toAccountLabel = $derived(
		store.isUpi
			? store.beneficiary.upiId || '—'
			: store.beneficiary.accountNumber
				? maskAccountNumber(store.beneficiary.accountNumber)
				: '—'
	);

	const fromAccountLabel = $derived(
		store.selectedAccount
			? `${store.selectedAccount.name} ${maskAccountNumber(store.selectedAccount.accountNumber)}`
			: '—'
	);

	const failureReason = $derived(
		store.otpVerified
			? store.txnFailureReason || 'Payment could not be completed.'
			: 'Maximum OTP verification attempts exceeded.'
	);
</script>

{#if showIdle}
	<div class="flex min-h-[28rem] flex-col items-center justify-center px-6 py-10 text-center">
		<span
			class="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
		>
			<FileClock class="size-6" />
		</span>
		<h3 class="text-base font-semibold text-foreground">Awaiting verification</h3>
		<p class="mt-2 max-w-xs text-sm text-muted-foreground">
			Your transfer result will appear here once you enter and verify the OTP.
		</p>
	</div>
{:else if showSuccess}
	<div class="flex min-h-[28rem] flex-col">
		<div class="bg-primary px-8 py-8 text-center text-primary-foreground">
			<span
				class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success text-success-foreground"
			>
				<Check class="size-7" strokeWidth={2.5} />
			</span>
			<p class="text-base font-semibold">Payment successful</p>
			<p class="mt-1 text-sm text-primary-foreground/80">
				To {store.beneficiary.name || 'beneficiary'}
			</p>
			<p class="mt-3 text-[1.75rem] leading-none font-bold">{formatInr(store.amount)}</p>
		</div>

		<div class="flex flex-1 flex-col px-6 py-2">
			<dl class="flex-1 text-sm">
				<div
					class="flex items-center justify-between gap-4 border-b border-dashed border-border py-3"
				>
					<dt class="text-muted-foreground">Reference ID</dt>
					<dd class="font-mono text-xs font-medium text-primary">{store.txnRef || '—'}</dd>
				</div>
				<div
					class="flex items-center justify-between gap-4 border-b border-dashed border-border py-3"
				>
					<dt class="text-muted-foreground">From account</dt>
					<dd class="text-right font-medium">{fromAccountLabel}</dd>
				</div>
				<div
					class="flex items-center justify-between gap-4 border-b border-dashed border-border py-3"
				>
					<dt class="text-muted-foreground">To account</dt>
					<dd class="text-right font-medium">{toAccountLabel}</dd>
				</div>
				<div
					class="flex items-center justify-between gap-4 border-b border-dashed border-border py-3"
				>
					<dt class="text-muted-foreground">Method</dt>
					<dd class="font-medium">{store.selectedMethod?.label ?? '—'}</dd>
				</div>
				<div
					class="flex items-center justify-between gap-4 border-b border-dashed border-border py-3"
				>
					<dt class="text-muted-foreground">Status</dt>
					<dd
						class={cn(
							'font-medium text-primary',
							store.txnStatus === 'processing' && 'animate-pulse'
						)}
					>
						{statusLabel}
					</dd>
				</div>
				<div class="flex items-center justify-between gap-4 py-3">
					<dt class="text-muted-foreground">Date &amp; time</dt>
					<dd class="font-medium">{formattedDate}</dd>
				</div>
			</dl>

			<Button href="/management/transactions" class="mt-4 w-full">View transaction history</Button>
		</div>
	</div>
{:else if showFailure}
	<div class="flex min-h-[28rem] flex-col">
		<div class="bg-primary px-8 py-8 text-center text-primary-foreground">
			<span
				class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
			>
				<XCircle class="size-7" strokeWidth={2.5} />
			</span>
			<p class="text-base font-semibold">Payment failed</p>
			<p class="mt-1 text-sm text-primary-foreground/80">
				To {store.beneficiary.name || 'beneficiary'}
			</p>
			<p class="mt-3 text-[1.75rem] leading-none font-bold">{formatInr(store.amount)}</p>
		</div>

		<div class="flex flex-1 flex-col px-6 py-2">
			<dl class="flex-1 text-sm">
				<div
					class="flex items-start justify-between gap-4 border-b border-dashed border-border py-3"
				>
					<dt class="shrink-0 text-muted-foreground">Reason</dt>
					<dd class="max-w-[60%] text-right font-medium text-destructive">{failureReason}</dd>
				</div>
				{#if !store.otpVerified}
					<div
						class="flex items-center justify-between gap-4 border-b border-dashed border-border py-3"
					>
						<dt class="text-muted-foreground">Attempts left</dt>
						<dd class="font-medium">0</dd>
					</div>
				{/if}
				<div
					class="flex items-center justify-between gap-4 border-b border-dashed border-border py-3"
				>
					<dt class="text-muted-foreground">From account</dt>
					<dd class="text-right font-medium">{fromAccountLabel}</dd>
				</div>
				<div
					class="flex items-center justify-between gap-4 border-b border-dashed border-border py-3"
				>
					<dt class="text-muted-foreground">To account</dt>
					<dd class="text-right font-medium">{toAccountLabel}</dd>
				</div>
				<div class="flex items-center justify-between gap-4 py-3">
					<dt class="text-muted-foreground">Method</dt>
					<dd class="font-medium">{store.selectedMethod?.label ?? '—'}</dd>
				</div>
			</dl>

			<Button href="/management/transactions" class="mt-4 w-full">View transaction history</Button>
		</div>
	</div>
{/if}
