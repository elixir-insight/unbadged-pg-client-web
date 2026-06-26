<script lang="ts">
	import { tokens, colorGroups } from '$lib/tokens/tokens';
	import {
		CreditCard,
		Wallet,
		Shield,
		Banknote,
		Receipt,
		Landmark,
		DollarSign,
		ArrowRight
	} from '$lib/assets/icons';

	// One swatch per group — use first token's cssVar
	const colorPreviews = colorGroups.map((g) => ({
		id: g.id,
		label: g.label,
		cssVar: g.tokens[0].cssVar,
		value: g.tokens[0].value,
		count: g.tokens.length
	}));

	const totalColorTokens = colorGroups.reduce((acc, g) => acc + g.tokens.length, 0);

	const typePreviews = [
		{ key: 'xs', px: tokens.typography.sizes.xs },
		{ key: 'base', px: tokens.typography.sizes.base },
		{ key: 'xl', px: tokens.typography.sizes.xl },
		{ key: '3xl', px: tokens.typography.sizes['3xl'] }
	];

	const spacingPreviews = tokens.spacing.filter((_, i) => i % 2 === 0);
	const maxSpacing = Math.max(...tokens.spacing);

	const radiiPreviewEntries = (Object.entries(tokens.radii) as Array<[string, string]>).slice(1, 6);

	const shadowEntries = Object.entries(tokens.shadows) as Array<[string, string]>;

	const iconPreviews = [CreditCard, Wallet, Shield, Banknote, Receipt, Landmark, DollarSign, ArrowRight];
</script>

