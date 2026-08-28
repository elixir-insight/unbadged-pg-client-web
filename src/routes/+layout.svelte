<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toast } from '$lib/components/reusable';
	import { merchantSession } from '$lib/stores/auth';
	import { userPermissions } from '$lib/stores/rbac';
	import {
		isKybSubStepNavigation,
		isPreviewSubSectionNavigation
	} from './management/organizations/[orgId]/helpers';

	let { data, children } = $props();
	let isNavigating = $state(false);

	$effect(() => {
		merchantSession.hydrate(data.session);
		userPermissions.hydrate(data.permissions);
	});

	onNavigate((navigation) => {
		const toPath = navigation.to?.url.pathname ?? '';
		const fromPath = navigation.from?.url.pathname ?? '';
		const sectionPath = /\/management\/organizations\/[^/]+\/(documents|integration)(?:\/|$)/;
		const skipViewTransition =
			sectionPath.test(toPath) ||
			sectionPath.test(fromPath) ||
			isKybSubStepNavigation(navigation.from?.url, navigation.to?.url) ||
			isPreviewSubSectionNavigation(navigation.from?.url, navigation.to?.url);

		if (!skipViewTransition) {
			isNavigating = true;
		}

		if (!document.startViewTransition || skipViewTransition) {
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

<Toast richColors position="top-right" />
{@render children()}
