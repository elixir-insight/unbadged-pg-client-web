<script lang="ts">
	import type { Component } from 'svelte';
	import type { ReviewRow } from '../types';
	import * as Card from '$lib/components/ui/card';

	let {
		title,
		icon: Icon,
		rows
	}: {
		title: string;
		icon: Component<{ class?: string }>;
		rows: ReviewRow[];
	} = $props();
</script>

<Card.Root>
	<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-3">
		<div class="flex items-center gap-2">
			<span
				class="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground"
			>
				<Icon class="size-4" />
			</span>
			<Card.Title class="text-base">{title}</Card.Title>
		</div>
	</Card.Header>
	<Card.Content class="space-y-2">
		{#each rows as row (row.label)}
			<div class="flex items-start justify-between gap-4 text-sm">
				<span class="text-muted-foreground">{row.label}</span>
				<span class="text-right font-medium">{row.value}</span>
			</div>
		{/each}
	</Card.Content>
</Card.Root>