<div class="min-h-screen p-8 font-sans" style="background-color: var(--muted);">
	<div class="mb-10">
		<h1 class="text-3xl font-semibold" style="color: var(--foreground);">Design Tokens</h1>
		<p class="mt-2 text-sm" style="color: var(--muted-foreground);">
			A single source of truth for colors, typography, spacing, radii, shadows, and icons.
		</p>
	</div>

	<div class="flex flex-col gap-6">
		<!-- Colors -->
		<section
			class="overflow-hidden rounded-2xl border"
			style="background-color: var(--card); border-color: var(--border);"
		>
			<div
				class="flex items-center justify-between border-b px-6 py-4"
				style="border-color: var(--border);"
			>
				<div>
					<h2 class="text-sm font-semibold" style="color: var(--foreground);">Colors</h2>
					<p class="text-xs" style="color: var(--muted-foreground);">
						{colorGroups.length} groups · {totalColorTokens} tokens
					</p>
				</div>
				<span class="text-xs" style="color: var(--muted-foreground);">Design Tokens / Colors →</span>
			</div>
			<div class="flex flex-wrap gap-3 px-6 py-5">
				{#each colorPreviews as swatch (swatch.id)}
					<div class="flex flex-col items-center gap-1">
						<div
							class="h-10 w-10 rounded-lg border shadow-sm"
							style="background-color: {swatch.value}; border-color: var(--border);"
							title="{swatch.label}: {swatch.cssVar}"
						></div>
						<span class="font-mono text-xs" style="color: var(--muted-foreground);">{swatch.label}</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Typography -->
		<section
			class="overflow-hidden rounded-2xl border"
			style="background-color: var(--card); border-color: var(--border);"
		>
			<div
				class="flex items-center justify-between border-b px-6 py-4"
				style="border-color: var(--border);"
			>
				<div>
					<h2 class="text-sm font-semibold" style="color: var(--foreground);">Typography</h2>
					<p class="text-xs" style="color: var(--muted-foreground);">8 sizes · 3 weights · 3 line heights</p>
				</div>
				<span class="text-xs" style="color: var(--muted-foreground);">Design Tokens / Typography →</span>
			</div>
			<div class="flex flex-col gap-1 px-6 py-4">
				{#each typePreviews as entry (entry.key)}
					<div class="flex items-baseline gap-4">
						<span class="w-12 shrink-0 font-mono text-xs" style="color: var(--muted-foreground);">{entry.px}</span>
						<span style="font-size: {entry.px}; color: var(--foreground);">
							Payment confirmed ₹1,200.00
						</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Spacing + Radii side by side -->
		<div class="grid grid-cols-2 gap-6">
			<section
				class="overflow-hidden rounded-2xl border"
				style="background-color: var(--card); border-color: var(--border);"
			>
				<div
					class="flex items-center justify-between border-b px-6 py-4"
					style="border-color: var(--border);"
				>
					<div>
						<h2 class="text-sm font-semibold" style="color: var(--foreground);">Spacing</h2>
						<p class="text-xs" style="color: var(--muted-foreground);">{tokens.spacing.length} values</p>
					</div>
					<span class="text-xs" style="color: var(--muted-foreground);">→</span>
				</div>
				<div class="flex flex-col gap-2 px-6 py-4">
					{#each spacingPreviews as value (value)}
						<div class="flex items-center gap-3">
							<span class="w-10 shrink-0 font-mono text-xs" style="color: var(--muted-foreground);">{value}px</span>
							<div
								class="h-3 rounded-sm"
								style="width: {(value / maxSpacing) * 100}%; background-color: var(--primary); min-width: 2px;"
							></div>
						</div>
					{/each}
				</div>
			</section>

			<section
				class="overflow-hidden rounded-2xl border"
				style="background-color: var(--card); border-color: var(--border);"
			>
				<div
					class="flex items-center justify-between border-b px-6 py-4"
					style="border-color: var(--border);"
				>
					<div>
						<h2 class="text-sm font-semibold" style="color: var(--foreground);">Border Radius</h2>
						<p class="text-xs" style="color: var(--muted-foreground);">{Object.keys(tokens.radii).length} values</p>
					</div>
					<span class="text-xs" style="color: var(--muted-foreground);">→</span>
				</div>
				<div class="flex flex-wrap gap-4 px-6 py-4">
					{#each radiiPreviewEntries as [name, value] (name)}
						<div class="flex flex-col items-center gap-1">
							<div
								class="h-10 w-10 border-2"
								style="border-radius: {value}; border-color: var(--primary); background-color: var(--accent);"
							></div>
							<span class="font-mono text-xs" style="color: var(--muted-foreground);">{name}</span>
						</div>
					{/each}
				</div>
			</section>
		</div>

		<!-- Shadows -->
		<section
			class="overflow-hidden rounded-2xl border"
			style="background-color: var(--card); border-color: var(--border);"
		>
			<div
				class="flex items-center justify-between border-b px-6 py-4"
				style="border-color: var(--border);"
			>
				<div>
					<h2 class="text-sm font-semibold" style="color: var(--foreground);">Shadows</h2>
					<p class="text-xs" style="color: var(--muted-foreground);">{Object.keys(tokens.shadows).length} elevation levels</p>
				</div>
				<span class="text-xs" style="color: var(--muted-foreground);">Design Tokens / Shadows →</span>
			</div>
			<div class="flex flex-wrap gap-6 px-6 py-6">
				{#each shadowEntries as [name, value] (name)}
					<div class="flex flex-col items-center gap-3">
						<div
							class="flex h-20 w-40 items-center justify-center rounded-xl"
							style="background-color: var(--background); box-shadow: {value};"
						>
							<span class="text-xs" style="color: var(--muted-foreground);">shadow-{name}</span>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Icons -->
		<section
			class="overflow-hidden rounded-2xl border"
			style="background-color: var(--card); border-color: var(--border);"
		>
			<div
				class="flex items-center justify-between border-b px-6 py-4"
				style="border-color: var(--border);"
			>
				<div>
					<h2 class="text-sm font-semibold" style="color: var(--foreground);">Icons</h2>
					<p class="text-xs" style="color: var(--muted-foreground);">@lucide/svelte · 103 icons</p>
				</div>
				<span class="text-xs" style="color: var(--muted-foreground);">Design Tokens / Icons →</span>
			</div>
			<div class="flex flex-wrap gap-4 px-6 py-5">
				{#each iconPreviews as IconComp, i (i)}
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg border"
						style="border-color: var(--border);"
					>
						<IconComp size={20} strokeWidth={1.8} color="var(--foreground)" />
					</div>
				{/each}
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed text-xs"
					style="border-color: var(--border); color: var(--muted-foreground);"
				>
					+95
				</div>
			</div>
		</section>
	</div>
</div>
