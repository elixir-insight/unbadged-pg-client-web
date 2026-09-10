<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { StepPath } from './steps';
	import { stepHref } from './steps';

	let {
		title,
		editPath,
		children
	}: {
		title: string;
		editPath: StepPath;
		children: Snippet;
	} = $props();
</script>

<section class="rounded-xl border border-border p-5">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<p
			class="inline-flex rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold tracking-wide text-primary uppercase"
		>
			{title}
		</p>
		<a
			class="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			href={resolve(stepHref(editPath) as '/')}
		>
			Edit
		</a>
	</div>
	<div class="space-y-2">
		{@render children()}
	</div>
</section>
