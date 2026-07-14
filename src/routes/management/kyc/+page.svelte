<script lang="ts">
	import {
		KycAadhaarResult,
		KycEmptyState,
		KycFailedState,
		KycLoadingState,
		KycPanResult,
		KycTabBar,
		KycVerificationForm,
		createVerificationRefId,
		maskAadhaar,
		mockAadhaarResult,
		mockPanResult,
		sanitizeAadhaar,
		sanitizePan,
		validateKycInput,
		type AadhaarResult,
		type KycTab,
		type PanResult,
		type VerificationHistoryEntry,
		type VerificationStatus
	} from '$lib/components/kyc';

	// Replace with the signed-in user from your auth context.
	const CURRENT_USER = 'Arjun Mehta';

	let tab = $state<KycTab>('aadhaar');
	let aadhaar = $state('');
	let pan = $state('');
	let status = $state<VerificationStatus>('idle');
	let result = $state<AadhaarResult | PanResult | null>(null);
	let error = $state('');
	let history = $state<VerificationHistoryEntry[]>([]);

	const aadhaarDigits = $derived(sanitizeAadhaar(aadhaar));
	const panValue = $derived(sanitizePan(pan));
	const currentRefId = $derived(history[0]?.id ?? '');

	function resetVerification() {
		status = 'idle';
		result = null;
		error = '';
	}

	function switchTab(next: KycTab) {
		tab = next;
		resetVerification();
	}

	function retry() {
		resetVerification();
	}

	function handleVerify() {
		error = '';

		const validationError = validateKycInput(tab, tab === 'aadhaar' ? aadhaar : pan);
		if (validationError) {
			error = validationError;
			return;
		}

		status = 'loading';
		result = null;

		window.setTimeout(() => {
			const isSuccess = Math.random() > 0.2;
			const entryId = createVerificationRefId();
			const identifier = tab === 'aadhaar' ? maskAadhaar(aadhaarDigits) : panValue;

			if (isSuccess) {
				result = tab === 'aadhaar' ? mockAadhaarResult(aadhaarDigits) : mockPanResult(panValue);
				status = 'success';
			} else {
				result = null;
				status = 'failed';
			}

			history = [
				{
					id: entryId,
					timestamp: new Date(),
					method: tab === 'aadhaar' ? 'Aadhaar' : 'PAN',
					identifier,
					initiatedBy: CURRENT_USER,
					status: isSuccess ? 'Verified' : 'Failed'
				},
				...history
			];
		}, 1100);
	}

	function handleReset() {
		resetVerification();
		aadhaar = '';
		pan = '';
	}
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10 md:max-w-3xl md:px-10">
	<header class="mb-2">
		<h1 class="text-2xl font-semibold tracking-tight">KYC Verification</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Verify Aadhaar and PAN numbers through the configured KYC verification service.
		</p>
	</header>

	<KycTabBar bind:tab onchange={switchTab} />

	<KycVerificationForm
		{tab}
		bind:aadhaar
		bind:pan
		{status}
		bind:error
		onVerify={handleVerify}
		onReset={handleReset}
	/>

	{#if status === 'idle'}
		<KycEmptyState />
	{:else if status === 'loading'}
		<KycLoadingState />
	{:else if status === 'failed'}
		<KycFailedState onRetry={retry} />
	{:else if status === 'success' && result}
		{#if tab === 'aadhaar'}
			<KycAadhaarResult result={result as AadhaarResult} refId={currentRefId} />
		{:else}
			<KycPanResult result={result as PanResult} refId={currentRefId} />
		{/if}
	{/if}
</div>
