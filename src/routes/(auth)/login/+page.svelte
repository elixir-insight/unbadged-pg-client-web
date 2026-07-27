<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button } from '$lib/components/ui/button';
	// import { Chip } from '$lib/components/ui/badge';
	import { Input, Modal } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { Eye, EyeOff } from '$lib/assets/icons/index';

	let { form } = $props();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let forceConfirmOpen = $state(false);
	let sessionNotice = $state<string | null>(null);
	let sessionNoticeKind = $state<'error' | 'success'>('error');

	$effect(() => {
		if (form?.userEmail) email = form.userEmail.trim().toLowerCase();
		// Only open when the action explicitly flagged the session-already-exists case.
		forceConfirmOpen = form?.requiresForce === true;
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

		// Drop ?reason= so refresh / revisiting login doesn't keep the banner.
		if (reason) {
			void goto(resolve('/login'), { replaceState: true, noScroll: true, keepFocus: true });
		}
	});

	function trimCredentials() {
		email = email.trim().toLowerCase();
		password = password.trim();
	}

	const onEnhance: SubmitFunction = ({ formData }) => {
		trimCredentials();
		formData.set('userEmail', email);
		formData.set('password', password);
		submitting = true;
		// Drop the session-expired banner so a login failure doesn't stack two errors.
		sessionNotice = null;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'failure' && result.data?.requiresForce === true) {
				forceConfirmOpen = true;
				await update({ reset: false });
				return;
			}
			forceConfirmOpen = false;
			await update({ reset: false });
		};
	};
</script>

<main class="flex min-h-0 flex-1 flex-col overflow-hidden px-5 sm:px-8 lg:px-10">
	<!-- Flexible spacers center the form and collapse on short viewports so nothing scrolls. -->
	<div class="min-h-0 flex-1" aria-hidden="true"></div>
	<div class="mx-auto w-full max-w-md shrink-0 py-2 sm:py-4">
		<div class="flex w-full flex-col gap-6 sm:gap-8 [@media(max-height:700px)]:gap-4">
			<div>
				<CompanyLogoLight width="160" class="h-auto w-36 sm:w-40" />
			</div>

			<div class="flex flex-col gap-5 sm:gap-6 [@media(max-height:700px)]:gap-4">
				<div class="flex flex-col gap-1.5 sm:gap-2">
					<h1 class="text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">Sign in</h1>
					<p class="text-sm text-gray-700 sm:text-base">
						Enter your login details to access your dashboard
					</p>
				</div>

				{#if sessionNotice && !(form?.message && !form.requiresForce)}
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

				<form method="POST" class="flex flex-col gap-4 sm:gap-5" use:enhance={onEnhance}>
					<input type="hidden" name="force" value="false" />

					<div class="flex flex-col gap-2">
						<label class="text-base font-normal text-gray-700 sm:text-lg" for="email">
							Email
						</label>
						<Input
							id="email"
							name="userEmail"
							type="email"
							placeholder="name@company.com"
							bind:value={email}
							autocomplete="email"
							required
							disabled={submitting}
							class="h-11 text-base!"
							onblur={() => (email = email.trim().toLowerCase())}
						/>
					</div>

					<div class="flex flex-col gap-2">
						<label class="text-base font-normal text-gray-700 sm:text-lg" for="password">
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

					<Button
						type="submit"
						class="h-11 min-h-11 w-full shrink-0 text-base"
						disabled={submitting}
					>
						{submitting ? 'Signing in…' : 'Login'}
					</Button>
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
		<a href={resolve('/')} class="underline underline-offset-4 hover:text-foreground">
			Terms and Conditions
		</a>
		<span class="mx-2 text-border sm:mx-3" aria-hidden="true">|</span>
		<a href={resolve('/')} class="underline underline-offset-4 hover:text-foreground">
			Privacy Policy
		</a>
	</p>
	<p class="text-xs text-muted-foreground sm:text-sm">
		© 2026 ElixirPay • Secure Payment Gateway Platform
	</p>
</footer>

<Modal
	bind:open={forceConfirmOpen}
	title="Session already active"
	description="You are already signed in on another device or browser. Signing in here will sign you out of your current session. Do you wish to continue?"
>
	{#snippet footer()}
		<form
			method="POST"
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
