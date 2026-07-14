<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox, Input, Modal } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { theme } from '$lib/stores/theme.svelte';
	import { Eye, EyeOff } from '$lib/assets/icons/index';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let showPassword = $state(false);
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let forceConfirmOpen = $state(false);

	onMount(() => {
		theme.init();
	});

	function parseRedirectTo(body: unknown): '/merchant' | '/partner' | '/management' {
		if (
			body &&
			typeof body === 'object' &&
			'redirectTo' in body &&
			(body.redirectTo === '/merchant' ||
				body.redirectTo === '/partner' ||
				body.redirectTo === '/management')
		) {
			return body.redirectTo;
		}
		return '/merchant';
	}

	function parseErrorBody(body: unknown): {
		message: string;
		requiresForce: boolean;
	} {
		const message =
			body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
				? body.message
				: 'Invalid email or password.';
		const requiresForce =
			body !== null &&
			typeof body === 'object' &&
			'requiresForce' in body &&
			body.requiresForce === true;
		return { message, requiresForce };
	}

	async function signIn(force: boolean) {
		if (submitting) return;

		errorMessage = null;
		submitting = true;

		try {
			const res = await fetch(resolve('/api/auth/sign-in'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userEmail: email, password, force })
			});

			const body = await res.json().catch(() => null);

			if (!res.ok) {
				const { message, requiresForce } = parseErrorBody(body);
				if (requiresForce) {
					forceConfirmOpen = true;
					return;
				}
				errorMessage = message;
				return;
			}

			await goto(resolve(parseRedirectTo(body)));
		} catch {
			errorMessage = 'Unable to sign in. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		await signIn(false);
	}

	async function handleForceConfirm() {
		forceConfirmOpen = false;
		await signIn(true);
	}
</script>

<div class="flex h-screen w-full gap-3 overflow-hidden p-4">
	<!-- Left Panel -->
	<div class="relative h-full w-[50%] overflow-hidden rounded-2xl shadow">
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
	<div class="relative flex w-[50%] flex-1 flex-col bg-background">
		<main class="flex flex-1 items-center justify-center px-10">
			<div class="flex w-full max-w-md flex-col gap-17">
				<div class="">
					<CompanyLogoLight width="200" class="h-auto" />
				</div>

				<div class="flex flex-col gap-10">
					<div class="flex flex-col gap-2">
						<h1 class="text-3xl font-semibold tracking-tight text-gray-700">Sign in</h1>
						<p class="text-base text-gray-700">Enter your login details to access your dashboard</p>
					</div>

					{#if errorMessage}
						<p class="text-sm text-destructive" role="alert">{errorMessage}</p>
					{/if}

					<form class="flex flex-col gap-6" onsubmit={handleSubmit}>
						<div class="flex flex-col gap-3">
							<label class="text-lg font-normal text-gray-700" for="email">Email</label>
							<Input
								id="email"
								type="email"
								placeholder="Enter the email"
								bind:value={email}
								autocomplete="email"
								disabled={submitting}
								class="h-11 text-base!"
							/>
						</div>

						<div class="flex flex-col gap-3">
							<label class="text-lg font-normal text-gray-700" for="password">Password</label>
							<div class="relative">
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter the password"
									bind:value={password}
									autocomplete="current-password"
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

						<div class="flex items-center justify-between">
							<Checkbox
								id="remember"
								label="Remember me"
								bind:checked={rememberMe}
								class="items-center **:data-[slot=checkbox]:mt-0"
							/>
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

		<footer class="px-10 pb-15 text-center text-sm text-muted-foreground">
			<a href={resolve('/')} class="underline underline-offset-4 hover:text-foreground">
				Terms and Conditions
			</a>
			<span class="mx-3 text-border" aria-hidden="true">|</span>
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
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" class="w-full sm:w-auto" onclick={() => (forceConfirmOpen = false)}>
				Cancel
			</Button>
			<Button class="w-full sm:w-auto" onclick={handleForceConfirm} disabled={submitting}>
				{submitting ? 'Signing in…' : 'Continue'}
			</Button>
		</div>
	{/snippet}
</Modal>
