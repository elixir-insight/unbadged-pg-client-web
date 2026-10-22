<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { OtpInput, toast } from '$lib/components/reusable';
	import AuthFormShell from '$lib/components/auth/auth-form-shell.svelte';
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

{#if verified}
	<AuthFormShell>
		<div class="flex flex-col items-center gap-3 py-8 text-center" role="status">
			<CircleCheck class="h-12 w-12 text-success" aria-hidden="true" />
			<h1 class="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
				Email verified
			</h1>
			<p class="text-sm text-muted-foreground">Taking you to sign in…</p>
		</div>
	</AuthFormShell>
{:else}
	<AuthFormShell title="Confirm your email">
		{#snippet subtitle()}
			Enter the 6-digit code we sent to
			<span class="font-medium text-foreground">{userEmail}</span>.
		{/snippet}

		<form
			method="POST"
			action="?/confirm"
			class="flex flex-col gap-3"
			novalidate
			use:enhance={onEnhance}
		>
			<div class="flex flex-col gap-2">
				<label class="text-sm font-medium text-foreground" for="confirmationCode">
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
				class="h-9 min-h-9 w-full shrink-0 text-sm"
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
					<p class="text-center text-xs text-primary sm:text-sm" role="status">{resendNotice}</p>
				{/if}
				{#if resendError}
					<p class="text-center text-xs text-destructive sm:text-sm" role="alert">{resendError}</p>
				{/if}
			</div>

			<p class="text-center text-xs text-muted-foreground sm:text-sm">
				Wrong email?
				<a href={resolve('/sign-up')} class="underline underline-offset-4 hover:text-foreground">
					Go back and edit it.
				</a>
			</p>
		</form>
	</AuthFormShell>
{/if}
