<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox, Input } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { theme } from '$lib/stores/theme.svelte';
	import { Eye, EyeOff } from '$lib/assets/icons/index';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let showPassword = $state(false);

	onMount(() => {
		theme.init();
	});
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
			<div class="w-full max-w-md flex flex-col gap-17">
				<div class="">
					<CompanyLogoLight width="200" class="h-auto" />
				</div>

				<div class="flex flex-col gap-10">
					<div class="flex flex-col gap-2">
						<h1 class="text-3xl font-semibold tracking-tight text-gray-700">Sign in</h1>
						<p class="text-base text-gray-700">Enter your login details to access your dashboard</p>
					</div>

					<form class="flex flex-col gap-6" onsubmit={(e) => e.preventDefault()}>
						<div class="flex flex-col gap-3">
							<label class="text-lg font-normal text-gray-700" for="email">Email</label>
							<Input
								id="email"
								type="email"
								placeholder="Enter the email"
								bind:value={email}
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

						<Button type="submit" class="h-11 w-full text-base">Login</Button>
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
