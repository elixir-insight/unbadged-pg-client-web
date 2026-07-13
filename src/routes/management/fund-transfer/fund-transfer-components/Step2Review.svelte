<script lang="ts">
	import { getTransferStore, formatInr, maskAccountNumber } from '../fund-transfer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Chip as Badge } from '$lib/components/ui/badge';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import * as Card from '$lib/components/ui/card';
	import { LockIcon } from '$lib/assets/icons';

	const store = getTransferStore();

	let consentChecked = $state(true);

	const detailRows = $derived([
		...(store.isUpi
			? [{ label: 'UPI ID', value: store.beneficiary.upiId || '—' }]
			: [
					{ label: 'Bank name', value: store.beneficiary.bankName || '—' },
					{ label: 'IFSC code', value: store.beneficiary.ifsc || '—' }
				]),
		{ label: 'Remarks / reference', value: store.remarks || 'No remarks added' }
	]);
</script>

<Card.Root class="mx-auto w-full max-w-xl gap-0 py-0 sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
	<!-- Hero -->
	<div class="bg-primary p-7 text-primary-foreground">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="text-sm opacity-90">Transfer amount</p>
				<p class="font-mono text-4xl font-semibold tracking-tight">{formatInr(store.amount)}</p>
			</div>
			<Badge
				variant="secondary"
				class="border border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground"
			>
				{store.selectedMethod?.label ?? 'Method'}
				{store.selectedMethod?.description.toLowerCase() ?? ''}
			</Badge>
		</div>

		<Separator class="my-4 bg-primary-foreground/20" />

		<div class="flex items-center gap-3">
			<div class="min-w-0 flex-1">
				<p class="truncate text-base font-medium">
					{store.selectedAccount?.name ?? 'Source account'}
				</p>
				<p class="mt-1 truncate font-mono text-sm opacity-80">
					{store.selectedAccount ? maskAccountNumber(store.selectedAccount.accountNumber) : '—'}
				</p>
			</div>
			<div class="min-w-0 flex-1 text-right">
				<p class="truncate text-base font-medium">{store.beneficiary.name || 'Beneficiary'}</p>
				<p class="mt-1 truncate font-mono text-sm opacity-80">
					{store.isUpi
						? store.beneficiary.upiId || '—'
						: maskAccountNumber(store.beneficiary.accountNumber || '')}
				</p>
			</div>
		</div>
	</div>

	<Card.Content class="space-y-8 py-8">
		<!-- Grouped detail list -->
		<div class="space-y-4">
			{#each detailRows as row (row.label)}
				<div class="flex items-start justify-between gap-4 text-sm">
					<span class="text-muted-foreground">{row.label}</span>
					<span class="text-right font-mono font-medium">{row.value}</span>
				</div>
			{/each}
		</div>

		<!-- Consent -->
		<div class="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/15 px-4 py-4">
			<Checkbox id="payout-consent" bind:checked={consentChecked} class="mt-0.5" />
			<Label for="payout-consent" class="text-sm font-normal text-warning">
				This transfer complies with our payout policy and the beneficiary details are verified.
			</Label>
		</div>

		<!-- Security notice -->
		<p class="flex items-center gap-2 text-sm text-muted-foreground">
			<LockIcon class="size-4 shrink-0" />
			An OTP will go to your registered mobile and email. Don't share it with anyone.
		</p>
	</Card.Content>

	<Card.Footer class="gap-3 pb-8">
		<Button variant="outline" class="flex-1" onclick={() => store.prevStep()}>Edit details</Button>
		<Button
			class="flex-1"
			disabled={!consentChecked}
			onclick={() => {
				store.startOtpCountdown();
				store.nextStep();
			}}
		>
			Send OTP and confirm
		</Button>
	</Card.Footer>
</Card.Root>
