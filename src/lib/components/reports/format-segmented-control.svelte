<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { cn } from '$lib/utils';
	import type { ReportFileFormat } from './types';

	let {
		value = $bindable<ReportFileFormat>('csv'),
		disabled = false,
		class: className
	}: {
		value?: ReportFileFormat;
		disabled?: boolean;
		class?: string;
	} = $props();

	const options: { value: ReportFileFormat; label: string }[] = [
		{ value: 'csv', label: 'CSV' },
		{ value: 'xlsx', label: 'XLSX' }
	];
</script>

<Tabs.Root bind:value class={cn('w-fit', className)}>
	<Tabs.List variant="default" class="h-9">
		{#each options as option (option.value)}
			<Tabs.Trigger value={option.value} {disabled} class="min-w-20 px-4">
				.{option.label}
			</Tabs.Trigger>
		{/each}
	</Tabs.List>
</Tabs.Root>
