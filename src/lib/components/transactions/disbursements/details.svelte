<script lang="ts">
	import { cn } from '$lib/utils';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';

	export interface DetailRow {
		label: string;
		value: string;
		copyable?: boolean;
		mono?: boolean;
		variant?: 'default' | 'negative' | 'positive';
		bold?: boolean;
	}

	export interface DetailSection {
		title: string;
		rows: DetailRow[];
	}

	let { sections }: { sections: DetailSection[] } = $props();

	let copiedKey = $state<string | null>(null);

	function copy(key: string, text: string) {
		navigator.clipboard.writeText(text);
		copiedKey = key;
		setTimeout(() => (copiedKey = null), 1500);
	}
</script>

<div class="flex flex-col gap-6">
	{#each sections as section (section.title)}
		<div>
			<p class="mb-2 text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
				{section.title}
			</p>

			<div class="overflow-hidden rounded-lg border border-border">
				{#each section.rows as row, i (row.label)}
					<div
						class={cn(
							'flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 sm:px-5',
							i < section.rows.length - 1 && 'border-b border-border/40'
						)}
					>
						<span
							class={cn(
								'shrink-0 text-sm text-muted-foreground',
								row.bold && 'font-semibold text-foreground'
							)}
						>
							{row.label}
						</span>

						<div class="flex min-w-0 items-center gap-1.5">
							<span
								class={cn(
									'min-w-0 truncate text-right text-sm',
									row.mono && 'font-mono text-xs',
									row.bold ? 'font-bold' : 'font-medium',
									row.variant === 'negative' && 'text-destructive',
									row.variant === 'positive' && 'text-success dark:text-success',
									!row.variant && 'text-foreground'
								)}
							>
								{row.value}
							</span>

							{#if row.copyable && row.value !== '—'}
								<button
									type="button"
									onclick={() => copy(row.label, row.value)}
									aria-label="Copy {row.label}"
									class="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:text-muted-foreground"
								>
									{#if copiedKey === row.label}
										<Check class="size-3 text-primary" />
									{:else}
										<Copy class="size-3" />
									{/if}
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
