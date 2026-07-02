<script lang="ts">
	import { tokens } from '$lib/tokens/tokens';

	type SpacingEntry = {
		name: string;
		value: number;
	};

	const spacingEntries: SpacingEntry[] = tokens.spacing.map((value) => ({
		name: `space-${value}`,
		value
	}));

	const maxValue = Math.max(...tokens.spacing);
</script>

<div class="min-h-screen p-8 font-sans" style="background-color: var(--background);">
	<h1 class="mb-2 text-2xl font-semibold" style="color: var(--foreground);">Spacing</h1>
	<p class="mb-10 text-sm" style="color: var(--muted-foreground);">
		All values in pixels. Bar widths are proportional to the spacing value.
	</p>

	<div
		class="max-w-2xl overflow-hidden rounded-xl border"
		style="border-color: var(--border); background-color: var(--card);"
	>
		{#each spacingEntries as entry, i (entry.name)}
			<div
				class="flex items-center gap-5 border-b px-6 py-3 last:border-b-0"
				style="border-color: var(--border); background-color: {i % 2 === 0
					? 'var(--card)'
					: 'var(--muted)'};"
			>
				<span class="w-20 shrink-0 font-mono text-sm font-medium" style="color: var(--foreground);">
					{entry.name}
				</span>

				<span class="w-12 shrink-0 font-mono text-sm" style="color: var(--muted-foreground);"
					>{entry.value}px</span
				>

				<div class="flex flex-1 items-center">
					<div
						class="h-4 rounded-sm"
						style="width: {(entry.value / maxValue) *
							100}%; background-color: var(--primary); min-width: 2px;"
						aria-label="{entry.value}px"
					></div>
				</div>

				<span class="w-10 shrink-0 text-right font-mono text-xs" style="color: var(--border);">
					{entry.value}
				</span>
			</div>
		{/each}
	</div>
</div>
