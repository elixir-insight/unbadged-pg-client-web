<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input, Button, toast } from '$lib/components/reusable';
	import AuthFormShell from '$lib/components/auth/auth-form-shell.svelte';
	import type { PageProps } from './$types';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { form }: PageProps = $props();

	let email = $state('');
	let submitting = $state(false);

	const canSubmit = $derived(email.trim().length > 0 && !submitting);

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

<AuthFormShell title="Forgot Password" subtitle="No worries, we will send you reset instructions.">
	<form class="flex flex-col gap-3" method="POST" use:enhance={handleEnhance}>
		{#if form?.error}
			<p class="text-sm text-destructive" role="alert">{form.error}</p>
		{/if}

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium text-foreground" for="userEmail">Email</label>
			<Input
				id="userEmail"
				name="userEmail"
				type="email"
				placeholder="name@company.com"
				bind:value={email}
				autocomplete="email"
				aria-invalid={form?.emailError ? 'true' : undefined}
				class="h-9 text-sm!"
				onblur={() => (email = email.trim().toLowerCase())}
			/>
			{#if form?.emailError}
				<p class="text-sm text-destructive" role="alert">{form.emailError}</p>
			{/if}
		</div>

		<Button type="submit" class="h-9 min-h-9 w-full text-sm" disabled={!canSubmit}>
			{submitting ? 'Sending…' : 'Reset password'}
		</Button>
	</form>
</AuthFormShell>
