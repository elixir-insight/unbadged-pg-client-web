<script lang="ts">
	import type { Partner } from '$lib/data/partnerSettlementsDummyData';
	import { searchPartners } from '$lib/data/partnerSettlementsDummyData';
	import { cn } from '$lib/utils';
	import { ArrowUpDown, Search } from '$lib/assets/icons';
	import { Input } from '$lib/components/ui/input';
	import { Chip } from '$lib/components/reusable';

	let {
		value = null,
		onSelect
	}: {
		value?: Partner | null;
		onSelect: (partner: Partner) => void;
	} = $props();

	let open = $state(false);
	let search = $state('');

	const filteredPartners = $derived(searchPartners(search));

	function toggleOpen() {
		open = !open;
		if (!open) search = '';
	}

	function handleSelect(partner: Partner) {
		search = '';
		open = false;
		onSelect(partner);
	}

	function clickOutside(node: HTMLElement) {
		function handle(event: MouseEvent) {
			if (!node.contains(event.target as Node)) {
				open = false;
				search = '';
			}
		}

		document.addEventListener('mousedown', handle);
		return () => document.removeEventListener('mousedown', handle);
	}
</script>

<div {@attach clickOutside} class="relative w-full max-w-md">
	<button
		type="button"
		class={cn(
			'flex h-auto w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2.5 text-sm shadow-xs',
			'hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
		)}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={toggleOpen}
	>
		{#if value}
			<span class="flex min-w-0 flex-1 items-center gap-2 text-left">
				<Chip variant="secondary" class="shrink-0">{value.code}</Chip>
				<span class="truncate font-medium">{value.name}</span>
			</span>
		{:else}
			<span class="text-muted-foreground">Select partner…</span>
		{/if}
		<ArrowUpDown
			class={cn(
				'ml-2 size-4 shrink-0 opacity-50 transition-transform duration-200',
				open && 'rotate-180'
			)}
		/>
	</button>

	{#if open}
		<div
			class="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg"
			role="listbox"
			aria-label="Partners"
		>
			<div class="flex items-center gap-2 border-b border-border px-3 py-2">
				<Search class="size-4 shrink-0 text-muted-foreground" />
				<Input
					bind:value={search}
					placeholder="Search partners…"
					class="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
				/>
			</div>

			<ul class="max-h-72 overflow-y-auto p-1">
				{#if filteredPartners.length === 0}
					<li class="py-6 text-center text-sm text-muted-foreground">No partner found.</li>
				{:else}
					{#each filteredPartners as partner (partner.id)}
						{@const isSelected = value?.id === partner.id}
						<li>
							<button
								type="button"
								role="option"
								aria-selected={isSelected}
								class={cn(
									'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left transition-colors',
									'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none',
									isSelected && 'bg-accent text-accent-foreground'
								)}
								onclick={() => handleSelect(partner)}
							>
								<Chip variant="secondary">{partner.code}</Chip>
								<span class="text-sm font-medium">{partner.name}</span>
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	{/if}
</div>
