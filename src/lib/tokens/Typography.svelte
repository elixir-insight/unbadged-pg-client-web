<script lang="ts">
	import { tokens } from '$lib/tokens/tokens';

	type SizeEntry = {
		key: string;
		px: string;
		usage: string;
		usageColor: string;
	};

	const usageMap: Record<string, { label: string; color: string }> = {
		xs: { label: 'table cells · labels', color: '#888780' },
		sm: { label: 'table cells · labels', color: '#888780' },
		base: { label: 'body · inputs', color: '#185FA5' },
		md: { label: 'body · inputs', color: '#185FA5' },
		lg: { label: 'headings', color: '#0C447C' },
		xl: { label: 'headings', color: '#0C447C' },
		'2xl': { label: 'dashboard numbers', color: '#1D9E75' },
		'3xl': { label: 'dashboard numbers', color: '#1D9E75' }
	};

	const sizeEntries: SizeEntry[] = (
		Object.entries(tokens.typography.sizes) as Array<[string, string]>
	).map(([key, px]) => ({
		key,
		px,
		usage: usageMap[key]?.label ?? '',
		usageColor: usageMap[key]?.color ?? '#888780'
	}));

	const weightEntries = Object.entries(tokens.typography.weights) as Array<[string, number]>;
	const lineHeightEntries = Object.entries(tokens.typography.lineHeights) as Array<
		[string, number]
	>;

	const sampleText = 'Payment confirmed ₹1,200.00';
</script>

<div class="min-h-screen bg-white p-8 font-sans">
	<h1 class="mb-2 text-2xl font-semibold text-gray-900">Typography</h1>
	<p class="mb-10 text-sm text-gray-500">
		All sizes reference <code class="rounded bg-gray-100 px-1 font-mono text-xs"
			>tokens.typography.sizes</code
		>.
	</p>

	<!-- Size scale -->
	<section class="mb-12">
		<h2 class="mb-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">Type Scale</h2>
		<div class="overflow-hidden rounded-xl border border-gray-100">
			{#each sizeEntries as entry, i (entry.key)}
				<div
					class="flex items-center gap-6 border-b border-gray-50 px-6 py-4 last:border-b-0 {i %
						2 ===
					0
						? 'bg-white'
						: 'bg-gray-50/50'}"
				>
					<!-- Size label -->
					<div class="w-24 shrink-0">
						<span class="text-sm font-semibold text-gray-800">{entry.key}</span>
						<span class="ml-2 font-mono text-xs text-gray-400">{entry.px}</span>
					</div>

					<!-- Usage badge -->
					<div class="w-44 shrink-0">
						<span
							class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
							style="background-color: {entry.usageColor}18; color: {entry.usageColor};"
						>
							{entry.usage}
						</span>
					</div>

					<!-- Live text sample -->
					<p
						class="min-w-0 flex-1 truncate text-gray-800"
						style="font-size: {entry.px}; line-height: {tokens.typography.lineHeights.normal};"
					>
						{sampleText}
					</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Weights + Line heights side by side -->
	<div class="grid grid-cols-2 gap-8">
		<section>
			<h2 class="mb-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">
				Font Weights
			</h2>
			<div class="flex flex-col gap-3">
				{#each weightEntries as [name, value] (name)}
					<div class="flex items-baseline gap-4 rounded-lg bg-gray-50 px-5 py-3">
						<span class="w-24 font-mono text-xs text-gray-400">{name} · {value}</span>
						<span class="text-base text-gray-800" style="font-weight: {value};">
							Payment confirmed ₹1,200.00
						</span>
					</div>
				{/each}
			</div>
		</section>

		<section>
			<h2 class="mb-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">
				Line Heights
			</h2>
			<div class="flex flex-col gap-3">
				{#each lineHeightEntries as [name, value] (name)}
					<div class="rounded-lg bg-gray-50 px-5 py-3">
						<div class="mb-1 flex items-center gap-2">
							<span class="font-mono text-xs text-gray-400">{name} · {value}</span>
						</div>
						<p class="text-sm text-gray-800" style="line-height: {value};">
							Payment confirmed ₹1,200.00.<br />Settlement processed by gateway.
						</p>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
