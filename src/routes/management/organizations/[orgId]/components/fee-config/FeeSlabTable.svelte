<script lang="ts">
	import { Button, Dropdown, Input } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Plus, Trash2 } from '$lib/assets/icons';
	import { sortSlabs, suggestNextSlabBaseAmount } from '$lib/fee-config';
	import type { FeeSlabRow, FeeType } from '$lib/fee-config/types';

	const feeTypeOptions: DropdownOption[] = [
		{ value: 'percentage', label: '%' },
		{ value: 'flat', label: 'Flat' }
	];

	let {
		slabs = $bindable([]),
		rowErrors = {},
		readOnly = false,
		suggestNextBaseAmount = false
	}: {
		slabs: FeeSlabRow[];
		rowErrors?: Record<string, string[]>;
		readOnly?: boolean;
		suggestNextBaseAmount?: boolean;
	} = $props();

	const sortedSlabs = $derived(sortSlabs(slabs));

	function addSlabRow() {
		const baseAmount = suggestNextBaseAmount ? suggestNextSlabBaseAmount(slabs) : '';
		const newRow: FeeSlabRow = {
			id: `slab-${Date.now()}-${slabs.length + 1}`,
			baseAmount,
			feeType: 'percentage',
			feeRate: '',
			gstExclusive: false
		};
		slabs = [...slabs, newRow];
	}

	function removeSlabRow(id: string) {
		if (slabs.length <= 1) return;
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
			{@const errors = rowErrors[slab.id] ?? []}
			<div
				class="group relative grid items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/20 sm:grid-cols-[1.2fr_0.8fr_1fr_0.7fr_auto]"
			>
				<label class="space-y-2">
					<span class="text-xs font-medium text-muted-foreground sm:hidden">Base amount (₹)</span>
					<Input
						inputmode="decimal"
						value={slab.baseAmount}
						disabled={readOnly}
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
						disabled={readOnly}
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
							disabled={readOnly}
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
						<Checkbox
							checked={slab.gstExclusive}
							disabled={readOnly}
							onCheckedChange={(checked) =>
								updateSlabField(slab.id, 'gstExclusive', checked === true)}
						/>
						<span class="text-xs text-muted-foreground">Excl.</span>
					</label>
				</div>

				{#if !readOnly && slabs.length > 1}
					<Button
						type="button"
						variant="destructive"
						size="icon-sm"
						class="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
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

{#if !readOnly}
	<Button type="button" variant="link" class="mt-4 px-0" onclick={addSlabRow}>
		<Plus class="size-3.5" />
		Add slab
	</Button>
{/if}
