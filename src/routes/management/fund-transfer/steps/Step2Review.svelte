<script lang="ts">
	import { getTransferStore } from '../state/transfer.svelte';
	import { formatInr, maskAccountNumber } from '../types';
	import ReviewSummaryCard from '../components/ReviewSummaryCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Chip as Badge } from '$lib/components/ui/badge';
	import { Wallet, Send, User, FileText } from '$lib/assets/icons';

	const store = getTransferStore();

	const accountRows = $derived([
		{ label: 'Account', value: store.selectedAccount?.name ?? '—' },
		{
			label: 'Number',
			value: store.selectedAccount ? maskAccountNumber(store.selectedAccount.accountNumber) : '—'
		},
		{
			label: 'Balance',
			value: store.selectedAccount ? formatInr(store.selectedAccount.balance) : '—'
		}
	]);

	const methodRows = $derived([
		{ label: 'Method', value: store.selectedMethod?.label ?? '—' },
		{ label: 'Settlement', value: store.selectedMethod?.description ?? '—' },
		{ label: 'Limit', value: store.selectedMethod?.limitLabel ?? '—' }
	]);

	const beneficiaryRows = $derived([
		{ label: 'Name', value: store.beneficiary.name || '—' },
		...(store.isUpi
			? [{ label: 'UPI ID', value: store.beneficiary.upiId || '—' }]
			: [
					{ label: 'Account', value: store.beneficiary.accountNumber || '—' },
					{ label: 'IFSC', value: store.beneficiary.ifsc || '—' },
					{ label: 'Bank', value: store.beneficiary.bankName || '—' }
				])
	]);

	const amountRows = $derived([
		{ label: 'Amount', value: formatInr(store.amount) },
		{ label: 'Remarks', value: store.remarks || '—' }
	]);
</script>

<div class="space-y-4">
	<div class="rounded-xl bg-primary p-4 text-primary-foreground">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="text-sm opacity-90">Total transfer amount</p>
				<p class="text-3xl font-semibold">{formatInr(store.amount)}</p>
			</div>
			<Badge variant="secondary" class="bg-primary-foreground/15 text-primary-foreground">
				{store.selectedMethod?.label ?? 'Method'}
			</Badge>
		</div>
		<p class="mt-2 text-sm opacity-90">
			From {store.selectedAccount?.name ?? 'source account'}
		</p>
	</div>

	<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
		<ReviewSummaryCard title="Source account" icon={Wallet} rows={accountRows} />
		<ReviewSummaryCard title="Transfer method" icon={Send} rows={methodRows} />
		<ReviewSummaryCard title="Beneficiary" icon={User} rows={beneficiaryRows} />
		<ReviewSummaryCard title="Amount & reference" icon={FileText} rows={amountRows} />
	</div>

	<div class="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
		By proceeding, you confirm this transfer complies with your organisation's payout policy and
		that beneficiary details have been verified.
	</div>
	<div class="rounded-lg bg-warning-bg px-4 py-3 text-sm text-warning-foreground">
		An OTP will be sent to your registered mobile and email. Do not share the code with anyone.
	</div>
</div>

<div
	class="sticky bottom-0 z-10 -mx-5 mt-6 flex flex-col gap-3 border-t border-border bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
>
	<Button variant="outline" onclick={() => store.prevStep()}>Edit Details</Button>
	<Button
		onclick={() => {
			store.startOtpCountdown();
			store.nextStep();
		}}
	>
		Send OTP and confirm
	</Button>
</div>
