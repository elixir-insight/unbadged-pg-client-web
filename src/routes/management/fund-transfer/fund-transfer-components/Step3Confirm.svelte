<script lang="ts">
	import {
		getTransferStore,
		OTP_LENGTH,
		MAX_OTP_ATTEMPTS,
		DEMO_OTP,
		DEMO_FAIL_OTP,
		formatInr
	} from '../fund-transfer.svelte';
	import OtpInput from './OtpInput.svelte';
	import ConfirmResultPanel from './ConfirmResultPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { MailIcon } from '$lib/assets/icons';
	import ShieldX from '@lucide/svelte/icons/shield-x';
	import ShieldLock from '@lucide/svelte/icons/shield';

	const store = getTransferStore();
	const showDemoHint = import.meta.env.DEV;

	const showOtpPhase = $derived(
		store.confirmStepStatus === 'pending' && !store.otpVerified && store.txnStatus !== 'processing'
	);

	const headerIcon = $derived(store.otpInputVisualState === 'error' ? ShieldX : ShieldLock);

	const otpSubtitle = $derived.by(() => {
		if (store.otpError && store.confirmStepStatus === 'pending') {
			const remaining = store.confirmAttemptsRemaining;
			return `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`;
		}
		return 'Enter the 6-digit code sent to your registered email.';
	});

	const attemptsLabel = $derived(
		store.otpAttempts > 0
			? `${store.confirmAttemptsRemaining} attempt${store.confirmAttemptsRemaining === 1 ? '' : 's'} remaining`
			: `${MAX_OTP_ATTEMPTS} attempts allowed`
	);

	const showTryAgain = $derived(Boolean(store.otpError) && showOtpPhase);

	const primaryDisabled = $derived(
		!showTryAgain && (store.otpDigits.length < OTP_LENGTH || store.otpAttempts >= MAX_OTP_ATTEMPTS)
	);

	function handleVerify(code: string) {
		store.verifyOtp(code);
	}

	function handlePrimaryAction() {
		if (showTryAgain) {
			store.retryOtpEntry();
			return;
		}
		store.verifyOtp(store.otpDigits);
	}
</script>

<div class="mx-auto w-full max-w-xl sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
	<div class="overflow-hidden rounded-lg border border-border shadow-sm">
		{#if showOtpPhase}
			<div
				class="flex min-h-[30rem] flex-col px-6 py-8 sm:min-h-[32rem] sm:px-8 sm:py-10 lg:min-h-[34rem] lg:px-10"
			>
				<div class="mb-6 flex items-start gap-3 sm:mb-8 lg:gap-4">
					<span
						class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground sm:size-11 lg:size-12"
					>
						{#key headerIcon}
							{@const Icon = headerIcon}
							<Icon class="size-5 sm:size-6" />
						{/key}
					</span>
					<div>
						<h2 class="text-base font-semibold text-foreground sm:text-lg">Verify OTP</h2>
						<p class="mt-0.5 text-sm text-muted-foreground sm:text-base">{otpSubtitle}</p>
					</div>
				</div>

				<div
					class="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center space-y-6 sm:max-w-md lg:max-w-xl lg:space-y-8"
				>
					<span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
						<MailIcon class="size-4" />
						p***@company.com
					</span>

					<OtpInput
						length={OTP_LENGTH}
						bind:value={store.otpDigits}
						error={store.otpError}
						disabled={false}
						visualState={store.otpInputVisualState}
						shakeKey={store.otpShakeKey}
						onComplete={handleVerify}
					/>

					<div class="w-full space-y-2">
						<div class="flex items-center justify-between text-xs text-muted-foreground">
							<span>Code expires in</span>
							<span class="font-medium text-foreground tabular-nums">{store.formatCountdown()}</span
							>
						</div>
						<Progress value={store.otpProgressValue} />
					</div>

					<div class="flex w-full items-center justify-between gap-3 text-xs">
						<span class="text-muted-foreground">{attemptsLabel}</span>
						<button
							type="button"
							class="font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
							disabled={!store.canResendOtp}
							onclick={() => store.resendOtp()}
						>
							Resend code
						</button>
					</div>

					{#if showDemoHint}
						<div
							class="w-full rounded-lg bg-muted px-3 py-2.5 text-center text-xs text-muted-foreground"
						>
							Demo success: <span class="font-mono font-semibold text-foreground">{DEMO_OTP}</span>
							&nbsp; Demo failure:
							<span class="font-mono font-semibold text-foreground">{DEMO_FAIL_OTP}</span>
						</div>
					{/if}

					<Button class="w-full" disabled={primaryDisabled} onclick={handlePrimaryAction}>
						{#if showTryAgain}
							Try again
						{:else}
							Verify and transfer {formatInr(store.amount)}
						{/if}
					</Button>
				</div>
			</div>
		{:else}
			<ConfirmResultPanel />
		{/if}
	</div>
</div>

{#if store.showBackToReview && showOtpPhase}
	<div class="mx-auto mt-4 w-full max-w-xl sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
		<Button variant="ghost" onclick={() => store.prevStep()}>Back to review</Button>
	</div>
{/if}
