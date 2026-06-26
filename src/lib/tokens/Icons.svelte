<script lang="ts">
	import type { Component } from 'svelte';
	import * as Icons from '$lib/assets/icons';

	type LucideIcon = Component<{
		size?: number | string;
		strokeWidth?: number | string;
		color?: string;
		class?: string;
	}>;

	type IconEntry = { name: string; component: LucideIcon };

	let { size = 24, strokeWidth = 1.8 }: { size?: number; strokeWidth?: number } = $props();

	const allIcons: IconEntry[] = (Object.entries(Icons) as Array<[string, LucideIcon]>).map(
		([name, component]) => ({ name, component })
	);

	let _localSearch: string | undefined = $state();

	const effectiveSearch: string = $derived(_localSearch ?? '');

	let filteredIcons: IconEntry[] = $derived(
		effectiveSearch.trim()
			? allIcons.filter((e) =>
					e.name.toLowerCase().includes(effectiveSearch.trim().toLowerCase())
				)
			: allIcons
	);

	let toastText = $state('');
	let showToast = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	function handleSearchInput(e: Event): void {
		_localSearch = (e.target as HTMLInputElement).value;
	}

	function copyImport(name: string): void {
		const line = `import { ${name} } from '$lib/assets/icons'`;
		navigator.clipboard.writeText(line);
		toastText = `Copied: ${name}`;
		showToast = true;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			showToast = false;
		}, 2000);
	}
</script>

<div class="relative min-h-screen p-8 font-sans" style="background-color: var(--background);">
	<h1 class="mb-2 text-2xl font-semibold" style="color: var(--foreground);">Icons</h1>
	<p class="mb-6 text-sm" style="color: var(--muted-foreground);">
		All icons from <code
			class="rounded px-1 font-mono text-xs"
			style="background-color: var(--muted); color: var(--foreground);">$lib/assets/icons</code
		>. Click any icon to copy its import statement.
	</p>

	<div class="mb-6 flex items-center gap-3">
		<div class="relative" style="flex: 1 1 200px; max-width: 300px;">
			<svg
				class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
				style="color: var(--muted-foreground);"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
			</svg>
			<input
				type="search"
				placeholder="Search icons…"
				value={effectiveSearch}
				oninput={handleSearchInput}
				class="w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none transition"
				style="border-color: var(--border); background-color: var(--card); color: var(--foreground);"
				aria-label="Search icons"
			/>
		</div>
		<span class="text-sm" style="color: var(--muted-foreground);" aria-live="polite">
			{filteredIcons.length} / {allIcons.length}
		</span>
	</div>

	{#if filteredIcons.length === 0}
		<div class="flex flex-col items-center justify-center py-20" style="color: var(--muted-foreground);">
			<svg
				width="40"
				height="40"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				class="mb-3 opacity-50"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
			</svg>
			<p class="text-sm">No icons match "<strong>{effectiveSearch}</strong>"</p>
		</div>
	{:else}
		<ul
			class="grid list-none gap-2 p-0"
			style="grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));"
		>
			{#each filteredIcons as entry (entry.name)}
				{@const IconComp = entry.component}
				<li>
					<button
						onclick={() => copyImport(entry.name)}
						class="flex w-full flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:scale-105 active:scale-95"
						style="border-color: var(--border); background-color: var(--card); color: var(--foreground);"
						title="Copy import for {entry.name}"
						aria-label="Copy import for {entry.name}"
					>
						<IconComp {size} {strokeWidth} color="var(--foreground)" />
						<span
							class="w-full truncate leading-tight"
							style="font-size: 10px; color: var(--muted-foreground);"
						>
							{entry.name}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if showToast}
		<div
			class="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg"
			style="background-color: var(--foreground); color: var(--background);"
			role="status"
			aria-live="polite"
		>
			{toastText}
		</div>
	{/if}
</div>
