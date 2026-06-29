<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { colorGroups, type CssColorToken } from '$lib/tokens/tokens';

	let computedValues = new SvelteMap<string, string>();

	$effect(() => {
		if (typeof window === 'undefined') return;
		const style = getComputedStyle(document.documentElement);
		computedValues.clear();
		for (const group of colorGroups) {
			for (const token of group.tokens) {
				const val = style.getPropertyValue(token.cssVar).trim();
				computedValues.set(token.cssVar, val);
			}
		}
	});

	let toastText = $state('');
	let showToast = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	function copyVar(token: CssColorToken): void {
		navigator.clipboard.writeText(token.value);
		toastText = `Copied ${token.value}`;
		showToast = true;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			showToast = false;
		}, 2000);
	}
</script>

<div class="relative min-h-screen p-8 font-sans" style="background-color: var(--background);">
	<h1 class="mb-2 text-2xl font-semibold" style="color: var(--foreground);">Colors</h1>
	<p class="mb-10 text-sm" style="color: var(--muted-foreground);">
		CSS custom properties from <code
			class="rounded px-1 font-mono text-xs"
			style="background-color: var(--muted);">layout.css</code
		>. Click any swatch to copy its CSS variable.
	</p>

	<div class="flex flex-col gap-10">
		{#each colorGroups as group (group.id)}
			<section>
				<div class="mb-4">
					<div class="flex items-center gap-2">
						<h2 class="text-base font-semibold" style="color: var(--foreground);">{group.label}</h2>
						<span
							class="rounded-full px-2 py-0.5 text-xs font-medium"
							style="background-color: var(--secondary); color: var(--secondary-foreground);"
						>
							{group.tokens.length} tokens
						</span>
					</div>
					<p class="mt-0.5 text-xs" style="color: var(--muted-foreground);">{group.usage}</p>
				</div>

				<div class="flex flex-wrap gap-4">
					{#each group.tokens as token (token.cssVar)}
						<button
							onclick={() => copyVar(token)}
							class="group flex flex-col gap-2 rounded-xl border p-3 text-left transition-all hover:scale-105 active:scale-95"
							style="border-color: var(--border); background-color: var(--card); min-width: 120px;"
							title="Copy {token.value}"
							aria-label="Copy CSS variable {token.value} for {token.label}"
						>
							<!-- Swatch -->
							<div
								class="relative flex h-14 w-full items-center justify-center rounded-lg border"
								style="background-color: {token.value}; border-color: var(--border);"
							>
								<span
									class="absolute inset-0 flex items-center justify-center rounded-lg text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
									style="color: {token.isLight
										? 'var(--foreground)'
										: 'var(--primary-foreground)'};"
								>
									Copy
								</span>
							</div>

							<!-- Labels -->
							<div>
								<p class="text-xs font-medium" style="color: var(--foreground);">{token.label}</p>
								<p class="font-mono text-xs" style="color: var(--primary);">{token.cssVar}</p>
								{#if computedValues.get(token.cssVar)}
									<p
										class="mt-0.5 font-mono leading-tight"
										style="font-size: 10px; color: var(--muted-foreground);"
									>
										{computedValues.get(token.cssVar)}
									</p>
								{/if}
							</div>
						</button>
					{/each}
				</div>

				<div class="mt-8 border-b" style="border-color: var(--border);"></div>
			</section>
		{/each}
	</div>

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
