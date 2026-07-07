<script lang="ts">
	import { afterNavigate } from '$app/navigation';

	let { children } = $props();

	afterNavigate(() => {
		document.querySelector<HTMLElement>('.app-shell-content')?.scrollTo({ top: 0 });
	});
</script>

<div class="p-4 sm:p-6">
	{@render children()}
</div>
