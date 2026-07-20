<script lang="ts">
	import type { BalanceStatus } from '../fund-transfer.svelte';
	import { formatInr } from '../fund-transfer.svelte';
	import { cn } from '$lib/utils';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	let {
		limit,
		value = $bindable(0),
		onStatusChange
	}: {
		limit: number;
		value?: number;
		onStatusChange?: (status: BalanceStatus) => void;
	} = $props();

	let inputValue = $state(value > 0 ? String(value) : '');

	const quickAmounts = $derived([
		Math.round(limit * 0.25),
		Math.round(limit * 0.5),
		Math.round(limit * 0.75),
		limit
	]);

	const status = $derived.by((): BalanceStatus => {
		if (value <= 0) return 'ok';
		const ratio = value / limit;
		if (ratio > 1) return 'error';
		if (ratio >= 0.8) return 'warning';
		return 'ok';
	});

	$effect(() => {
		onStatusChange?.(status);
	});

	function parseAmount(raw: string): number {
		const parsed = Number(raw.replace(/[^\d.]/g, ''));
		return Number.isFinite(parsed) ? parsed : 0;
	}

	function handleInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		inputValue = target.value;
		value = parseAmount(inputValue);
	}

	function selectQuickAmount(amount: number) {
		value = amount;
		inputValue = String(amount);
	}
</script>

<div class="space-y-3">
	<div class="space-y-2">
		<Label for="transfer-amount">Transfer amount (INR)</Label>
		<div class="relative">
			<span
				class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
			>
				₹
			</span>
			<Input
				id="transfer-amount"
				type="text"
				inputmode="decimal"
				class="pl-7"
				value={inputValue}
				oninput={handleInput}
				placeholder="0"
				aria-invalid={status === 'error'}
			/>
		</div>
		<p class="text-xs text-muted-foreground">Account limit: {formatInr(limit)}</p>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each quickAmounts as amount, index (index)}
			<Button
				type="button"
				variant="outline"
				size="sm"
				class={cn(value === amount && 'border-primary bg-accent text-accent-foreground')}
				onclick={() => selectQuickAmount(amount)}
			>
				{formatInr(amount)}
			</Button>
		{/each}
	</div>
</div>
