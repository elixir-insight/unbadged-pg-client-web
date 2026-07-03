<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import { Toast } from '$lib/components/reusable';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	let isNavigating = $state(false);

	onNavigate((navigation) => {
		isNavigating = true;

		if (!document.startViewTransition) {
			navigation.complete.then(() => {
				isNavigating = false;
			});
			return;
		}

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
				isNavigating = false;
				// Flush Svelte's reactivity before the browser captures the new-page snapshot.
				await tick();
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>ElixirPay</title>
	<meta name="description" content="ElixirPay — Payment Gateway Management Platform" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="ElixirPay" />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if isNavigating}
	<div class="app-nav-progress" aria-hidden="true"></div>
{/if}

{@render children()}

<Toast position="bottom-right" richColors closeButton />
