<script lang="ts">
	import type { VirtualAccount } from '../fund-transfer.svelte';
	import { formatInr, maskAccountNumber } from '../fund-transfer.svelte';
	import { cn } from '$lib/utils';
	import { ArrowUpDown, Search } from '$lib/assets/icons';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	let {
		accounts,
		value = null,
		onSelect
	}: {
		accounts: VirtualAccount[];
		value?: VirtualAccount | null;
		onSelect: (account: VirtualAccount) => void;
	} = $props();

	let open = $state(false);
	let search = $state('');
	let liveMessage = $state('');
	let triggerRef = $state<HTMLButtonElement | null>(null);
	let contentWidth = $state<number | undefined>(undefined);

	const filteredAccounts = $derived.by(() => {
		const query = search.trim().toLowerCase();
		if (!query) return accounts;

		return accounts.filter(
			(account) =>
				account.name.toLowerCase().includes(query) ||
				account.accountNumber.includes(query) ||
				account.type.toLowerCase().includes(query)
		);
	});

	$effect(() => {
		if (open && triggerRef) {
			contentWidth = triggerRef.offsetWidth;
		}
	});

	function handleSelect(account: VirtualAccount) {
		search = '';
		open = false;
		onSelect(account);
		liveMessage = `Selected ${account.name}, balance ${formatInr(account.balance)}`;
		queueMicrotask(() => {
			open = false;
		});
	}
</script>

<div aria-live="polite" aria-atomic="true" class="sr-only">{liveMessage}</div>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				bind:ref={triggerRef}
				variant="outline"
				class="h-auto w-full justify-between px-3 py-2.5"
				role="combobox"
				aria-expanded={open}
				{...props}
			>
				{#if value}
					<span class="min-w-0 flex-1 text-left">
						<span class="block font-medium">{value.name}</span>
						<span class="block text-xs text-muted-foreground">
							{maskAccountNumber(value.accountNumber)} · {formatInr(value.balance)}
						</span>
					</span>
				{:else}
					<span class="text-muted-foreground">Select virtual account…</span>
				{/if}
				<ArrowUpDown class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content
		class="z-50 !w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 shadow-lg ring-1 ring-border"
		style={contentWidth ? `width: ${contentWidth}px` : undefined}
		align="start"
		side="bottom"
		sideOffset={6}
		onCloseAutoFocus={(event) => event.preventDefault()}
	>
		<div class="flex items-center gap-2 border-b border-border px-3 py-2">
			<Search class="size-4 shrink-0 text-muted-foreground" />
			<Input
				bind:value={search}
				placeholder="Search accounts…"
				class="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
			/>
		</div>

		<ScrollArea class="max-h-80">
			<ul class="p-1" role="listbox" aria-label="Virtual accounts">
				{#if filteredAccounts.length === 0}
					<li class="py-6 text-center text-sm text-muted-foreground">No account found.</li>
				{:else}
					{#each filteredAccounts as account (account.id)}
						{@const isSelected = value?.id === account.id}
						<li>
							<button
								type="button"
								role="option"
								aria-selected={isSelected}
								class={cn(
									'flex w-full flex-col rounded-md px-3 py-2.5 text-left transition-colors',
									'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none',
									isSelected && 'bg-accent text-accent-foreground'
								)}
								onmousedown={(event) => event.preventDefault()}
								onclick={() => handleSelect(account)}
							>
								<span class="text-sm leading-snug font-medium">{account.name}</span>
								<span class="mt-0.5 text-xs text-muted-foreground">
									{maskAccountNumber(account.accountNumber)} · {account.type}
								</span>
								<span class="mt-0.5 text-xs font-medium">{formatInr(account.balance)}</span>
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		</ScrollArea>
	</Popover.Content>
</Popover.Root>
