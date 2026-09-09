<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input, toast } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { SIGN_UP_EMAIL_REGEX } from '$lib/validation/sign-up';

	let { data, form }: PageProps = $props();

	let emailDraft = $state('');
	let confirmationCode = $state('');
	let codeError = $state('');
	let emailError = $state('');
	let resendError = $state('');
	let resendNotice = $state('');
	let submitting = $state(false);
	let resending = $state(false);
	let resendSeconds = $state(30);
	let codeInputRef = $state<HTMLInputElement | null>(null);

	const knownEmail = $derived(data.userEmail.trim());
	const userEmail = $derived(knownEmail || emailDraft.trim().toLowerCase());
	const needsEmail = $derived(knownEmail.length === 0);
	const canSubmit = $derived(
		/^\d{6}$/.test(confirmationCode) && (!needsEmail || SIGN_UP_EMAIL_REGEX.test(userEmail))
	);
	const canResend = $derived(
		resendSeconds <= 0 && !resending && SIGN_UP_EMAIL_REGEX.test(userEmail)
	);

	$effect(() => {
		if (!form) return;
		if (form.userEmail !== undefined && needsEmail) emailDraft = form.userEmail;
		if (form.confirmationCode !== undefined) confirmationCode = form.confirmationCode;
		codeError = form.codeError ?? '';
		emailError = form.emailError ?? '';
		resendError = form.resendError ?? '';
		if ('resendSuccess' in form && form.resendSuccess) {
			resendNotice = 'Code resent.';
			resendSeconds = 30;
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

	function handleCodeInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		confirmationCode = input.value.replace(/\D/g, '').slice(0, 6);
		input.value = confirmationCode;
		if (codeError) codeError = '';
		if (resendNotice) resendNotice = '';
		if (resendError) resendError = '';
	}

	function handleEmailInput() {
		if (emailError) emailError = '';
		if (resendError) resendError = '';
		if (resendNotice) resendNotice = '';
	}

	const onEnhance: SubmitFunction = ({ action, cancel }) => {
		const isResend = action.search.includes('/resend');

		if (isResend) {
			if (!SIGN_UP_EMAIL_REGEX.test(userEmail)) {
				emailError = needsEmail ? 'Enter a valid email address.' : '';
				resendError = needsEmail ? '' : 'Enter a valid email address.';
				cancel();
				return;
			}
			resending = true;
			resendError = '';
			resendNotice = '';
			return async ({ result, update }) => {
				resending = false;
				await update({ reset: false });
				if (result.type === 'failure') {
					queueMicrotask(() => {
						if (needsEmail) {
							document.getElementById('userEmail')?.focus();
						}
					});
				}
			};
		}

		if (!canSubmit) {
			if (needsEmail && !SIGN_UP_EMAIL_REGEX.test(userEmail)) {
				emailError = 'Enter a valid email address.';
			}
			if (!/^\d{6}$/.test(confirmationCode)) {
				codeError = 'Enter the 6-digit code.';
			}
			cancel();
			return;
		}

		submitting = true;
		codeError = '';
		emailError = '';
		resendError = '';
		resendNotice = '';
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'redirect') {
				toast.success('Email confirmed.', { position: 'top-right' });
			}
			if (result.type === 'failure') {
				queueMicrotask(() => codeInputRef?.focus());
			}
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

			<div class="flex flex-col gap-5 sm:gap-6 [@media(max-height:700px)]:gap-4">
				<div class="flex flex-col gap-1.5 sm:gap-2">
					<h1 class="text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">
						Confirm your email
					</h1>
					<p class="text-sm text-muted-foreground sm:text-base">
						{#if userEmail && SIGN_UP_EMAIL_REGEX.test(userEmail)}
							Enter the 6-digit code we sent to {userEmail}.
						{:else}
							Enter the 6-digit code we sent to your email.
						{/if}
					</p>
				</div>

				<form
					method="POST"
					action="?/confirm"
					class="flex flex-col gap-4 sm:gap-5"
					novalidate
					use:enhance={onEnhance}
				>
					{#if needsEmail}
						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="userEmail">
								Email
							</label>
							<Input
								id="userEmail"
								name="userEmail"
								type="email"
								placeholder="name@company.com"
								bind:value={emailDraft}
								autocomplete="email"
								disabled={submitting || resending}
								aria-invalid={emailError ? 'true' : undefined}
								aria-describedby={emailError ? 'userEmail-error' : undefined}
								class="h-11 text-base!"
								oninput={handleEmailInput}
								onblur={() => (emailDraft = emailDraft.trim().toLowerCase())}
							/>
							{#if emailError}
								<p id="userEmail-error" class="text-sm text-destructive" role="alert">
									{emailError}
								</p>
							{/if}
						</div>
					{:else}
						<input type="hidden" name="userEmail" value={userEmail} />
					{/if}

					<div class="flex flex-col gap-2">
						<label class="text-base font-normal text-gray-700 sm:text-lg" for="confirmationCode">
							Verification code
						</label>
						<Input
							id="confirmationCode"
							bind:ref={codeInputRef}
							name="confirmationCode"
							type="text"
							inputmode="numeric"
							autocomplete="one-time-code"
							placeholder="Enter verification code"
							value={confirmationCode}
							maxlength={6}
							disabled={submitting || resending}
							aria-invalid={codeError ? 'true' : undefined}
							aria-describedby={codeError ? 'confirmationCode-error' : undefined}
							class="h-11 w-full rounded-md border border-input bg-background text-center text-lg font-semibold tracking-[1em] text-foreground placeholder:font-normal placeholder:tracking-normal"
							oninput={handleCodeInput}
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
								Resend code in {resendSeconds}s
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
						<a href={resolve('/signup')} class="underline underline-offset-4 hover:text-foreground">
							Sign up again
						</a>
					</p>
				</form>
			</div>
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
