<script lang="ts">
	import { onMount } from 'svelte';
	import * as v from 'valibot';
	import { enhance } from '$app/forms';
	import { Input, Button, toast } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { theme } from '$lib/stores/theme.svelte';
	import { Eye, EyeOff } from '$lib/assets/icons/index';
	import { NewPasswordFormSchema } from '$lib/validation/password';
	import type { PageProps } from './$types';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data, form }: PageProps = $props();

	const userEmail = $derived(data.userEmail);
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let resendSeconds = $state(30);
	let confirmationCode = $state('');
	let otpInputRef = $state<HTMLInputElement | null>(null);
	let otpError = $state('');
	let submitting = $state(false);
	let resending = $state(false);
	let attemptedContinue = $state(false);

	const canSubmitOtp = $derived(/^\d{6}$/.test(confirmationCode));

	function computePasswordErrors(pwd: string, confirmPwd: string) {
		const result = v.safeParse(NewPasswordFormSchema, {
			newPassword: pwd,
			confirmPassword: confirmPwd
		});
		if (result.success) return { pwdError: '', confirmError: '' };

		let pwdError = '';
		let confirmError = '';
		for (const issue of result.issues) {
			const field = issue.path?.[0]?.key;
			if (field === 'newPassword' && !pwdError) pwdError = issue.message;
			if (field === 'confirmPassword' && !confirmError) confirmError = issue.message;
		}

		return { pwdError, confirmError };
	}

	const passwordErrors = $derived(
		attemptedContinue
			? computePasswordErrors(password, confirmPassword)
			: { pwdError: '', confirmError: '' }
	);
	const passwordError = $derived(passwordErrors.pwdError);
	const confirmPasswordError = $derived(passwordErrors.confirmError);

	$effect(() => {
		if (resendSeconds <= 0) return;

		const timerId = setInterval(() => {
			resendSeconds = Math.max(0, resendSeconds - 1);
		}, 1000);

		return () => clearInterval(timerId);
	});

	function handleOtpInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		confirmationCode = input.value.replace(/\D/g, '').slice(0, 6);
		input.value = confirmationCode;
		if (otpError) otpError = '';
	}

	function validatePassword(): boolean {
		attemptedContinue = true;
		const { pwdError, confirmError } = computePasswordErrors(password, confirmPassword);
		return !pwdError && !confirmError;
	}

	onMount(() => {
		theme.init();
	});

	const handleEnhance: SubmitFunction = ({ action, cancel }) => {
		const isResend = action.search.includes('/resend');

		if (isResend) {
			resending = true;
		} else {
			if (!canSubmitOtp) {
				otpError = 'Enter the 6-digit code sent to your email.';
				cancel();
				return;
			}
			if (!validatePassword()) {
				cancel();
				return;
			}
			otpError = '';
			submitting = true;
		}

		return async ({ result, update }) => {
			if (isResend) {
				resending = false;
				if (result.type === 'failure') {
					const message =
						(result.data as { error?: string } | undefined)?.error ?? 'Failed to resend the code.';
					toast.error(message, { position: 'top-right', closeButton: false });
					return;
				}
				if (result.type === 'success') {
					confirmationCode = '';
					otpError = '';
					resendSeconds = 30;
					queueMicrotask(() => otpInputRef?.focus());
					toast.success('A new code has been sent to your email.', { position: 'top-right' });
				}
				return;
			}

			submitting = false;
			if (result.type === 'failure') {
				const resultData = result.data as
					{ error?: string; errorField?: 'otp' | 'password' } | undefined;
				if (resultData?.errorField === 'otp') {
					otpError = resultData.error ?? 'Enter the correct verification code.';
					queueMicrotask(() => otpInputRef?.focus());
				}
			}
			if (result.type === 'redirect') {
				const redirectUrl = new URL(result.location, window.location.origin);
				const message = redirectUrl.searchParams.get('message');
				toast.success(message ?? 'Reset instructions sent', {
					description: 'Your password has been reset. Please sign in.',
					position: 'top-right'
				});
			}
			await update();
		};
	};
