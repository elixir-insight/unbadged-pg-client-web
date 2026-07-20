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
	import { ShieldCheck, MailIcon, PhoneIcon } from '$lib/assets/icons';
	import ShieldX from '@lucide/svelte/icons/shield-x';
	import ShieldLock from '@lucide/svelte/icons/shield';
	import { cn } from '$lib/utils';

	const store = getTransferStore();
	const showDemoHint = import.meta.env.DEV;

	const headerIcon = $derived.by(() => {
		if (store.otpVerified) return ShieldCheck;
		if (store.otpInputVisualState === 'error') return ShieldX;
		return ShieldLock;
	});

	const otpSubtitle = $derived.by(() => {
		if (store.otpVerified) return 'Code verified successfully.';
		if (store.otpError && store.confirmStepStatus === 'pending') {
			const remaining = store.confirmAttemptsRemaining;
			return `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`;
		}
		if (store.confirmStepStatus === 'failed' && !store.otpVerified) {
			return 'Maximum verification attempts exceeded.';
		}
		return 'Enter the 6-digit code sent to your registered mobile and email.';
	});

	const attemptsLabel = $derived(
		store.otpAttempts > 0
			? `${store.confirmAttemptsRemaining} attempt${store.confirmAttemptsRemaining === 1 ? '' : 's'} remaining`
			: `${MAX_OTP_ATTEMPTS} attempts allowed`
	);

	const showTryAgain = $derived(
		Boolean(store.otpError) && store.confirmStepStatus === 'pending' && !store.otpVerified
	);

	const primaryDisabled = $derived(
		store.otpVerified ||
			(!showTryAgain &&
				(store.otpDigits.length < OTP_LENGTH || store.otpAttempts >= MAX_OTP_ATTEMPTS))
	);

	function handleVerify(code: string) {
		if (store.otpVerified) return;
		store.verifyOtp(code);
	}

	function handlePrimaryAction() {
		if (store.otpVerified) return;
		if (showTryAgain || (store.confirmStepStatus === 'failed' && !store.otpVerified)) {
			store.retryOtpEntry();
			return;
		}
		store.verifyOtp(store.otpDigits);
	}
</script>

<div class="overflow-hidden rounded-lg border border-border">
	<div class="grid grid-cols-1 lg:grid-cols-2 lg:gap-0">
		<!-- LEFT: OTP entry (always visible) -->
		<div class="border-border px-6 py-6 lg:border-r">
			<div class="mb-6 flex items-start gap-3">
				<span
					class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
				>
					{#key headerIcon}
						{@const Icon = headerIcon}
						<Icon class="size-5" />
					{/key}
				</span>
				<div>
					<h2 class="text-base font-semibold text-foreground">Verify OTP</h2>
					<p class="mt-0.5 text-sm text-muted-foreground">{otpSubtitle}</p>
				</div>
			</div>

			<div class="mx-auto flex max-w-sm flex-col items-center space-y-6">
				<div class="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
					<span class="inline-flex items-center gap-1.5">
						<PhoneIcon class="size-4" />
						+91 ••••• 43210
					</span>
					<span class="inline-flex items-center gap-1.5">
						<MailIcon class="size-4" />
						p***@company.com
					</span>
				</div>

				<OtpInput
					length={OTP_LENGTH}
					bind:value={store.otpDigits}
					error={store.otpError}
					disabled={store.otpVerified}
					visualState={store.otpInputVisualState}
					shakeKey={store.otpShakeKey}
					onComplete={handleVerify}
				/>

				{#if store.otpVerified}
					<p class="text-sm font-medium text-primary">Verified ✓</p>
				{:else}
					<div class="w-full space-y-2">
						<div class="flex items-center justify-between text-xs text-muted-foreground">
							<span>Code expires in</span>
							<span class="font-medium text-foreground tabular-nums">{store.formatCountdown()}</span
							>
						</div>
						<Progress value={store.otpProgressValue} />
					</div>
				{/if}

				<div class="flex w-full items-center justify-between gap-3 text-xs">
					<span class="text-muted-foreground">{attemptsLabel}</span>
					<button
						type="button"
						class="font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
						disabled={!store.canResendOtp || store.otpVerified}
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

				<Button
					class={cn('w-full', store.otpVerified && 'opacity-50')}
					disabled={primaryDisabled}
					onclick={handlePrimaryAction}
				>
					{#if showTryAgain || (store.confirmStepStatus === 'failed' && !store.otpVerified)}
						Try again
					{:else}
						Verify and transfer {formatInr(store.amount)}
					{/if}
				</Button>
			</div>
		</div>

		<!-- RIGHT: result panel -->
		<div class="border-t border-border lg:border-t-0">
			<ConfirmResultPanel />
		</div>
	</div>
</div>

{#if store.showBackToReview}
	<div class="mt-4">
		<Button variant="ghost" onclick={() => store.prevStep()}>Back to review</Button>
	</div>
{/if}
