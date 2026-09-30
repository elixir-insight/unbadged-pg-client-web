<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { OtpInput, toast } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { CircleCheck } from '$lib/assets/icons';

	const RESEND_COOLDOWN_SECONDS = 30;
	const SUCCESS_DISPLAY_MS = 700;

	let { data, form }: PageProps = $props();

	const userEmail = $derived(data.userEmail);

	let confirmationCode = $state('');
	let codeError = $state('');
	let resendError = $state('');
	let resendNotice = $state('');
	let submitting = $state(false);
	let resending = $state(false);
	let verified = $state(false);
	let resendSeconds = $state(RESEND_COOLDOWN_SECONDS);

	const canSubmit = $derived(/^\d{6}$/.test(confirmationCode));
	const canResend = $derived(resendSeconds <= 0 && !resending);

	function formatCountdown(totalSeconds: number): string {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}

	$effect(() => {
		if (!form) return;
		if (form.confirmationCode !== undefined) confirmationCode = form.confirmationCode;
		codeError = form.codeError ?? '';
		resendError = form.resendError ?? '';
		if ('resendSuccess' in form && form.resendSuccess) {
			resendNotice = 'Code resent.';
			resendSeconds = RESEND_COOLDOWN_SECONDS;
			resendError = '';
		}
	});

	$effect(() => {
		if (resendSeconds <= 0) return;
		const timerId = setInterval(() => {
			resendSeconds = Math.max(0, resendSeconds - 1);
		}, 1000);
		return () => clearInterval(timerId);
	});

	$effect(() => {
		if (!resendNotice) return;
		const timerId = setTimeout(() => {
			resendNotice = '';
		}, 4000);
		return () => clearTimeout(timerId);
	});

	function handleCodeChange() {
		if (codeError) codeError = '';
		if (resendNotice) resendNotice = '';
		if (resendError) resendError = '';
	}

	const onEnhance: SubmitFunction = ({ action, cancel }) => {
		const isResend = action.search.includes('/resend');

		if (isResend) {
			resending = true;
			resendError = '';
			resendNotice = '';
			return async ({ update }) => {
				resending = false;
				await update({ reset: false });
			};
		}

		if (!canSubmit) {
			codeError = 'Enter the 6-digit code.';
			cancel();
			return;
		}

		submitting = true;
		codeError = '';
		resendError = '';
		resendNotice = '';
		return async ({ result, update }) => {
			if (result.type === 'success' && result.data?.verified) {
				verified = true;
				toast.success('Email confirmed.', { position: 'top-right' });
				setTimeout(() => goto(resolve('/login')), SUCCESS_DISPLAY_MS);
				return;
			}
			submitting = false;
			await update({ reset: false });
		};
	};
</script>

<main class="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 sm:px-8 lg:px-10">
	<div class="min-h-0 flex-1" aria-hidden="true"></div>
	<div class="mx-auto w-full max-w-md shrink-0 py-2 sm:py-4">
		<div class="flex w-full flex-col gap-6 sm:gap-8 [@media(max-height:700px)]:gap-4">
			<div>
				<CompanyLogoLight width="160" class="h-auto w-36 sm:w-40" />
			</div>

			{#if verified}
				<div class="flex flex-col items-center gap-3 py-8 text-center" role="status">
					<CircleCheck class="h-12 w-12 text-success" aria-hidden="true" />
					<h1 class="text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">
						Email verified
					</h1>
					<p class="text-sm text-muted-foreground sm:text-base">Taking you to sign in…</p>
				</div>
			{:else}
				<div class="flex flex-col gap-5 sm:gap-6 [@media(max-height:700px)]:gap-4">
					<div class="flex flex-col gap-1.5 sm:gap-2">
						<h1 class="text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">
							Confirm your email
						</h1>
						<p class="text-sm text-muted-foreground sm:text-base">
							Enter the 6-digit code we sent to <span class="font-medium text-foreground"
								>{userEmail}</span
							>.
						</p>
					</div>

					<form
						method="POST"
						action="?/confirm"
						class="flex flex-col gap-4 sm:gap-5"
						novalidate
						use:enhance={onEnhance}
					>
						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="confirmationCode">
								Verification code
							</label>
							<OtpInput
								id="confirmationCode"
								name="confirmationCode"
								bind:value={confirmationCode}
								disabled={submitting || resending}
								invalid={Boolean(codeError)}
								autofocus
								aria-describedby={codeError ? 'confirmationCode-error' : undefined}
								onValueChange={handleCodeChange}
							/>
							{#if codeError}
								<p id="confirmationCode-error" class="text-sm text-destructive" role="alert">
									{codeError}
								</p>
							{/if}
						</div>

						<Button
							type="submit"
							class="h-11 min-h-11 w-full shrink-0 text-base"
							disabled={submitting || resending || !canSubmit}
						>
							{submitting ? 'Confirming…' : 'Confirm'}
						</Button>

						<div class="flex flex-col items-center gap-1">
							{#if resendSeconds > 0}
								<p class="text-center text-xs text-muted-foreground sm:text-sm">
									Resend code in {formatCountdown(resendSeconds)}
								</p>
							{:else}
								<button
									type="submit"
									formaction="?/resend"
									class="text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:no-underline disabled:opacity-50 sm:text-sm"
									disabled={!canResend}
								>
									{resending ? 'Resending…' : 'Resend code'}
								</button>
							{/if}
							{#if resendNotice}
								<p class="text-center text-xs text-primary sm:text-sm" role="status">
									{resendNotice}
								</p>
							{/if}
							{#if resendError}
								<p class="text-center text-xs text-destructive sm:text-sm" role="alert">
									{resendError}
								</p>
							{/if}
						</div>

						<p class="text-center text-xs text-muted-foreground sm:text-sm">
							Wrong email?
							<a
								href={resolve('/sign-up')}
								class="underline underline-offset-4 hover:text-foreground"
							>
								Go back and edit it.
							</a>
						</p>
					</form>
				</div>
			{/if}
		</div>
	</div>
	<div class="min-h-0 flex-1" aria-hidden="true"></div>
</main>

<footer
	class="flex shrink-0 flex-col gap-4 bg-background px-5 py-4 text-center sm:gap-6 sm:px-8 lg:px-10"
>
	<p class="text-xs text-muted-foreground sm:text-sm">
		<a
			href="https://elixirpay.in/terms"
			target="_blank"
			class="underline underline-offset-4 hover:text-foreground"
		>
			Terms and Conditions
		</a>
		<span class="mx-3 text-border" aria-hidden="true">|</span>
		<a
			href="https://elixirpay.in/privacy"
			target="_blank"
			class="underline underline-offset-4 hover:text-foreground"
		>
			Privacy Policy
		</a>
	</p>
	<p class="text-xs text-muted-foreground sm:text-sm">
		© 2026 ElixirPay • Secure Payment Gateway Platform
	</p>
</footer>
