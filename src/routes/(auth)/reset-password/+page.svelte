<script lang="ts">
	import { onMount } from 'svelte';
	import * as v from 'valibot';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
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
	let currentStep = $state<'password' | 'otp'>('password');
	let resendSeconds = $state(30);
	let otpDigits = $state(['', '', '', '', '', '']);
	let otpRefs = $state<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);
	let submitting = $state(false);
	let attemptedContinue = $state(false);

	const confirmationCode = $derived(otpDigits.join(''));

	const canSubmitOtp = $derived(otpDigits.every((digit) => digit.length === 1));

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
		if (currentStep !== 'otp' || resendSeconds <= 0) return;

		const timerId = setInterval(() => {
			resendSeconds = Math.max(0, resendSeconds - 1);
		}, 1000);

		return () => clearInterval(timerId);
	});

	function moveFocus(index: number) {
		otpRefs[index]?.focus();
		otpRefs[index]?.select();
	}

	function handleOtpInput(index: number, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const value = input.value.replace(/\D/g, '').slice(-1);

		otpDigits[index] = value;
		input.value = value;

		if (value && index < otpDigits.length - 1) {
			moveFocus(index + 1);
		}
	}

	function handleOtpKeydown(index: number, event: KeyboardEvent) {
		if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
			moveFocus(index - 1);
		}

		if (event.key === 'ArrowLeft' && index > 0) {
			event.preventDefault();
			moveFocus(index - 1);
		}

		if (event.key === 'ArrowRight' && index < otpDigits.length - 1) {
			event.preventDefault();
			moveFocus(index + 1);
		}
	}

	function handleOtpPaste(event: ClipboardEvent) {
		event.preventDefault();
		const pastedDigits = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';

		for (let index = 0; index < otpDigits.length; index += 1) {
			otpDigits[index] = pastedDigits[index] ?? '';
		}

		const nextIndex = Math.min(pastedDigits.length, otpDigits.length - 1);
		moveFocus(nextIndex);
	}

	function goToOtpStep() {
		attemptedContinue = true;
		const { pwdError, confirmError } = computePasswordErrors(password, confirmPassword);
		if (pwdError || confirmError) return;
		currentStep = 'otp';
		resendSeconds = 30;
	}

	function resendOtp() {
		if (resendSeconds > 0) return;
		otpDigits = ['', '', '', '', '', ''];
		resendSeconds = 30;
		moveFocus(0);
	}

	onMount(() => {
		theme.init();
	});

	const handleEnhance: SubmitFunction = () => {
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'redirect') {
				const redirectUrl = new URL(result.location, window.location.origin);
				const message = redirectUrl.searchParams.get('message');
				console.log(message);
				toast.success(message ?? 'Reset instructions sent', {
					description: 'Your password has been reset. Please sign in.',
					position: 'top-right'
				});
			}
			await update();
		};
	};
</script>

<!-- Right Panel -->
<div class="relative flex w-[50%] flex-1 flex-col bg-background">
	<main class="flex flex-1 items-center justify-center px-10">
		<div class="w-full max-w-md flex flex-col gap-17">
			<div class="">
				<CompanyLogoLight width="200" class="h-auto" />
			</div>

			{#if currentStep === 'password'}
				<div class="flex flex-col gap-10">
					<div class="flex flex-col gap-2">
						<h1 class="text-3xl font-semibold tracking-tight text-gray-700">Reset Password</h1>
						<p class="text-base text-gray-700">Enter your login details to reset your password</p>
					</div>

					<form
						class="flex flex-col gap-6"
						onsubmit={(e) => {
							e.preventDefault();
							goToOtpStep();
						}}
					>
						<div class="flex flex-col gap-3">
							<label class="text-lg font-normal text-gray-700" for="password">Password</label>
							<div class="relative">
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter password"
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

						<Button type="submit" class="h-11 w-full text-base">Reset Password</Button>
					</form>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-10 text-center">
					<!-- <div class="flex flex-col items-center gap-4"> -->
					<div class="flex flex-col gap-2">
						<h1 class="text-4xl font-semibold tracking-tight text-gray-700">Verify your account</h1>
						<p class="text-base text-gray-700">
							Enter the code sent to your registered email address
						</p>
					</div>
					<!-- </div> -->

					<form
						class="flex w-full flex-col items-center gap-10"
						method="POST"
						use:enhance={handleEnhance}
					>
						<input type="hidden" name="userEmail" value={userEmail} />
						<input type="hidden" name="newPassword" value={password} />
						<input type="hidden" name="confirmPassword" value={confirmPassword} />
						<input type="hidden" name="confirmationCode" value={confirmationCode} />

						{#if form?.error}
							<p class="text-sm text-destructive">{form.error}</p>
						{/if}

						<div class="flex w-full justify-center gap-4">
							{#each otpDigits as digit, index (index)}
								<input
									bind:this={otpRefs[index]}
									type="text"
									inputmode="numeric"
									autocomplete="one-time-code"
									maxlength="1"
									value={digit}
									class="h-20 w-20 rounded-2xl border border-input bg-background text-center text-3xl text-foreground outline-none transition-colors focus:border-ring"
									oninput={(event) => handleOtpInput(index, event)}
									onkeydown={(event) => handleOtpKeydown(index, event)}
									onpaste={handleOtpPaste}
									aria-label={`OTP digit ${index + 1}`}
								/>
							{/each}
						</div>

						<div class="flex flex-col items-center gap-6">
							<button
								type="button"
								class="text-base text-gray-700 underline underline-offset-4 disabled:opacity-50"
								disabled={resendSeconds > 0}
								onclick={resendOtp}
							>
								{#if resendSeconds > 0}
									Resend the code in {resendSeconds}s
								{:else}
									Resend the code
								{/if}
							</button>

							<div class="items-center">
								<Button
									type="submit"
									class="h-11 px-12  text-base"
									disabled={!canSubmitOtp || submitting}
								>
									{submitting ? 'Verifying…' : 'Verify OTP'}
								</Button>
							</div>
						</div>
					</form>
				</div>
			{/if}
		</div>
	</main>

	<footer class="px-10 pb-8 text-center text-sm text-muted-foreground">
		<a href={resolve('/login')} class="underline underline-offset-4 hover:text-foreground">
			Terms and Conditions
		</a>
		<span class="mx-3 text-border" aria-hidden="true">|</span>
		<a href={resolve('/login')} class="underline underline-offset-4 hover:text-foreground">
			Privacy Policy
		</a>
	</footer>
</div>
