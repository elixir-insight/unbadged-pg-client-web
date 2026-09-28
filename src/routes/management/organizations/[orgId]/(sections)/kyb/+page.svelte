<script lang="ts">
	import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
	import KybReviewPage from '$lib/kyb-review/KybReviewPage.svelte';
	import ExistingKybForm from './existing-kyb-form.svelte';

	let { data } = $props();

	const inReview = $derived(data.kybReview.organization.status === 'IN_REVIEW');

	let reviewPage = $state<KybReviewPage>();
	let bypassNavigation = false;

	beforeNavigate((navigation) => {
		if (!inReview || bypassNavigation || !navigation.to) return;
		const href = `${navigation.to.url.pathname}${navigation.to.url.search}${navigation.to.url.hash}`;
		if (reviewPage?.blockNavigation(href)) navigation.cancel();
	});

	afterNavigate(() => {
		bypassNavigation = false;
	});

	function continueTo(href: string) {
		bypassNavigation = true;
		// href is already resolved (KybReviewPage stepHref or the navigation target URL).
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(href);
	}
</script>

{#if inReview}
	{#key data.kybReview.organization.id}
		<KybReviewPage
			organization={data.kybReview.organization}
			sections={data.kybReview.sections}
			verifications={data.kybReview.verifications}
			bind:this={reviewPage}
			onContinue={continueTo}
		/>
	{/key}
{:else}
	<ExistingKybForm {data} />
{/if}
