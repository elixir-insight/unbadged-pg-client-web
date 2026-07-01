<script lang="ts">
	import type { Merchant } from '$lib/data/partnerSettlementsDummyData';
	import { avatarClasses, merchantInitials } from '$lib/data/partnerSettlementsDummyData';
	import { cn } from '$lib/utils';

	let {
		merchants,
		selectedMerchantId = null,
		onSelect
	}: {
		merchants: Merchant[];
		selectedMerchantId?: string | null;
		onSelect: (merchantId: string) => void;
	} = $props();
</script>

<nav aria-label="Merchants" class="flex flex-col gap-1">
	{#if merchants.length === 0}
		<p class="px-2 py-4 text-sm text-muted-foreground">No merchants for this partner.</p>
	{:else}
		{#each merchants as merchant (merchant.id)}
			{@const isActive = selectedMerchantId === merchant.id}
			<button
				type="button"
				class={cn(
					'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
					'hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
					isActive && 'bg-accent text-accent-foreground'
				)}
				aria-current={isActive ? 'page' : undefined}
				onclick={() => onSelect(merchant.id)}
			>
				<span
					class={cn(
						'flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
						avatarClasses(merchant.name)
					)}
				>
					{merchantInitials(merchant.name)}
				</span>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm font-medium">{merchant.name}</span>
					<span class="block truncate text-xs text-muted-foreground">{merchant.city}</span>
				</span>
			</button>
		{/each}
	{/if}
</nav>
