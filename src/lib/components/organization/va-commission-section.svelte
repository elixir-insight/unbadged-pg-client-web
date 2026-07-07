<script lang="ts">
	import { Button, Dropdown, Input } from '$lib/components/reusable';
	import { Coins, PlusIcon, Trash2Icon } from '$lib/assets/icons';
	import { fly, slide } from 'svelte/transition';
	import VaConfigSection from './va-config-section.svelte';
	import type { CommissionTier } from './types';
	import {
		COMMISSION_EFFECTIVE_OPTIONS,
		VA_COMMISSION_METHODS,
		makeCommissionTier
	} from './va-form-constants';

	interface Props {
		tiers: CommissionTier[];
		mode: 'create' | 'update';
		effectiveDate?: string;
	}

	let { tiers = $bindable([]), mode, effectiveDate = $bindable('tomorrow') }: Props = $props();

	const showPartnerFee = $derived(mode === 'create');
	const showEffectiveDate = $derived(mode === 'update');
	const showFooterActions = $derived(mode === 'update');
	const gridCols = $derived(showPartnerFee ? 'sm:grid-cols-4' : 'sm:grid-cols-3');

	function addTier() {
		tiers = [...tiers, makeCommissionTier()];
	}

	function removeTier(id: string) {
		tiers = tiers.filter((tier) => tier.id !== id);
	}
</script>

<VaConfigSection
	title="Commission Setup"
	description="Define fee slabs and commission structure"
	icon={Coins}
	accent="success"
>
	{#snippet actions()}
		<div class="flex items-center gap-2">
			{#if showEffectiveDate}
				<div class="w-36">
					<Dropdown
						bind:value={effectiveDate}
						options={[...COMMISSION_EFFECTIVE_OPTIONS]}
						placeholder="Effective date"
					/>
				</div>
			{/if}
			<Button variant="outline" size="sm" onclick={addTier} class="shrink-0">
				<PlusIcon class="size-3.5" />
				Add Row
			</Button>
		</div>
	{/snippet}

	{#if tiers.length === 0}
		<div class="flex flex-col items-center gap-3 px-6 py-14 text-center">
			<div
				class="flex size-12 items-center justify-center rounded-2xl border border-dashed border-success/25 bg-success/5"
			>
				<Coins class="size-5 text-success/25" />
			</div>
			<div class="max-w-xs">
				<p class="text-sm font-medium text-foreground/70">No commission slabs yet</p>
				<p class="mt-1 text-xs leading-relaxed text-muted-foreground/70">
					Click "Add Row" to start configuring commission slabs.
				</p>
			</div>
			<Button variant="outline" size="sm" onclick={addTier}>
				<PlusIcon class="size-3.5" />
				Add First Row
			</Button>
		</div>
	{:else}
		<div class="space-y-2.5 p-5 sm:p-6">
			{#each tiers as tier, index (tier.id)}
				<div
					class="group relative overflow-hidden rounded-xl bg-muted/15 ring-1 ring-border/30 transition-all duration-200 hover:bg-muted/25 hover:shadow-sm hover:ring-border/50"
					in:fly={{ y: -6, duration: 200 }}
					out:slide={{ duration: 150 }}
				>
					<div class="flex items-center justify-between border-b border-border/25 px-4 py-2">
						<div class="flex items-center gap-2">
							<span
								class="flex size-5 items-center justify-center rounded-full bg-primary/12 text-[10px] font-bold text-primary"
							>
								{index + 1}
							</span>
							<span class="text-xs font-medium text-muted-foreground/60">Commission Slab</span>
						</div>
						{#if mode === 'update' && index > 0}
							<button
								type="button"
								aria-label="Remove commission slab {index + 1}"
								onclick={() => removeTier(tier.id)}
								class="flex size-6 items-center justify-center rounded-lg text-muted-foreground/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
							>
								<Trash2Icon class="size-3.5" />
							</button>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-3 p-4 {gridCols}">
						<div class="space-y-1.5">
							<label
								for="base-{tier.id}"
								class="block text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
							>
								Base Amount
							</label>
							<Input
								id="base-{tier.id}"
								inputmode="decimal"
								bind:value={tier.baseAmount}
								placeholder="e.g. 1000"
								disabled={tier.readonly}
								class="h-9 text-sm {tier.readonly ? 'bg-muted/40' : ''}"
							/>
						</div>

						<div class="space-y-1.5">
							<label
								for="method-{tier.id}"
								class="block text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
							>
								Method
							</label>
							<Dropdown
								bind:value={tier.method}
								options={[...VA_COMMISSION_METHODS]}
								placeholder="Select"
							/>
						</div>

						<div class="space-y-1.5">
							<label
								for="gateway-{tier.id}"
								class="block text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
							>
								Gateway Fee
							</label>
							<Input
								id="gateway-{tier.id}"
								inputmode="decimal"
								bind:value={tier.gatewayFee}
								placeholder="e.g. 2.5"
								class="h-9 text-sm"
							/>
						</div>

						{#if showPartnerFee}
							<div class="space-y-1.5">
								<label
									for="partner-{tier.id}"
									class="block text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
								>
									Partner Fee
								</label>
								<Input
									id="partner-{tier.id}"
									inputmode="decimal"
									bind:value={tier.partnerFee}
									placeholder="e.g. 1.5"
									class="h-9 text-sm"
								/>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if showFooterActions}
		<div class="flex justify-end gap-2.5 border-t border-border/40 px-5 py-4">
			<Button variant="outline" size="sm" disabled>Save Rule</Button>
			<Button variant="outline" size="sm" disabled>Update Commission Setup</Button>
		</div>
	{/if}
</VaConfigSection>
