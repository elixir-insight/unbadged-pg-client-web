<script lang="ts">
	import { tokens } from '$lib/tokens/tokens';

	type RadiusEntry = {
		name: string;
		value: string;
		useCase: string;
	};

	const useCases: Record<string, string> = {
		none: 'Input borders',
		sm: 'Badges · Tags · Chips',
		md: 'Buttons · Inputs',
		lg: 'Cards · Panels',
		xl: 'Modals · Sheets',
		full: 'Pills · Avatars · Toggles'
	};

	const radiusEntries: RadiusEntry[] = (Object.entries(tokens.radii) as Array<[string, string]>).map(
		([name, value]) => ({
			name,
			value,
			useCase: useCases[name] ?? ''
		})
	);
</script>

<div class="min-h-screen p-8 font-sans" style="background-color: var(--background);">
	<h1 class="mb-2 text-2xl font-semibold" style="color: var(--foreground);">Border Radius</h1>
	<p class="mb-10 text-sm" style="color: var(--muted-foreground);">
		Use these radii tokens to keep UI components visually consistent.
	</p>

	<div class="flex flex-wrap gap-8">
		{#each radiusEntries as entry (entry.name)}
			<div class="flex flex-col items-center gap-3">
				<div
					class="flex h-16 w-16 items-center justify-center border-2"
					style="border-radius: {entry.value}; border-color: var(--primary); background-color: var(--accent);"
					aria-label="radius {entry.value}"
				></div>

				<div class="text-center">
					<p class="text-sm font-semibold" style="color: var(--foreground);">
						{entry.name}
					</p>
					<p class="font-mono text-xs" style="color: var(--primary);">{entry.value}</p>
					<p class="mt-1 max-w-[90px] text-center text-xs" style="color: var(--muted-foreground);">
						{entry.useCase}
					</p>
				</div>
			</div>
		{/each}
	</div>
</div>
