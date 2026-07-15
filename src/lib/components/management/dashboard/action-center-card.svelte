<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import QuickActions, { type QuickAction } from './quick-actions.svelte';

	let {
		quickActions,
		title = 'Quick actions',
		description = 'Common tasks for your team',
		layout = 'list',
		class: className
	}: {
		quickActions: QuickAction[];
		title?: string;
		description?: string;
		layout?: 'list' | 'grid';
		class?: string;
	} = $props();
</script>

<Card.Root size="sm" class={cn('flex h-full min-h-0 flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">{title}</Card.Title>
		<Card.Description class="text-xs">{description}</Card.Description>
	</Card.Header>

	<Card.Content class="min-h-0 flex-1">
		<QuickActions actions={quickActions} {layout} />
	</Card.Content>
</Card.Root>
