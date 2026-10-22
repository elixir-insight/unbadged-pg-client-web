<script lang="ts">
	import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
	import KybReviewPage from '$lib/kyb-review/KybReviewPage.svelte';
	import type { ProfileFormOptions } from '$lib/kyb-review/profile';
	import ExistingKybForm from './existing-kyb-form.svelte';
	// Same service/affiliate choices the create-organization profile step offers.
	import {
		affiliatesByPipeline,
		availableServiceTypes
	} from '../../../create-organization/constants';

	let { data } = $props();

	const inReview = $derived(data.kybReview.organization.status === 'IN_REVIEW');

	const profileOptions = $derived<ProfileFormOptions>({
		availableServiceTypes,
		bankPipelinesByService: {
			'Pay-Ins': data.kybReview.pipelines.payin,
			Payouts: data.kybReview.pipelines.payout
		},
		affiliatesByPipeline,
		pipelinesError: data.kybReview.pipelines.error
	});

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
			{profileOptions}
			sensitiveDataError={data.kybReview.sensitiveDataError}
			bind:this={reviewPage}
			onContinue={continueTo}
		/>
	{/key}
{:else}
	<ExistingKybForm {data} />
{/if}
