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

<section class="border-t border-border pt-5 first:border-t-0 first:pt-0">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<h2 class="text-sm font-semibold text-foreground">{title}</h2>
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
