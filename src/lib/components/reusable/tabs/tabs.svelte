<script lang="ts">
	import * as UITabs from '$lib/components/ui/tabs';
	import type { TabsListVariant } from '$lib/components/ui/tabs';
	import { cn } from '$lib/utils';
	import type { Snippet, Component } from 'svelte';

	export interface TabItem {
		value: string;
		label: string;
		icon?: Component;
		content: Snippet;
		disabled?: boolean;
	}

	let {
		tabs,
		value = $bindable(''),
		variant = 'default' as TabsListVariant,
		orientation = 'horizontal' as 'horizontal' | 'vertical',
		triggerClass,
		class: className,
		...restProps
	}: {
		tabs: TabItem[];
		value?: string;
		variant?: TabsListVariant;
		orientation?: 'horizontal' | 'vertical';
		triggerClass?: string;
		class?: string;
	} = $props();

	$effect.pre(() => {
		if (!value && tabs.length > 0) {
			value = tabs[0].value;
		}
	});
</script>

<UITabs.Tabs bind:value {orientation} class={cn(className)} {...restProps}>
	<UITabs.TabsList {variant}>
		{#each tabs as tab (tab.value)}
			<UITabs.TabsTrigger value={tab.value} disabled={tab.disabled} class={triggerClass}>
				{#if tab.icon}
					<tab.icon class="size-4" />
				{/if}
				{tab.label}
			</UITabs.TabsTrigger>
		{/each}
	</UITabs.TabsList>
	{#each tabs as tab (tab.value)}
		<UITabs.TabsContent value={tab.value}>
			{@render tab.content()}
		</UITabs.TabsContent>
	{/each}
</UITabs.Tabs>
