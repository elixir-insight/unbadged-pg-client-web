<script lang="ts">
	import { Input } from '$lib/components/reusable';
	import * as Table from '$lib/components/ui/table';
	import { TableIcon, Trash2Icon } from '$lib/assets/icons';
	import { fade, slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import VaConfigSection from './va-config-section.svelte';
	import { getTransactionTypeMeta, syncMethodLimits } from './va-form-constants';

	interface MethodLimit {
		min: string;
		max: string;
		total: string;
	}

	interface Props {
		selectedTypes: string[];
		methodLimits: Record<string, MethodLimit>;
		onRemoveType?: (type: string) => void;
		embedded?: boolean;
	}

	let {
		selectedTypes,
		methodLimits = $bindable({}),
		onRemoveType,
		embedded = false
	}: Props = $props();

	$effect.pre(() => {
		methodLimits = syncMethodLimits(methodLimits, selectedTypes);
	});
</script>

{#snippet limitsContent()}
	{#if selectedTypes.length === 0}
		<div
			class={cn(
				'flex flex-col items-center gap-3 text-center',
				embedded ? 'px-5 py-10' : 'px-6 py-14'
			)}
			in:fade={{ duration: 180 }}
		>
			<div
				class="flex size-12 items-center justify-center rounded-2xl border border-dashed border-info/25 bg-info/5"
			>
				<TableIcon class="size-5 text-info/25" />
			</div>
			<div class="max-w-xs">
				<p class="text-sm font-medium text-foreground/70">No payment methods selected</p>
				<p class="mt-1 text-xs leading-relaxed text-muted-foreground/70">
					Select transaction types above to configure per-method limits here.
				</p>
			</div>
		</div>
	{:else}
		<div transition:slide={{ duration: 220 }}>
			<Table.Root>
				<Table.Header>
					<Table.Row class="border-b border-border/40 bg-muted/15 hover:bg-muted/15">
						<Table.Head
							class="pl-5 text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
						>
							Payment Method
						</Table.Head>
						<Table.Head
							class="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
						>
							Min Value
						</Table.Head>
						<Table.Head
							class="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
						>
							Max Value
						</Table.Head>
						<Table.Head
							class="pr-5 text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
						>
							Total Limit
						</Table.Head>
						{#if onRemoveType}
							<Table.Head
								class="pr-5 text-right text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
							>
								Action
							</Table.Head>
						{/if}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each selectedTypes as type (type)}
						{@const meta = getTransactionTypeMeta(type)}
						{@const limit = methodLimits[type]}
						{#if limit}
							<Table.Row
								class="border-b border-border/30 transition-colors last:border-0 hover:bg-muted/15"
							>
								<Table.Cell class="py-3.5 pl-5">
									<span
										class="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary"
									>
										{meta?.label ?? type}
									</span>
								</Table.Cell>
								<Table.Cell class="py-3.5">
									<Input
										inputmode="decimal"
										bind:value={limit.min}
										placeholder="Min"
										aria-label="Min for {meta?.label ?? type}"
										class="h-8 w-28 text-sm"
									/>
								</Table.Cell>
								<Table.Cell class="py-3.5">
									<Input
										inputmode="decimal"
										bind:value={limit.max}
										placeholder="Max"
										aria-label="Max for {meta?.label ?? type}"
										class="h-8 w-28 text-sm"
									/>
								</Table.Cell>
								<Table.Cell class="py-3.5">
									<Input
										inputmode="decimal"
										bind:value={limit.total}
										placeholder="Total"
										aria-label="Total for {meta?.label ?? type}"
										class="h-8 w-28 text-sm"
									/>
								</Table.Cell>
								{#if onRemoveType}
									<Table.Cell class="py-3.5 pr-5 text-right">
										<button
											type="button"
											aria-label="Remove {meta?.label ?? type}"
											onclick={() => onRemoveType?.(type)}
											class="inline-flex size-8 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
										>
											<Trash2Icon class="size-4" />
										</button>
									</Table.Cell>
								{/if}
							</Table.Row>
						{/if}
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
{/snippet}

{#if embedded}
	{@render limitsContent()}
{:else}
	<VaConfigSection
		title="Transaction Limits by Method"
		description="Per-method caps auto-populate from selected types"
		icon={TableIcon}
		accent="info"
	>
		{@render limitsContent()}
	</VaConfigSection>
{/if}
