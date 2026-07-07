<script lang="ts">
	import { tick } from 'svelte';
	import type { VirtualAccount } from '../fund-transfer.svelte';
	import { cn } from '$lib/utils';
	import { SearchField } from '$lib/components/reusable';
	import { PopoverPortal } from '$lib/components/ui/popover';

	let {
		accounts,
		value = null,
		onSelect
	}: {
		accounts: VirtualAccount[];
		value?: VirtualAccount | null;
		onSelect: (account: VirtualAccount | null) => void;
	} = $props();

	const searchFields = [
		{
			value: 'accountNumber',
			label: 'Account number',
			placeholder: 'e.g. 8901234567890123…'
		}
	];

	let searchField = $state('accountNumber');
	let searchInput = $state('');
	let listOpen = $state(false);
	let liveMessage = $state('');
	let anchorRef = $state<HTMLDivElement | null>(null);
	let dropdownRef = $state<HTMLDivElement | null>(null);
	let dropdownPos = $state({ top: 0, left: 0, width: 0 });

	const filteredAccounts = $derived.by(() => {
		const query = searchInput.trim();
		if (!query || (value && query === value.name)) return accounts;

		return accounts.filter((account) => account.accountNumber.includes(query));
	});

	async function syncDropdownPosition() {
		await tick();
		if (!anchorRef) return;

		const rect = anchorRef.getBoundingClientRect();
		dropdownPos = {
			top: rect.bottom + 4,
			left: rect.left,
			width: rect.width
		};
	}

	async function openAccountList() {
		listOpen = true;
		await syncDropdownPosition();
	}

	async function handleSearch(_field: string, val: string) {
		searchInput = val;
		listOpen = true;
		await syncDropdownPosition();

		if (!val.trim()) {
			onSelect(null);
		} else if (value && val !== value.name) {
			onSelect(null);
		}
	}

	function handleSelect(account: VirtualAccount) {
		searchInput = account.name;
		listOpen = false;
		onSelect(account);
		liveMessage = `Selected ${account.name}`;
	}

	$effect(() => {
		if (!value) {
			if (!listOpen) searchInput = '';
			return;
		}

		if (!listOpen && searchInput !== value.name) {
			searchInput = value.name;
		}
	});

	function handlePointerDown(event: PointerEvent) {
		const target = event.target as Node;
		if (anchorRef?.contains(target) || dropdownRef?.contains(target)) return;
		listOpen = false;
	}

	$effect(() => {
		if (!listOpen) return;

		void syncDropdownPosition();

		const onReposition = () => {
			void syncDropdownPosition();
		};

		window.addEventListener('scroll', onReposition, true);
		window.addEventListener('resize', onReposition);
		document.addEventListener('pointerdown', handlePointerDown);

		return () => {
			window.removeEventListener('scroll', onReposition, true);
			window.removeEventListener('resize', onReposition);
			document.removeEventListener('pointerdown', handlePointerDown);
		};
	});
</script>

<div class="w-full min-w-0 space-y-2">
	<div aria-live="polite" aria-atomic="true" class="sr-only">{liveMessage}</div>

	<div
		bind:this={anchorRef}
		role="combobox"
		aria-expanded={listOpen}
		aria-haspopup="listbox"
		aria-controls="virtual-account-listbox"
		tabindex="-1"
	>
		<SearchField
			fields={searchFields}
			bind:field={searchField}
			bind:value={searchInput}
			onSearch={handleSearch}
			onFieldTriggerClick={openAccountList}
			class="w-full"
		/>
	</div>
</div>

{#if listOpen}
	<PopoverPortal>
		<div
			bind:this={dropdownRef}
			id="virtual-account-listbox"
			role="listbox"
			aria-label="Virtual accounts"
			class="fixed z-50 max-h-60 overflow-y-auto overscroll-contain rounded-md bg-popover shadow-lg"
			style:top="{dropdownPos.top}px"
			style:left="{dropdownPos.left}px"
			style:width="{dropdownPos.width}px"
		>
			<ul class="p-1">
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
									'flex w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
									'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none',
									isSelected && 'bg-accent text-accent-foreground'
								)}
								onmousedown={(event) => event.preventDefault()}
								onclick={() => handleSelect(account)}
							>
								{account.name}
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	</PopoverPortal>
{/if}
