<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Input, Button } from '$lib/components/reusable';
	import AuthFormShell from '$lib/components/auth/auth-form-shell.svelte';
	import { Eye, EyeOff } from '$lib/assets/icons/index';

	let { data, form } = $props();

	let newPassword = $state('');
	let confirmPassword = $state('');
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let submitting = $state(false);

	const canSubmit = $derived(
		newPassword.trim().length > 0 &&
			confirmPassword.trim().length > 0 &&
			newPassword === confirmPassword
	);

	const onEnhance: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update({ reset: false });
		};
	};
</script>

<AuthFormShell title="Reset Password">
	{#snippet subtitle()}
		Set a new password for <span class="font-medium text-foreground">{data.userEmail}</span>
	{/snippet}

	{#if form?.message}
		<p class="text-sm text-destructive" role="alert">{form.message}</p>
	{/if}

	<form method="POST" class="flex flex-col gap-3" use:enhance={onEnhance}>
		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium text-foreground" for="new-password"> New Password </label>
			<div class="relative">
				<Input
					id="new-password"
					name="newPassword"
					type={showNewPassword ? 'text' : 'password'}
					placeholder="Enter Password"
					bind:value={newPassword}
					autocomplete="new-password"
					required
					disabled={submitting}
					class="h-9 pr-10 text-sm!"
				/>
				<button
					type="button"
					onclick={() => (showNewPassword = !showNewPassword)}
					class="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
					aria-label={showNewPassword ? 'Hide password' : 'Show password'}
				>
					{#if showNewPassword}
						<EyeOff class="h-4 w-4" />
					{:else}
						<Eye class="h-4 w-4" />
					{/if}
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium text-foreground" for="confirm-password">
				Confirm New Password
			</label>
			<div class="relative">
				<Input
					id="confirm-password"
					name="confirmPassword"
					type={showConfirmPassword ? 'text' : 'password'}
					placeholder="Enter confirm password"
					bind:value={confirmPassword}
					autocomplete="new-password"
					required
					disabled={submitting}
					class="h-9 pr-10 text-sm!"
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
		</div>

		<Button type="submit" class="h-9 min-h-9 w-full text-sm" disabled={!canSubmit || submitting}>
			{submitting ? 'Resetting…' : 'Reset Password'}
		</Button>
	</form>
</AuthFormShell>
