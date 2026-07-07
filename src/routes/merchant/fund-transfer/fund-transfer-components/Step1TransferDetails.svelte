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

<div class="space-y-6 md:space-y-8">
	<section
		class="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:items-center md:gap-7.5 lg:grid-cols-[minmax(0,18rem)_minmax(0,28rem)] xl:grid-cols-[minmax(0,20rem)_minmax(0,32rem)]"
	>
		<div class="flex min-w-0 items-start gap-3">
			<span
				class="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
			>
				<Wallet class="size-4" />
			</span>
			<div class="min-w-0">
				<p class="font-medium leading-none">Source virtual account</p>
				<p class="mt-1.5 text-sm text-muted-foreground">
					Choose the account to debit for this payout.
				</p>
			</div>
		</div>
		<div class="w-full min-w-0 md:max-w-none">
			<VirtualAccountCombobox
				accounts={store.accounts}
				value={store.selectedAccount}
				onSelect={(account) => store.selectAccount(account)}
			/>
		</div>
	</section>

	<section class="space-y-4">
		<div class="flex items-start gap-3">
			<span
				class="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
			>
				<Send class="size-4" />
			</span>
			<div class="min-w-0">
				<p class="font-medium leading-none">Transfer method</p>
				<p class="mt-1.5 text-sm text-muted-foreground">
					Select how funds should reach the beneficiary.
				</p>
			</div>
		</div>
		<TransferMethodPicker
			methods={store.methods}
			value={store.selectedMethod}
			onSelect={(method) => store.selectMethod(method)}
		/>
	</section>

	<Card.Root class="shadow-sm">
		<Card.Header class="px-4 sm:px-6">
			<div class="flex items-start gap-3">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
				>
					<User class="size-4" />
				</span>
				<div class="min-w-0">
					<Card.Title>Beneficiary details</Card.Title>
					<Card.Description>Enter recipient information and transfer amount.</Card.Description>
				</div>
			</div>
		</Card.Header>
		<Card.Content class="space-y-4 px-4 sm:px-6">
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

	<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
		<Button variant="ghost" class="w-full sm:w-auto" onclick={() => store.clearStep1()}
			>Clear</Button
		>
		<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto md:justify-end">
			<p class="text-center text-sm text-muted-foreground sm:text-left">{store.step1Hint}</p>
			<Button
				class="w-full sm:w-auto"
				disabled={!store.isStep1Valid}
				onclick={() => store.nextStep()}
			>
				Review transfer
			</Button>
		</div>
	</div>
</div>
