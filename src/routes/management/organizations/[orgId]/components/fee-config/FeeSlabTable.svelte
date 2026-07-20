<script lang="ts">
	import { Button, Checkbox, Dropdown, Input } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { Plus, Trash2 } from '$lib/assets/icons';
	import { getOpenEndedSlab, isOpenEndedSlab, sortSlabs } from '$lib/fee-config';
	import type { FeeSlabRow, FeeType } from '$lib/fee-config/types';

	const feeTypeOptions: DropdownOption[] = [
		{ value: 'percentage', label: '%' },
		{ value: 'flat', label: 'Flat' }
	];

	let {
		slabs = $bindable([]),
		rowErrors = {}
	}: {
		slabs: FeeSlabRow[];
		rowErrors?: Record<string, string[]>;
	} = $props();

	const sortedSlabs = $derived(sortSlabs(slabs));

	function addSlabRow() {
		const openEnded = getOpenEndedSlab(slabs);
		const newRow: FeeSlabRow = {
			id: `slab-${Date.now()}-${slabs.length + 1}`,
			baseAmount: '',
			feeType: 'percentage',
			feeRate: '',
			gstExclusive: false
		};
		if (openEnded) {
			const openEndedIndex = slabs.findIndex((slab) => slab.id === openEnded.id);
			const next = [...slabs];
			next.splice(openEndedIndex, 0, newRow);
			slabs = next;
			return;
		}
		slabs = [...slabs, newRow];
	}

	function slabIndex(id: string): number {
		return slabs.findIndex((slab) => slab.id === id);
	}

	function removeSlabRow(id: string) {
		if (slabs.length <= 1) return;
		const slab = slabs.find((row) => row.id === id);
		if (!slab || isOpenEndedSlab(slab, slabs)) return;
		slabs = slabs.filter((row) => row.id !== id);
	}

	function updateSlabField<K extends keyof FeeSlabRow>(id: string, field: K, value: FeeSlabRow[K]) {
		slabs = slabs.map((slab) => (slab.id === id ? { ...slab, [field]: value } : slab));
	}

	function ratePrefix(feeType: FeeType): string {
		return feeType === 'percentage' ? '' : '₹';
	}
</script>

<div class="overflow-hidden rounded-lg border border-border">
	<div
		class="hidden grid-cols-[1.2fr_0.8fr_1fr_0.7fr_auto] gap-3 border-b border-border px-4 py-3 sm:grid"
	>
		<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
			Base amount (₹)
		</p>
		<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Type</p>
		<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Rate</p>
		<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">GST</p>
		<span class="sr-only">Actions</span>
	</div>

	<div class="divide-y divide-border">
		{#each sortedSlabs as slab, index (slab.id)}
			{@const openEnded = isOpenEndedSlab(slab, slabs)}
			{@const errors = rowErrors[slab.id] ?? []}
			{@const rowIndex = slabIndex(slab.id)}
			<div
				class="group relative grid items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/20 sm:grid-cols-[1.2fr_0.8fr_1fr_0.7fr_auto]"
			>
				<label class="space-y-2">
					<span class="text-xs font-medium text-muted-foreground sm:hidden">Base amount (₹)</span>
					{#if openEnded}
						<Input value="∞ open-ended" disabled aria-label="Open-ended slab for row {index + 1}" />
					{:else}
						<Input
							inputmode="decimal"
							value={slab.baseAmount}
							oninput={(event) =>
								updateSlabField(
									slab.id,
									'baseAmount',
									(event.currentTarget as HTMLInputElement).value
								)}
							placeholder="Enter amount"
							aria-label="Base amount for row {index + 1}"
							class={errors.length > 0 ? 'border-destructive' : undefined}
						/>
					{/if}
					{#if errors.length > 0}
						<p class="text-xs text-destructive">{errors.join(' ')}</p>
					{/if}
				</label>

				<label class="space-y-2">
					<span class="text-xs font-medium text-muted-foreground sm:hidden">Type</span>
					<Dropdown
						value={slab.feeType}
						options={feeTypeOptions}
						class="w-full"
						onValueChange={(value) => updateSlabField(slab.id, 'feeType', value as FeeType)}
					/>
				</label>

				<label class="space-y-2">
					<span class="text-xs font-medium text-muted-foreground sm:hidden">Rate</span>
					<div class="relative">
						{#if slab.feeType === 'flat'}
							<span
								class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground"
							>
								{ratePrefix(slab.feeType)}
							</span>
						{/if}
						<Input
							inputmode="decimal"
							value={slab.feeRate}
							oninput={(event) =>
								updateSlabField(
									slab.id,
									'feeRate',
									(event.currentTarget as HTMLInputElement).value
								)}
							placeholder="0"
							aria-label="Rate for row {index + 1}"
							class={slab.feeType === 'flat' ? 'pl-6' : undefined}
						/>
					</div>
				</label>

				<div class="space-y-2">
					<span class="text-xs font-medium text-muted-foreground sm:hidden">GST exclusive</span>
					<label class="flex h-9 items-center gap-2">
						{#if rowIndex >= 0}
							<Checkbox bind:checked={slabs[rowIndex].gstExclusive} />
						{/if}
						<span class="text-xs text-muted-foreground">Excl.</span>
					</label>
				</div>

				{#if !openEnded && sortedSlabs.filter((row) => !isOpenEndedSlab(row, slabs)).length > 1}
					<Button
						type="button"
						variant="destructive"
						size="icon-sm"
						class="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
						aria-label="Remove slab row {index + 1}"
						onclick={() => removeSlabRow(slab.id)}
					>
						<Trash2 class="size-3.5" />
					</Button>
				{:else}
					<span class="hidden size-8 sm:block" aria-hidden="true"></span>
				{/if}
			</div>
		{/each}
	</div>
</div>

<Button type="button" variant="link" class="mt-4 px-0" onclick={addSlabRow}>
	<Plus class="size-3.5" />
	Add slab
</Button>
