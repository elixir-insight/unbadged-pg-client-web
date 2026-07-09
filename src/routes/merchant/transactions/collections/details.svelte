<script lang="ts">
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';

	type ResolvePath = Parameters<typeof resolve>[0];
	type ResolveParams = Parameters<typeof resolve>[1];

	export interface DetailRow {
		label: string;
		value: string;
		copyable?: boolean;
		mono?: boolean;
		variant?: 'default' | 'negative' | 'positive';
		bold?: boolean;
		link?: {
			path: ResolvePath;
			params?: ResolveParams;
		};
	}

	export interface DetailSection {
		title: string;
		rows: DetailRow[];
	}

	let { sections, flat = false }: { sections: DetailSection[]; flat?: boolean } = $props();

	let copiedKey = $state<string | null>(null);

	function copy(key: string, text: string) {
		navigator.clipboard.writeText(text);
		copiedKey = key;
		setTimeout(() => (copiedKey = null), 1500);
	}
</script>

<div class={cn('flex flex-col', flat ? 'gap-0' : 'gap-6')}>
	{#each sections as section, sectionIndex (section.title)}
		<div class={cn(flat && sectionIndex > 0 && 'border-t border-border pt-5 mt-5')}>
			<p
				class={cn(
					'text-xs font-semibold uppercase tracking-widest text-muted-foreground/60',
					flat ? 'mb-3' : 'mb-2'
				)}
			>
				{section.title}
			</p>

			<div class={cn(!flat && 'overflow-hidden rounded-lg border border-border')}>
				{#each section.rows as row, i (row.label)}
					<div
						class={cn(
							'flex min-h-11 items-center justify-between gap-3 py-2.5',
							flat ? 'px-0' : 'px-4 sm:px-5',
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
							{#if row.link}
								<a
									href={resolve(row.link.path, row.link.params)}
									class={cn(
										'min-w-0 truncate text-right text-sm font-medium text-primary hover:underline',
										row.mono && 'font-mono text-xs'
									)}
								>
									{row.value}
								</a>
							{:else}
								<span
									class={cn(
										'min-w-0 truncate text-right text-sm',
										row.mono && 'font-mono text-xs',
										row.bold ? 'font-bold' : 'font-medium',
										row.variant === 'negative' && 'text-destructive',
										row.variant === 'positive' && 'text-green-600 dark:text-green-400',
										!row.variant && 'text-foreground'
									)}
								>
									{row.value}
								</span>
							{/if}

							{#if row.copyable && row.value !== '—'}
								<button
									type="button"
									onclick={() => copy(row.label, row.value)}
									aria-label="Copy {row.label}"
									class="flex shrink-0 size-5 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:text-muted-foreground"
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
