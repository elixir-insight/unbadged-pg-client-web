<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input, Modal } from '$lib/components/reusable';
	import AuthFormShell from '$lib/components/auth/auth-form-shell.svelte';
	import { Eye, EyeOff } from '$lib/assets/icons/index';
	import { branding } from '$lib/branding';

	let { data, form }: PageProps = $props();

	type MfaChallengeView = {
		userEmail: string;
		challengeName: 'EMAIL_OTP' | 'SMS_MFA';
		challengeDestination: string;
		challengeExpiresIn: number;
	};

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let verifyingMfa = $state(false);
	let forceConfirmOpen = $state(false);
	let sessionNotice = $state<string | null>(null);
	let sessionNoticeKind = $state<'error' | 'success'>('error');
	let mfaCode = $state('');
	let mfaOtpError = $state('');
	let mfaOtpInputRef = $state<HTMLInputElement | null>(null);
	let mfaExpiresIn = $state(0);
	let mfaChallenge = $state<MfaChallengeView | null>(null);

	const showMfaStep = $derived(mfaChallenge !== null);
	const canSubmitMfa = $derived(/^\d{6}$/.test(mfaCode) && mfaExpiresIn > 0);
	const mfaChannelLabel = $derived(
		mfaChallenge?.challengeName === 'SMS_MFA' ? 'phone number' : 'email'
	);
	const mfaDestination = $derived(mfaChallenge?.challengeDestination ?? '');

	function applyMfaChallenge(challenge: MfaChallengeView | null | undefined) {
		if (!challenge) {
			mfaChallenge = null;
			mfaExpiresIn = 0;
			return;
		}
		mfaChallenge = challenge;
		mfaExpiresIn = Math.max(0, challenge.challengeExpiresIn);
		email = challenge.userEmail;
	}

	$effect(() => {
		if (form?.userEmail) email = form.userEmail.trim().toLowerCase();
		forceConfirmOpen = form?.requiresForce === true;

		if (form && 'mfaRestart' in form && form.mfaRestart) {
			applyMfaChallenge(null);
			mfaCode = '';
			mfaOtpError = '';
			if (form.message) {
				sessionNotice = form.message;
				sessionNoticeKind = 'error';
			}
			return;
		}

		if (form && 'mfaCancelled' in form && form.mfaCancelled) {
			applyMfaChallenge(null);
			mfaCode = '';
			mfaOtpError = '';
			password = '';
			return;
		}

		if (form && 'mfaRequired' in form && form.mfaRequired && form.mfaChallenge) {
			applyMfaChallenge(form.mfaChallenge);
			mfaCode = '';
			mfaOtpError = '';
			return;
		}

		if (form && 'mfaInvalidCode' in form && form.mfaInvalidCode && form.mfaChallenge) {
			if (!mfaChallenge) applyMfaChallenge(form.mfaChallenge);
			if (form.message) mfaOtpError = form.message;
			return;
		}

		if (!mfaChallenge && data.mfaChallenge) {
			applyMfaChallenge(data.mfaChallenge);
		}
	});

	$effect(() => {
		if (!showMfaStep || mfaExpiresIn <= 0) return;
		const timerId = setInterval(() => {
			mfaExpiresIn = Math.max(0, mfaExpiresIn - 1);
		}, 1000);
		return () => clearInterval(timerId);
	});

	onMount(() => {
		const reason = new URL(window.location.href).searchParams.get('reason');
		if (reason === 'session-inactive') {
			sessionNotice = 'Your session is no longer active. Please sign in again.';
		} else if (reason === 'session-expired') {
			sessionNotice = 'Your session expired. Please sign in again.';
		} else if (reason === 'password-updated') {
			sessionNotice = 'Password updated. Sign in with your new password.';
			sessionNoticeKind = 'success';
		} else if (reason === 'challenge-expired') {
			sessionNotice = 'Your password-reset session expired. Sign in again to get a new one.';
		}

		if (reason) {
			void goto(resolve('/login'), { replaceState: true, noScroll: true, keepFocus: true });
		}
	});

	function trimCredentials() {
		email = email.trim().toLowerCase();
		password = password.trim();
	}

	function handleMfaOtpInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		mfaCode = input.value.replace(/\D/g, '').slice(0, 6);
		input.value = mfaCode;
		if (mfaOtpError) mfaOtpError = '';
	}

	function formatExpiry(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	const onEnhance: SubmitFunction = ({ formData }) => {
		trimCredentials();
		formData.set('userEmail', email);
		formData.set('password', password);
		submitting = true;
		sessionNotice = null;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'failure' && result.data?.requiresForce === true) {
				forceConfirmOpen = true;
				await update({ reset: false });
				return;
			}
			forceConfirmOpen = false;
			if (result.type === 'success' && result.data && 'mfaRequired' in result.data) {
				mfaCode = '';
				mfaOtpError = '';
				queueMicrotask(() => mfaOtpInputRef?.focus());
			}
			await update({ reset: false });
		};
	};

	const onMfaEnhance: SubmitFunction = ({ cancel }) => {
		if (!canSubmitMfa) {
			mfaOtpError =
				mfaExpiresIn <= 0
					? 'Code expired. Sign in again to get a new one.'
					: 'Enter the 6-digit verification code.';
			cancel();
			return;
		}
		mfaOtpError = '';
		verifyingMfa = true;
		return async ({ result, update }) => {
			verifyingMfa = false;
			if (result.type === 'failure') {
				queueMicrotask(() => mfaOtpInputRef?.focus());
			}
			await update({ reset: false });
		};
	};

	const onCancelMfaEnhance: SubmitFunction = () => {
		return async ({ update }) => {
			mfaCode = '';
			mfaOtpError = '';
			password = '';
			await update({ reset: false });
		};
	};
