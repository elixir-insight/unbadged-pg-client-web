<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Button, Chip } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import { IdCardIcon, MailIcon, PhoneIcon, Shield, ShieldCheck, User } from '$lib/assets/icons';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import { formatPhoneDisplay } from '$lib/stores/user-management/user-mapper';
	import type { Component } from 'svelte';

	onMount(() => {
		if (!createUserFormStore.isValid) {
			goto(resolve('/merchant/user-management/create-user'));
		}
	});

	function handleCreate() {
		createUserFormStore.reset();
		goto(resolve('/merchant/user-management'));
	}

	type ContactField = {
		label: string;
		value: string;
		subtitle?: string;
		Icon: Component;
	};

	const contactFields = $derived.by((): ContactField[] => [
		{ label: 'Email ID', value: createUserFormStore.email, Icon: MailIcon },
		{
			label: 'Mobile Number',
			value: formatPhoneDisplay(createUserFormStore.mobileNumber),
			Icon: PhoneIcon
		},
		{ label: 'Employee ID', value: createUserFormStore.employeeId || '—', Icon: IdCardIcon },
		{
			label: 'Reporting To',
			value: createUserFormStore.reportingManagerName || '—',
			subtitle: createUserFormStore.reportingManagerName
				? [
						createUserFormStore.reportingManagerEmployeeId,
						createUserFormStore.reportingManagerEmail
					]
						.filter(Boolean)
						.join(' · ')
				: undefined,
			Icon: User
		}
	]);
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Preview User</h1>
			<p class="mt-1 text-sm text-muted-foreground">Review the details before creating the user</p>
		</div>
	</div>

	<div class="space-y-6 rounded-xl border p-8 shadow">
		<div class="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
			<div class="flex flex-wrap items-center gap-4">
				<div
					class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow"
				>
					{createUserFormStore.initials}
				</div>

				<div class="min-w-0 flex-1">
					<h2 class="text-lg font-semibold text-foreground">{createUserFormStore.fullName}</h2>
					<p class="mt-0.5 truncate text-sm text-primary">{createUserFormStore.email}</p>

					<div class="mt-3 flex flex-wrap items-center gap-2">
						{#if createUserFormStore.employeeId}
							<Chip variant="outline" class="gap-1.5 bg-background/80">
								<IdCardIcon class="h-3.5 w-3.5" />
								{createUserFormStore.employeeId}
							</Chip>
						{/if}
						<Chip variant="outline" class="gap-1.5 bg-background/80">
							<Shield class="h-3.5 w-3.5" />
							{createUserFormStore.selectedRoleCount}
							{createUserFormStore.selectedRoleCount === 1 ? 'Role' : 'Roles'}
						</Chip>
					</div>
				</div>
			</div>
		</div>

		<div class="space-y-4">
			<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				Contact Information
			</h3>

			<div class="grid gap-4 sm:grid-cols-2">
				{#each contactFields as field (field.label)}
					<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
						<div class="flex items-start gap-3">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
							>
								<field.Icon class="h-4 w-4" />
							</div>
							<div class="min-w-0">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									{field.label}
								</p>
								<p class="mt-1 truncate text-sm font-semibold text-foreground">{field.value}</p>
								{#if field.subtitle}
									<p class="mt-0.5 truncate text-xs text-muted-foreground">{field.subtitle}</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Shield class="h-4 w-4" />
				</div>
				<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Assigned Roles
				</h3>
				<Chip class="h-5 rounded-full px-2 text-xs">{createUserFormStore.selectedRoleCount}</Chip>
			</div>

			{#if createUserFormStore.selectedRoles.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each createUserFormStore.selectedRoles as role (role)}
						<Chip
							variant="outline"
							class={cn('gap-1.5 border-border bg-background text-sm text-foreground')}
						>
							<ShieldCheck class="h-3.5 w-3.5" />
							{role}
						</Chip>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">No roles assigned.</p>
			{/if}
		</div>
	</div>

	<div class="flex justify-end gap-2 pt-2">
		<Button onclick={handleCreate}>Create User</Button>
	</div>
</div>
