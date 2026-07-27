<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Input, Button } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
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

<main class="flex flex-1 items-center justify-center px-10">
	<div class="flex w-full max-w-md flex-col gap-17">
		<div>
			<CompanyLogoLight width="200" class="h-auto" />
		</div>

		<div class="flex flex-col gap-10">
			<div class="flex flex-col gap-2">
				<h1 class="text-3xl font-semibold tracking-tight text-gray-700">Reset Password</h1>
				<p class="text-base text-gray-700">
					Set a new password for <span class="font-medium">{data.userEmail}</span>
				</p>
			</div>

			{#if form?.message}
				<p class="text-sm text-destructive" role="alert">{form.message}</p>
			{/if}

			<form method="POST" class="flex flex-col gap-6" use:enhance={onEnhance}>
				<div class="flex flex-col gap-3">
					<label class="text-lg font-normal text-gray-700" for="new-password"> New Password </label>
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
							class="h-11 pr-11 text-base!"
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

				<div class="flex flex-col gap-3">
					<label class="text-lg font-normal text-gray-700" for="confirm-password">
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
							class="h-11 pr-11 text-base!"
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

				<Button type="submit" class="h-11 w-full text-base" disabled={!canSubmit || submitting}>
					{submitting ? 'Resetting…' : 'Reset Password'}
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
