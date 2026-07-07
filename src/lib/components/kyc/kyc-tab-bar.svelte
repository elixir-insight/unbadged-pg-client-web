<script lang="ts">
	import type { KycTab } from './types';

	let {
		tab = $bindable('aadhaar' as KycTab),
		onchange
	}: {
		tab?: KycTab;
		onchange?: (next: KycTab) => void;
	} = $props();

	const tabs: { id: KycTab; label: string }[] = [
		{ id: 'aadhaar', label: 'Aadhaar' },
		{ id: 'pan', label: 'PAN' }
	];

	function switchTab(next: KycTab) {
		tab = next;
		onchange?.(next);
	}
</script>

<div class="mb-6 flex justify-start gap-6 border-b border-border">
	{#each tabs as item (item.id)}
		<button
			type="button"
			onclick={() => switchTab(item.id)}
			class={[
				'-mb-px border-b-2 pb-3 text-sm font-medium transition-colors',
				tab === item.id
					? 'border-primary text-foreground'
					: 'border-transparent text-muted-foreground hover:text-foreground/80'
			]}
		>
			{item.label}
		</button>
	{/each}
</div>
