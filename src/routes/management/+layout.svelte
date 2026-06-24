<script lang="ts">
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<div class="min-h-screen bg-background">
	<nav class="border-b px-6 py-3 flex gap-6 text-sm font-medium">
		<a href={resolve('/management')} class="hover:text-foreground text-muted-foreground transition-colors">
			Management
		</a>
		<a href={resolve('/management/onboarding')} class="hover:text-foreground text-muted-foreground transition-colors">
			Onboarding
		</a>
	</nav>
	<main class="p-6">
		{@render children()}
	</main>
</div>
