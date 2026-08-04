<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Circle, CircleCheck, Eye, EyeOff } from '$lib/assets/icons';
	import { Button, Input, Modal, toast } from '$lib/components/reusable';
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		email?: string;
	}

	let { open = $bindable(false), email = '' }: Props = $props();

	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isSubmitting = $state(false);
	let showOldPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let formError = $state<string | null>(null);

	const emailUsername = $derived(email.split('@')[0]?.toLowerCase() ?? '');

	const requirements = $derived([
		{
			label: 'Be at least 12 characters long',
			met: newPassword.length >= 12
		},
		{
			label: 'Include at least 1 uppercase letter',
			met: /[A-Z]/.test(newPassword)
		},
		{
			label: 'Include at least 1 lowercase letter',
			met: /[a-z]/.test(newPassword)
		},
		{
			label: 'Include at least 1 number',
			met: /[0-9]/.test(newPassword)
		},
		{
			label: 'Include at least 1 special character',
			met: /[^A-Za-z0-9]/.test(newPassword)
		},
		{
			label: 'Not include your email username',
			met:
				newPassword.length > 0 &&
				(emailUsername.length === 0 || !newPassword.toLowerCase().includes(emailUsername))
		}
	]);

	const allRequirementsMet = $derived(requirements.every((requirement) => requirement.met));
	const passwordsMatch = $derived(
		newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword
	);
	const canSubmit = $derived(
		oldPassword.length > 0 && allRequirementsMet && passwordsMatch && !isSubmitting
	);

	$effect(() => {
		if (open) {
			oldPassword = '';
			newPassword = '';
			confirmPassword = '';
			isSubmitting = false;
			showOldPassword = false;
			showNewPassword = false;
			showConfirmPassword = false;
			formError = null;
		}
	});

	const onSubmit: SubmitFunction = ({ cancel }) => {
		if (!canSubmit) {
			cancel();
			return;
		}

		isSubmitting = true;
		formError = null;

		return async ({ result }) => {
			isSubmitting = false;

			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}

			if (result.type === 'success') {
				const message =
					typeof result.data?.message === 'string'
						? result.data.message
						: 'Password Reset Successfully';
				toast.success(message);
				open = false;
				return;
			}

			if (result.type === 'failure') {
				const message =
					typeof result.data?.message === 'string'
						? result.data.message
						: 'Could not change password. Please try again.';
				formError = message;
				toast.error(message);
				return;
			}

			formError = 'Could not change password. Please try again.';
			toast.error(formError);
		};
	};
</script>

<Modal bind:open title="Change Password">
	<form method="POST" action="?/resetPassword" class="flex flex-col gap-5" use:enhance={onSubmit}>
		{#if formError}
			<p class="text-sm text-destructive" role="alert">{formError}</p>
		{/if}

		<div class="flex flex-col gap-1.5">
			<label for="old-password" class="text-sm font-medium text-foreground">
				Old Password <span class="text-destructive">*</span>
			</label>
			<div class="relative">
				<Input
					id="old-password"
					name="oldPassword"
					type={showOldPassword ? 'text' : 'password'}
					bind:value={oldPassword}
					placeholder="Old Password"
					autocomplete="current-password"
					class="pr-10"
				/>
				<button
					type="button"
					onclick={() => (showOldPassword = !showOldPassword)}
					class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					aria-label={showOldPassword ? 'Hide old password' : 'Show old password'}
				>
					{#if showOldPassword}
						<EyeOff class="size-4" />
					{:else}
						<Eye class="size-4" />
					{/if}
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="new-password" class="text-sm font-medium text-foreground">
				New Password <span class="text-destructive">*</span>
			</label>
			<div class="relative">
				<Input
					id="new-password"
					name="newPassword"
					type={showNewPassword ? 'text' : 'password'}
					bind:value={newPassword}
					placeholder="New Password"
					autocomplete="new-password"
					class="pr-10"
				/>
				<button
					type="button"
					onclick={() => (showNewPassword = !showNewPassword)}
					class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
				>
					{#if showNewPassword}
						<EyeOff class="size-4" />
					{:else}
						<Eye class="size-4" />
					{/if}
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="confirm-password" class="text-sm font-medium text-foreground">
				Confirm New Password <span class="text-destructive">*</span>
			</label>
			<div class="relative">
				<Input
					id="confirm-password"
					name="confirmPassword"
					type={showConfirmPassword ? 'text' : 'password'}
					bind:value={confirmPassword}
					placeholder="Confirm New Password"
					autocomplete="new-password"
					class="pr-10"
				/>
				<button
					type="button"
					onclick={() => (showConfirmPassword = !showConfirmPassword)}
					class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
				>
					{#if showConfirmPassword}
						<EyeOff class="size-4" />
					{:else}
						<Eye class="size-4" />
					{/if}
				</button>
			</div>
		</div>

		<div class="space-y-3">
			<p class="text-sm text-muted-foreground">For increased security your password must</p>
			<ul class="space-y-2.5">
				{#each requirements as requirement (requirement.label)}
					<li class="flex items-start gap-2.5 text-sm">
						{#if requirement.met}
							<CircleCheck class="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
						{:else}
							<Circle class="mt-0.5 size-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
						{/if}
						<span class={cn(requirement.met ? 'text-foreground' : 'text-muted-foreground')}>
							{requirement.label}
						</span>
					</li>
				{/each}
			</ul>
		</div>

		<Button type="submit" class="w-full" size="lg" disabled={!canSubmit}>
			{#if isSubmitting}
				<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
				></span>
				Changing…
			{:else}
				Change Password
			{/if}
		</Button>
	</form>
</Modal>
