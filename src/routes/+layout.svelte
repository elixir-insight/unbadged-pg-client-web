<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>ElixirPay</title>
	<meta name="description" content="ElixirPay — Payment Gateway Management Platform" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="ElixirPay" />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>
{@render children()}
