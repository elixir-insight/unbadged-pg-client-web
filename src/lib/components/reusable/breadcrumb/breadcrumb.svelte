<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { resolve } from '$app/paths';
	import { ChevronRight } from '$lib/assets/icons';

	let {
		items,
		class: className = 'hidden md:block'
	}: { items: { label: string; href: string }[]; class?: string } = $props();
</script>

<!--
  Responsive breadcrumb strategy:
  ┌──────────────────────────────────────────────────────────┐
  │ Length │ Mobile              │ Desktop                   │
  ├────────┼─────────────────────┼───────────────────────────┤
  │   1    │ Current             │ Current                   │
  │   2    │ Parent / Current    │ Parent / Current          │
  │  3+    │ … / Parent /Current │ A / B / … / Parent/Current│
  └──────────────────────────────────────────────────────────┘
-->
<Breadcrumb.Root class={className}>
	<Breadcrumb.List>
		{#if items.length === 0}
			<!-- nothing -->
		{:else if items.length === 1}
			<Breadcrumb.Item>
				<Breadcrumb.Page>{items[0].label}</Breadcrumb.Page>
			</Breadcrumb.Item>
		{:else if items.length === 2}
			<Breadcrumb.Item>
				<Breadcrumb.Link class="font-semibold text-foreground" href={resolve(items[0].href as '/')}
					>{items[0].label}</Breadcrumb.Link
				>
			</Breadcrumb.Item>
			<Breadcrumb.Separator>
				<ChevronRight size={50} />
			</Breadcrumb.Separator>
			<Breadcrumb.Item>
				<Breadcrumb.Page class="text-sm font-normal text-muted-foreground"
					>{items[1].label}</Breadcrumb.Page
				>
			</Breadcrumb.Item>
		{:else}
			<!-- 3+ items -->

			<!-- Desktop only: first item -->
			<Breadcrumb.Item class="hidden md:flex">
				<Breadcrumb.Link class="font-semibold text-foreground" href={resolve(items[0].href as '/')}
					>{items[0].label}</Breadcrumb.Link
				>
			</Breadcrumb.Item>
			<Breadcrumb.Separator class="hidden md:flex" />

			<!-- Desktop only: intermediate items between first and second-to-last -->
			{#each items.slice(1, -2) as item (item.href)}
				<Breadcrumb.Item class="hidden md:flex">
					<Breadcrumb.Link class="font-semibold text-foreground" href={resolve(item.href as '/')}
						>{item.label}</Breadcrumb.Link
					>
				</Breadcrumb.Item>
				<Breadcrumb.Separator class="hidden md:flex" />
			{/each}

			<!-- Mobile only: ellipsis replaces all items before the parent -->
			<Breadcrumb.Item class="md:hidden">
				<Breadcrumb.Ellipsis />
			</Breadcrumb.Item>
			<Breadcrumb.Separator class="md:hidden" />

			<!-- Both: second-to-last (parent of current page) -->
			<Breadcrumb.Item>
				<Breadcrumb.Link
					class="font-semibold text-foreground"
					href={resolve(items[items.length - 2].href as '/')}
				>
					{items[items.length - 2].label}
				</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />

			<!-- Both: current page -->
			<Breadcrumb.Item>
				<Breadcrumb.Page
					class="max-w-40 truncate text-xs font-normal text-muted-foreground sm:max-w-none"
				>
					{items[items.length - 1].label}
				</Breadcrumb.Page>
			</Breadcrumb.Item>
		{/if}
	</Breadcrumb.List>
</Breadcrumb.Root>
