<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createTransferStore, setTransferStore } from './fund-transfer.svelte';
	import { createIsDesktop } from '$lib/hooks/is-desktop.svelte';
	import StepSidebar from './fund-transfer-components/StepSidebar.svelte';
	import Step1TransferDetails from './fund-transfer-components/Step1TransferDetails.svelte';
	import Step2Review from './fund-transfer-components/Step2Review.svelte';
	import Step3Confirm from './fund-transfer-components/Step3Confirm.svelte';
	import BalanceStatusBanner from './fund-transfer-components/BalanceStatusBanner.svelte';

	const store = createTransferStore();
	setTransferStore(store);

	const isDesktop = createIsDesktop();

	const stepComponents = [Step1TransferDetails, Step2Review, Step3Confirm];
	const ActiveStep = $derived(stepComponents[store.currentStepIndex]);

	onDestroy(() => {
		store.stopOtpCountdown();
		store.stopProcessing();
	});
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
	<aside class="lg:sticky lg:top-0 lg:self-start">
		<StepSidebar
			steps={store.stepsConfig}
			currentIndex={store.currentStepIndex}
			horizontal={!isDesktop.current}
		>
			{#snippet footer()}
				<BalanceStatusBanner status={store.balanceStatus} message={store.balanceMessage} />
			{/snippet}
		</StepSidebar>
	</aside>

	<section class="min-w-0">
		<ActiveStep />
	</section>
</div>
