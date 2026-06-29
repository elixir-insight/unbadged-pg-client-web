<script lang="ts">
	import { tokens } from '$lib/tokens/tokens';

	type ShadowEntry = {
		name: string;
		value: string;
		useCase: string;
		useCaseDetail: string;
	};

	const useCases: Record<string, { short: string; detail: string }> = {
		sm: { short: 'Dropdowns · Tooltips', detail: 'Small floating elements close to the surface' },
		md: { short: 'Cards · Popovers', detail: 'Content cards and contextual panels' },
		lg: { short: 'Modals · Drawers', detail: 'Full-screen overlays and side sheets' }
	};

	const shadowEntries: ShadowEntry[] = (
		Object.entries(tokens.shadows) as Array<[string, string]>
	).map(([name, value]) => ({
		name,
		value,
		useCase: useCases[name]?.short ?? '',
		useCaseDetail: useCases[name]?.detail ?? ''
	}));
</script>

<div class="min-h-screen p-8 font-sans" style="background-color: var(--muted);">
	<h1 class="mb-2 text-2xl font-semibold" style="color: var(--foreground);">Shadows</h1>
	<p class="mb-10 text-sm" style="color: var(--muted-foreground);">
		Elevation tokens define depth and hierarchy across the payment interface.
	</p>

	<div class="flex flex-wrap gap-8">
		{#each shadowEntries as entry (entry.name)}
			<div class="flex flex-col gap-4">
				<div
					class="flex h-36 w-64 items-center justify-center rounded-xl"
					style="background-color: var(--card); box-shadow: {entry.value};"
				>
					<span class="text-sm font-medium" style="color: var(--muted-foreground);"
						>shadow-{entry.name}</span
					>
				</div>

				<div>
					<div class="flex items-center gap-2">
						<span class="text-sm font-semibold" style="color: var(--foreground);">{entry.name}</span
						>
						<span
							class="rounded-full px-2 py-0.5 text-xs"
							style="background-color: var(--secondary); color: var(--secondary-foreground);"
						>
							{entry.useCase}
						</span>
					</div>
					<p class="mt-1 font-mono text-xs" style="color: var(--primary);">{entry.value}</p>
					<p class="mt-1 text-xs" style="color: var(--muted-foreground);">{entry.useCaseDetail}</p>
				</div>
			</div>
		{/each}
	</div>
</div>
