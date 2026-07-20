<script lang="ts">
	import { getTransferStore } from '../fund-transfer.svelte';
	import VirtualAccountCombobox from './VirtualAccountCombobox.svelte';
	import TransferMethodPicker from './TransferMethodPicker.svelte';
	import BeneficiaryForm from './BeneficiaryForm.svelte';
	import AmountField from './AmountField.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Wallet, Send, User } from '$lib/assets/icons';

	const store = getTransferStore();
</script>

<div class="space-y-4">
	<Card.Root>
		<Card.Content class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
			<div class="flex min-w-0 shrink-0 items-start gap-3 sm:max-w-xs">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
				>
					<Wallet class="size-4" />
				</span>
				<div class="min-w-0">
					<p class="leading-none font-medium">Source virtual account</p>
					<p class="mt-1.5 text-sm text-muted-foreground">
						Choose the account to debit for this payout.
					</p>
				</div>
			</div>
			<div class="min-w-0 flex-1">
				<VirtualAccountCombobox
					accounts={store.accounts}
					value={store.selectedAccount}
					onSelect={(account) => store.selectAccount(account)}
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<div class="flex items-start gap-3">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
				>
					<Send class="size-4" />
				</span>
				<div>
					<Card.Title>Transfer method</Card.Title>
					<Card.Description>Select how funds should reach the beneficiary.</Card.Description>
				</div>
			</div>
		</Card.Header>
		<Card.Content>
			<TransferMethodPicker
				methods={store.methods}
				value={store.selectedMethod}
				onSelect={(method) => store.selectMethod(method)}
			/>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<div class="flex items-start gap-3">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
				>
					<User class="size-4" />
				</span>
				<div>
					<Card.Title>Beneficiary details</Card.Title>
					<Card.Description>Enter recipient information and transfer amount.</Card.Description>
				</div>
			</div>
		</Card.Header>
		<Card.Content class="space-y-4">
			<BeneficiaryForm
				method={store.selectedMethod}
				bind:beneficiary={store.beneficiary}
				bind:remarks={store.remarks}
			/>

			{#if store.selectedAccount}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<AmountField limit={store.selectedAccount.limit} bind:value={store.amount} />
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<div
	class="sticky bottom-0 z-10 -mx-5 mt-6 flex flex-col gap-3 border-t border-border bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
>
	<Button variant="ghost" onclick={() => store.clearStep1()}>Clear</Button>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<p class="text-sm text-muted-foreground">{store.step1Hint}</p>
		<Button disabled={!store.isStep1Valid} onclick={() => store.nextStep()}>Review transfer</Button>
	</div>
</div>
