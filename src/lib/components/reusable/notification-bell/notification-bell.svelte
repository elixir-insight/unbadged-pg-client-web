<script lang="ts">
	import { resolve } from '$app/paths';
	import { Bell } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	type NotificationsPath = '/management/notifications' | '/merchant/notifications';

	let { class: className, viewAllHref }: { class?: string; viewAllHref?: NotificationsPath } =
		$props();
</script>

{#if viewAllHref}
	<a
		href={resolve(viewAllHref)}
		class={cn(
			"relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-accent hover:text-accent-foreground",
			className
		)}
		aria-label="Notifications"
	>
		<Bell class="h-4 w-4" />
		<span
			class="absolute top-1 right-1 flex size-2 items-center justify-center rounded-full bg-primary"
			aria-hidden="true"
		></span>
	</a>
{:else}
	<span
		class={cn(
			'relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground',
			className
		)}
		aria-hidden="true"
	>
		<Bell class="h-4 w-4" />
	</span>
{/if}
