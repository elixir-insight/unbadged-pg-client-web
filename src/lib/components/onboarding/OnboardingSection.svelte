<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		trailing?: Snippet;
		children: Snippet;
	}

	let { title, description, trailing, children }: Props = $props();
</script>

<section class="px-6 py-5">
	<div class="mb-4 flex items-center justify-between gap-3">
		<div>
			<p class="text-sm font-medium">{title}</p>
			{#if description}
				<p class="mt-0.5 text-xs text-muted-foreground">{description}</p>
			{/if}
		</div>
		{#if trailing}
			{@render trailing()}
		{/if}
	</div>
	{@render children()}
</section>
