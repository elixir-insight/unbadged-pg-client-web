<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { Input, Button, toast } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { theme } from '$lib/stores/theme.svelte';
	import type { PageProps } from './$types';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { form }: PageProps = $props();

	let email = $state('');
	let submitting = $state(false);

	const canSubmit = $derived(email.trim().length > 0 && !submitting);

	onMount(() => {
		theme.init();
	});
	const handleEnhance: SubmitFunction = ({ formData }) => {
		email = email.trim().toLowerCase();
		formData.set('userEmail', email);
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'redirect') {
				const redirectUrl = new URL(result.location, window.location.origin);
				const message = redirectUrl.searchParams.get('message');
				toast.success(message ?? 'Password reset code sent successfully', {
					position: 'top-right'
				});
			}
			await update();
			if (form?.userEmail !== undefined) email = form.userEmail.trim().toLowerCase();
		};
	};
</script>

<!-- Right Panel -->
<main class="flex flex-1 items-center justify-center px-10">
	<div class="flex w-full max-w-md flex-col gap-17">
		<div class="">
			<CompanyLogoLight width="200" class="h-auto" />
		</div>

		<div class="flex flex-col gap-10">
			<div class="flex flex-col gap-2">
				<h1 class="text-3xl font-semibold tracking-tight text-gray-700">Forgot Password</h1>
				<p class="text-base text-gray-700">No worries, we will send you reset instructions.</p>
			</div>

			<form class="flex flex-col gap-6" method="POST" use:enhance={handleEnhance}>
				{#if form?.error}
					<p class="text-sm text-destructive">{form.error}</p>
				{/if}

				<div class="flex flex-col gap-3">
					<label class="text-lg font-normal text-gray-700" for="userEmail">Email</label>
					<Input
						id="userEmail"
						name="userEmail"
						// type="email"
						placeholder="name@company.com"
						bind:value={email}
						autocomplete="email"
						aria-invalid={form?.emailError ? 'true' : undefined}
						class="h-11 text-base!"
						onblur={() => (email = email.trim().toLowerCase())}
					/>
					{#if form?.emailError}
						<p class="text-sm text-destructive">{form.emailError}</p>
					{/if}
				</div>

				<Button type="submit" class="h-11 w-full text-base" disabled={!canSubmit}>
					{submitting ? 'Sending…' : 'Reset password'}
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
