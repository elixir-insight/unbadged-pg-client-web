<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import QuickActions, { type QuickAction } from './quick-actions.svelte';

	let {
		quickActions,
		class: className
	}: {
		quickActions: QuickAction[];
		class?: string;
	} = $props();
</script>

<Card.Root size="sm" class={cn('flex h-full min-h-0 flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">Quick actions</Card.Title>
		<Card.Description class="text-xs">Common tasks for your team</Card.Description>
	</Card.Header>

	<Card.Content class="min-h-0 flex-1">
		<QuickActions actions={quickActions} />
	</Card.Content>
</Card.Root>
