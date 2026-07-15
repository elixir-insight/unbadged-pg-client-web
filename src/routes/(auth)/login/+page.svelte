<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button } from '$lib/components/ui/button';
	import { Input, Modal } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { theme } from '$lib/stores/theme.svelte';
	import { Eye, EyeOff } from '$lib/assets/icons/index';

	let { form } = $props();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let forceConfirmOpen = $state(false);
	let sessionNotice = $state<string | null>(null);

	$effect(() => {
		if (form?.userEmail) email = form.userEmail;
		// Only open when the action explicitly flagged the session-already-exists case.
		forceConfirmOpen = form?.requiresForce === true;
	});

	onMount(() => {
		theme.init();

		const reason = new URL(window.location.href).searchParams.get('reason');
		if (reason === 'session-inactive') {
			sessionNotice = 'Your session is no longer active. Please sign in again.';
		} else if (reason === 'session-expired') {
			sessionNotice = 'Your session expired. Please sign in again.';
		}

		// Drop ?reason= so refresh / revisiting login doesn't keep the banner.
		if (reason) {
			void goto(resolve('/login'), { replaceState: true, noScroll: true, keepFocus: true });
		}
	});

	const onEnhance: SubmitFunction = () => {
		submitting = true;
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

<div class="flex h-dvh w-full overflow-hidden p-0 lg:gap-3 lg:p-4">
	<!-- Left Panel — desktop / large tablet only -->
	<div class="relative hidden h-full w-1/2 overflow-hidden rounded-2xl shadow lg:block">
		<video
			src="/video/LoginVid.mp4"
			class="absolute inset-0 h-full w-full object-cover"
			autoplay
			muted
			loop
			playsinline
			aria-hidden="true"
		></video>
	</div>

	<!-- Right Panel -->
	<div class="relative flex min-h-0 w-full flex-1 flex-col bg-background lg:w-1/2">
		<main
			class="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-5 py-8 sm:px-8 sm:py-10 lg:items-center lg:px-10 lg:py-0"
		>
			<div class="flex w-full max-w-md flex-col gap-10 sm:gap-14 lg:gap-17">
				<div>
					<CompanyLogoLight width="160" class="h-auto w-40 sm:w-[200px]" />
				</div>

				<div class="flex flex-col gap-8 sm:gap-10">
					<div class="flex flex-col gap-2">
						<h1 class="text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">Sign in</h1>
						<p class="text-sm text-gray-700 sm:text-base">
							Enter your login details to access your dashboard
						</p>
					</div>

					{#if sessionNotice}
						<p class="text-sm text-destructive" role="status">{sessionNotice}</p>
					{/if}

					{#if form?.message && !form.requiresForce}
						<p class="text-sm text-destructive" role="alert">{form.message}</p>
					{/if}

					<form method="POST" class="flex flex-col gap-5 sm:gap-6" use:enhance={onEnhance}>
						<input type="hidden" name="force" value="false" />

						<div class="flex flex-col gap-2 sm:gap-3">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="email">
								Email
							</label>
							<Input
								id="email"
								name="userEmail"
								type="email"
								placeholder="Enter the email"
								bind:value={email}
								autocomplete="email"
								required
								disabled={submitting}
								class="h-11 text-base!"
							/>
						</div>

						<div class="flex flex-col gap-2 sm:gap-3">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="password">
								Password
							</label>
							<div class="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter the password"
									bind:value={password}
									autocomplete="current-password"
									required
									disabled={submitting}
									class="h-11 pr-11 text-base!"
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

						<Button type="submit" class="h-11 w-full text-base" disabled={submitting}>
							{submitting ? 'Signing in…' : 'Login'}
						</Button>
					</form>
				</div>
			</div>
		</main>

		<footer
			class="shrink-0 px-5 py-6 text-center text-xs text-muted-foreground sm:px-8 sm:text-sm lg:px-10 lg:pt-0 lg:pb-15"
		>
			<a href={resolve('/')} class="underline underline-offset-4 hover:text-foreground">
				Terms and Conditions
			</a>
			<span class="mx-2 text-border sm:mx-3" aria-hidden="true">|</span>
			<a href={resolve('/')} class="underline underline-offset-4 hover:text-foreground">
				Privacy Policy
			</a>
		</footer>
	</div>
</div>

<Modal
	bind:open={forceConfirmOpen}
	title="Session already active"
	description="Another session for this account is already signed in. Continue here? This will sign out the other session."
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
