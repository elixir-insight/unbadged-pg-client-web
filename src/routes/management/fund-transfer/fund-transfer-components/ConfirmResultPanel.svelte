<script lang="ts">
	import { resolve } from '$app/paths';
	import { getTransferStore, formatInr, maskAccountNumber } from '../fund-transfer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Check, XCircle } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	const store = getTransferStore();

	const showSuccess = $derived(
		store.otpVerified &&
			store.confirmStepStatus !== 'failed' &&
			(store.txnStatus === 'processing' || store.txnStatus === 'success')
	);

	const showFailure = $derived(store.confirmStepStatus === 'failed');

	const formattedDate = $derived(
		store.txnProcessedAt
			? new Intl.DateTimeFormat('en-IN', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				}).format(new Date(store.txnProcessedAt))
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

{#if showSuccess}
	<div class="flex min-h-[30rem] flex-col sm:min-h-[32rem] lg:min-h-[34rem]">
		<div
			class="bg-primary px-8 py-8 text-center text-primary-foreground sm:px-10 sm:py-10 lg:px-12 lg:py-12"
		>
			<span
				class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success text-success-foreground"
			>
				<Check class="size-7" strokeWidth={2.5} />
			</span>
			<p class="text-base font-semibold">Payment successful</p>
			<p class="mt-1 text-sm text-primary-foreground/80">
				To {store.beneficiary.name || 'beneficiary'}
			</p>
			<p class="mt-3 text-[1.75rem] leading-none font-bold sm:text-[2rem] lg:text-[2.25rem]">
				{formatInr(store.amount)}
			</p>
		</div>

		<div class="flex flex-1 flex-col px-6 py-2 sm:px-8 lg:px-10">
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

			<div class="mt-6 flex flex-row gap-3 border-t border-border pt-6 pb-2 sm:mt-8 sm:pt-8">
				<Button class="flex-1" onclick={() => store.startNewTransfer()}>
					Add new fund transfer
				</Button>
				<Button variant="outline" href={resolve('/management/transactions')} class="flex-1">
					View transactions
				</Button>
			</div>
		</div>
	</div>
{:else if showFailure}
	<div class="flex min-h-[30rem] flex-col sm:min-h-[32rem] lg:min-h-[34rem]">
		<div
			class="bg-primary px-8 py-8 text-center text-primary-foreground sm:px-10 sm:py-10 lg:px-12 lg:py-12"
		>
			<span
				class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
			>
				<XCircle class="size-7" strokeWidth={2.5} />
			</span>
			<p class="text-base font-semibold">Payment failed</p>
			<p class="mt-1 text-sm text-primary-foreground/80">
				To {store.beneficiary.name || 'beneficiary'}
			</p>
			<p class="mt-3 text-[1.75rem] leading-none font-bold sm:text-[2rem] lg:text-[2.25rem]">
				{formatInr(store.amount)}
			</p>
		</div>

		<div class="flex flex-1 flex-col px-6 py-2 sm:px-8 lg:px-10">
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

			<div class="mt-6 flex flex-row gap-3 border-t border-border pt-6 pb-2 sm:mt-8 sm:pt-8">
				<Button class="flex-1" onclick={() => store.startNewTransfer()}>
					Add new fund transfer
				</Button>
				<Button variant="outline" href={resolve('/management/transactions')} class="flex-1">
					View transactions
				</Button>
			</div>
		</div>
	</div>
{/if}