</script>

<main class="flex flex-1 items-center justify-center px-10">
	<div class="flex w-full max-w-md flex-col gap-17">
		<div class="">
			<CompanyLogoLight width="200" class="h-auto" />
		</div>

		<div class="flex flex-col gap-10">
			<div class="flex flex-col gap-2">
				<h1 class="text-3xl font-semibold tracking-tight text-gray-700">Reset Password</h1>
				<p class="text-base text-gray-700">Enter your login details to reset your password</p>
			</div>

			<form
				class="flex flex-col gap-6"
				method="POST"
				action="?/confirm"
				use:enhance={handleEnhance}
			>
				<input type="hidden" name="userEmail" value={userEmail} />
				<input type="hidden" name="newPassword" value={password} />
				<input type="hidden" name="confirmPassword" value={confirmPassword} />
				<input type="hidden" name="confirmationCode" value={confirmationCode} />

				{#if form?.error && form.errorField !== 'otp'}
					<p class="text-sm text-destructive">{form.error}</p>
				{/if}

				<div class="flex flex-col gap-3">
					<label class="text-lg font-normal text-gray-700" for="password">Password</label>
					<div class="relative">
						<Input
							id="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Enter Password"
							bind:value={password}
							autocomplete="new-password"
							aria-invalid={passwordError ? 'true' : undefined}
							class="h-11 pr-11 text-base!"
							onblur={() => (password = password.trim())}
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
					{#if passwordError}
						<p class="text-sm text-destructive">{passwordError}</p>
					{/if}
				</div>

				<div class="flex flex-col gap-3">
					<label class="text-lg font-normal text-gray-700" for="confirm-password">
						Re-enter Password
					</label>
					<div class="relative">
						<Input
							id="confirm-password"
							type={showConfirmPassword ? 'text' : 'password'}
							placeholder="Re-enter password"
							bind:value={confirmPassword}
							autocomplete="new-password"
							aria-invalid={confirmPasswordError ? 'true' : undefined}
							class="h-11 pr-11 text-base!"
							onblur={() => (confirmPassword = confirmPassword.trim())}
						/>
						<button
							type="button"
							onclick={() => (showConfirmPassword = !showConfirmPassword)}
							class="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
							aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
						>
							{#if showConfirmPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
					{#if confirmPasswordError}
						<p class="text-sm text-destructive">{confirmPasswordError}</p>
					{/if}
				</div>

				<div class="flex flex-col gap-3">
					<label class="text-lg font-normal text-gray-700" for="verification-code">
						Verification code
					</label>
					<Input
						id="verification-code"
						bind:ref={otpInputRef}
						type="text"
						inputmode="numeric"
						autocomplete="one-time-code"
						placeholder="Enter verification code"
						value={confirmationCode}
						maxlength={6}
						aria-invalid={otpError || (form?.error && form.errorField === 'otp')
							? 'true'
							: undefined}
						class="h-11 text-base!"
						oninput={handleOtpInput}
					/>
					{#if otpError || (form?.error && form.errorField === 'otp')}
						<p class="text-sm text-destructive">{otpError || form?.error}</p>
					{/if}

					<button
						type="submit"
						formaction="?/resend"
						class="self-start text-sm text-gray-700 underline underline-offset-4 disabled:opacity-50"
						disabled={resendSeconds > 0 || resending}
					>
						{#if resendSeconds > 0}
							Resend the code in {resendSeconds}s
						{:else}
							Resend the code
						{/if}
					</button>
				</div>

				<Button type="submit" class="h-11 w-full text-base" disabled={submitting}>
					{submitting ? 'Resetting…' : 'Reset Password'}
				</Button>
			</form>
		</div>
	</div>
</main>

<footer class="px-10 pb-8 text-center text-sm text-muted-foreground">
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
</footer>
