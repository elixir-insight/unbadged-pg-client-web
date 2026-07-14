<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Input, Button } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import AuthCardPanel from '$lib/components/auth/auth-card-panel.svelte';
	import { theme } from '$lib/stores/theme.svelte';

	let email = $state('');

	const canSubmit = $derived(email.trim().length > 0);

	onMount(() => {
		theme.init();
	});
</script>

<div class="flex h-screen w-full gap-3 overflow-hidden p-4">
	<AuthCardPanel />

	<!-- Right Panel -->
	<div class="relative flex w-[50%] flex-1 flex-col bg-background">
		<main class="flex flex-1 items-center justify-center px-10">
			<div class="w-full max-w-md flex flex-col gap-17">
				<div class="">
					<CompanyLogoLight width="200" class="h-auto" />
				</div>

				<div class="flex flex-col gap-10">
					<div class="flex flex-col gap-2">
						<h1 class="text-3xl font-semibold tracking-tight text-gray-700">Forgot Password</h1>
						<p class="text-base text-gray-700">No worries, we will send you reset instructions.</p>
					</div>

					<form
						class="flex flex-col gap-6"
						onsubmit={(e) => {
							e.preventDefault();
							if (!canSubmit) return;
							goto(resolve('/reset-password'));
						}}
					>
						<div class="flex flex-col gap-3">
							<label class="text-lg font-normal text-gray-700" for="email">Email</label>
							<Input
								id="email"
								type="email"
								placeholder="Enter email"
								bind:value={email}
								autocomplete="email"
								class="h-11 text-base!"
							/>
						</div>

						<Button type="submit" class="h-11 w-full text-base" disabled={!canSubmit}>
							Reset password
						</Button>
					</form>
				</div>
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
</div>