</script>

{#if showMfaStep && mfaChallenge}
	<AuthFormShell title="Verify MFA" scrollable={false}>
		{#snippet subtitle()}
			Enter the 6-digit code sent to your {mfaChannelLabel}
			<span class="font-medium text-foreground">{mfaDestination}</span>
		{/snippet}

		{#if mfaExpiresIn > 0}
			<p class="text-sm text-muted-foreground" role="status">
				Code expires in {formatExpiry(mfaExpiresIn)}
			</p>
		{:else}
			<p class="text-sm text-destructive" role="alert">
				Code expired. Sign in again to receive a new code.
			</p>
		{/if}

		{#if mfaOtpError}
			<p class="text-sm text-destructive" role="alert">{mfaOtpError}</p>
		{:else if form?.message && 'mfaInvalidCode' in form && form.mfaInvalidCode}
			<p class="text-sm text-destructive" role="alert">{form.message}</p>
		{/if}

		{#if mfaExpiresIn > 0}
			<form
				method="POST"
				action="?/verifyMfa"
				class="flex flex-col gap-4 sm:gap-5"
				use:enhance={onMfaEnhance}
			>
				<div class="flex flex-col gap-2">
					<label class="text-base font-normal text-foreground sm:text-lg" for="mfa-code">
						Verification code
					</label>
					<Input
						id="mfa-code"
						bind:ref={mfaOtpInputRef}
						name="code"
						type="text"
						inputmode="numeric"
						autocomplete="one-time-code"
						placeholder="Enter verification code"
						value={mfaCode}
						maxlength={6}
						disabled={verifyingMfa}
						aria-invalid={mfaOtpError ? 'true' : undefined}
						class="h-11 w-full rounded-md border border-input bg-background text-center text-lg font-semibold tracking-[1em] text-foreground placeholder:font-normal placeholder:tracking-normal"
						oninput={handleMfaOtpInput}
					/>
				</div>

				<Button
					type="submit"
					class="h-11 min-h-11 w-full shrink-0 text-base"
					disabled={verifyingMfa || !canSubmitMfa}
				>
					{verifyingMfa ? 'Verifying…' : 'Verify'}
				</Button>
			</form>
		{/if}

		<form method="POST" action="?/cancelMfa" use:enhance={onCancelMfaEnhance}>
			<Button
				type="submit"
				variant="outline"
				class="h-11 min-h-11 w-full shrink-0 text-base"
				disabled={verifyingMfa}
			>
				{mfaExpiresIn > 0 ? 'Back to sign in' : 'Sign in again'}
			</Button>
		</form>
	</AuthFormShell>
{:else}
	<AuthFormShell
		title="Sign in"
		subtitle="Enter your login details to access your dashboard"
		scrollable={false}
	>
		{#if sessionNotice && !(form?.message && !form.requiresForce && !('mfaRestart' in form && form.mfaRestart))}
			<p
				class={sessionNoticeKind === 'success'
					? 'text-sm text-primary'
					: 'text-sm text-destructive'}
				role="status"
			>
				{sessionNotice}
			</p>
		{/if}

		{#if form?.message && !form.requiresForce}
			<p class="text-sm text-destructive" role="alert">{form.message}</p>
		{/if}

		<form
			method="POST"
			action="?/login"
			class="flex flex-col gap-4 sm:gap-5"
			use:enhance={onEnhance}
		>
			<input type="hidden" name="force" value="false" />

			<div class="flex flex-col gap-2">
				<label class="text-base font-normal text-foreground sm:text-lg" for="email">Email</label>
				<Input
					id="email"
					name="userEmail"
					type="email"
					placeholder={branding.emails.placeholder}
					bind:value={email}
					autocomplete="email"
					required
					disabled={submitting}
					class="h-11 text-base!"
					onblur={() => (email = email.trim().toLowerCase())}
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label class="text-base font-normal text-foreground sm:text-lg" for="password">
					Password
				</label>
				<div class="relative">
					<Input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						placeholder="Enter Password"
						bind:value={password}
						autocomplete="current-password"
						required
						disabled={submitting}
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
			</div>

			<div class="flex justify-end">
				<a
					href={resolve('/forgot-password')}
					class="text-sm font-medium text-primary hover:underline"
				>
					Forgot password?
				</a>
			</div>

			<Button type="submit" class="h-11 min-h-11 w-full shrink-0 text-base" disabled={submitting}>
				{submitting ? 'Signing in…' : 'Login'}
			</Button>
		</form>

		<p class="text-center text-sm text-muted-foreground">
			Don't have an account?
			<a href={resolve('/sign-up')} class="font-medium text-primary hover:underline">Sign up</a>
		</p>
	</AuthFormShell>
{/if}

<Modal
	bind:open={forceConfirmOpen}
	title="Session already active"
	description="You are already signed in on another device or browser. Signing in here will sign you out of your current session. Do you wish to continue?"
>
	{#snippet footer()}
		<form
			method="POST"
			action="?/login"
			class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
			use:enhance={onEnhance}
		>
			<input type="hidden" name="userEmail" value={email} />
			<input type="hidden" name="password" value={password} />
			<input type="hidden" name="force" value="true" />
			<Button
				type="button"
				variant="outline"
				class="w-full sm:w-auto"
				onclick={() => (forceConfirmOpen = false)}
				disabled={submitting}
			>
				Cancel
			</Button>
			<Button type="submit" class="w-full sm:w-auto" disabled={submitting}>
				{submitting ? 'Signing in…' : 'Continue'}
			</Button>
		</form>
	{/snippet}
</Modal>
