<script lang="ts">
	import { Circle, CircleCheck, Eye, EyeOff } from '$lib/assets/icons';
	import { Button, Input, Modal } from '$lib/components/reusable';
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		email?: string;
		onconfirm?: () => void | Promise<void>;
	}

	let { open = $bindable(false), email = '', onconfirm }: Props = $props();

	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isSubmitting = $state(false);
	let showOldPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);

	const emailUsername = $derived(email.split('@')[0]?.toLowerCase() ?? '');

	const requirements = $derived([
		{
			label: 'Be 8-15 characters long',
			met: newPassword.length >= 8 && newPassword.length <= 15
		},
		{
			label: 'Include at least 1 number',
			met: /\d/.test(newPassword)
		},
		{
			label: 'Include at least 1 letter',
			met: /[a-zA-Z]/.test(newPassword)
		},
		{
			label: 'Include at least 1 special character (e.g. @, $, !, %, *, #, ?, &)',
			met: /[@$!%*#?&]/.test(newPassword)
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
		}
	});

	async function handleSubmit() {
		if (!canSubmit) return;

		isSubmitting = true;
		await onconfirm?.();
		isSubmitting = false;
		open = false;
	}
</script>

<Modal bind:open title="Change Password">
	<form
		class="flex flex-col gap-5"
		onsubmit={(event) => {
			event.preventDefault();
			handleSubmit();
		}}
	>
		<div class="flex flex-col gap-1.5">
			<label for="old-password" class="text-sm font-medium text-foreground">
				Old Password <span class="text-destructive">*</span>
			</label>
			<div class="relative">
				<Input
					id="old-password"
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
