<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createTransferStore, setTransferStore } from './fund-transfer.svelte';
	import { createIsDesktop } from '$lib/hooks/is-desktop.svelte';
	import StepSidebar from './fund-transfer-components/StepSidebar.svelte';
	import Step1TransferDetails from './fund-transfer-components/Step1TransferDetails.svelte';
	import Step2Review from './fund-transfer-components/Step2Review.svelte';
	import Step3Confirm from './fund-transfer-components/Step3Confirm.svelte';
	import BalanceStatusBanner from './fund-transfer-components/BalanceStatusBanner.svelte';
	import * as Card from '$lib/components/ui/card';

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

<div class="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
	<section class="order-2 min-w-0 lg:order-1">
		<ActiveStep />
	</section>

	<aside class="order-1 lg:sticky lg:top-0 lg:order-2 lg:self-start">
		<Card.Root class="shadow-sm">
			<Card.Content class="p-4 sm:p-6">
				<StepSidebar
					steps={store.stepsConfig}
					currentIndex={store.currentStepIndex}
					horizontal={!isDesktop.current}
				>
					{#snippet footer()}
						<BalanceStatusBanner status={store.balanceStatus} message={store.balanceMessage} />
					{/snippet}
				</StepSidebar>
			</Card.Content>
		</Card.Root>
	</aside>
</div>
