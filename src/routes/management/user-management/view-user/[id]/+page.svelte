<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button, Chip, Tooltip } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import {
		ArrowLeft,
		Hash,
		IdCardIcon,
		MailIcon,
		Pencil,
		PhoneIcon,
		Shield,
		ShieldCheck,
		Trash2,
		User
	} from '$lib/assets/icons';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { userFormStore } from '$lib/stores/user-form.svelte';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import { formatPhoneDisplay } from '$lib/stores/user-management/user-mapper';
	import { fetchUserById } from '$lib/stores/user-management/users-api';
	import type { UserItem } from '$lib/stores/user-management/user-management';
	import type { Component } from 'svelte';

	let user = $state<UserItem | null>(userFormStore.viewUser);
	let loading = $state(false);

	const userId = $derived(page.params.id);

	const hasAssignedReports = $derived((user?.assignedUsersCount ?? 0) > 0);
	const deleteDisabledReason = $derived(
		hasAssignedReports
			? 'This user has people reporting to them. Reassign those users before deleting.'
			: null
	);

	$effect(() => {
		const id = userId;
		if (!id) {
			user = null;
			return;
		}

		let cancelled = false;
		loading = true;

		fetchUserById(id)
			.then((detail) => {
				if (cancelled) return;
				user = detail;
				if (detail) userFormStore.setViewUser(detail);
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});

		return () => {
			cancelled = true;
		};
	});

	function backToUsers() {
		goto(resolve('/management/user-management'));
	}

	function handleEdit() {
		if (!user) return;
		createUserFormStore.loadForEdit(user);
		goto(resolve('/management/user-management/edit-user/[id]', { id: user.id }));
	}

	function getInitials(name: string): string {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length >= 2) {
			return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
		}
		return (parts[0]?.charAt(0) ?? '?').toUpperCase();
	}

	function statusVariant(status: UserItem['status']): BadgeVariant {
		return status === 'Active' ? 'success' : 'info';
	}

	type ContactField = {
		label: string;
		value: string;
		subtitle?: string;
		Icon: Component;
	};

	function contactFields(currentUser: UserItem): ContactField[] {
		const reportingManager = currentUser.reportingManager;

		return [
			{ label: 'Email ID', value: currentUser.email, Icon: MailIcon },
			{
				label: 'Mobile Number',
				value: formatPhoneDisplay(currentUser.mobileNumber),
				Icon: PhoneIcon
			},
			{ label: 'Employee ID', value: currentUser.employeeId || '—', Icon: IdCardIcon },
			{
				label: 'Reporting To',
				value: reportingManager?.name ?? '—',
				subtitle: reportingManager
					? [reportingManager.employeeId, reportingManager.email].filter(Boolean).join(' · ')
					: undefined,
				Icon: User
			}
		];
	}
</script>

{#if loading && !user}
	<p class="py-12 text-center text-sm text-muted-foreground">Loading user details…</p>
{:else if user}
	{@const fields = contactFields(user)}
	<div class="space-y-6 w-full md:w-[75%] m-auto">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-foreground">User Details</h1>
				<p class="mt-1 text-sm text-muted-foreground">View and manage user information.</p>
			</div>
		</div>

		<div class="space-y-6 rounded-xl border p-8 shadow">
			<div class="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
				<div class="flex flex-wrap items-center gap-4">
					<div
						class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow"
					>
						{getInitials(user.name)}
					</div>

					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<h2 class="text-lg font-semibold text-foreground">{user.name}</h2>
							<Chip variant={statusVariant(user.status)}>{user.status}</Chip>
						</div>
						<p class="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>

						<div class="mt-3 flex flex-wrap items-center gap-2">
							{#if user.employeeId}
								<Chip variant="outline" class="gap-1.5 bg-background/80">
									<Hash class="h-3.5 w-3.5" />
									{user.employeeId}
								</Chip>
							{/if}
							<Chip variant="outline" class="gap-1.5 bg-background/80">
								<Shield class="h-3.5 w-3.5" />
								{user.roles.length}
								{user.roles.length === 1 ? 'Role' : 'Roles'}
							</Chip>
						</div>
					</div>
				</div>
			</div>

			<div class="space-y-4">
				<h3 class="text-xs font-semibold tracking-wide text-primary uppercase">
					Contact Information
				</h3>

				<div class="grid gap-4 sm:grid-cols-2">
					{#each fields as field (field.label)}
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
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<Shield class="h-4 w-4" />
					</div>
					<h3 class="text-xs font-semibold tracking-wide text-primary uppercase">Assigned Roles</h3>
					<Chip class="h-5 rounded-full px-2 text-xs">{user.roles.length}</Chip>
				</div>

				{#if user.roles.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each user.roles as role (role)}
							<Chip
								variant="outline"
								class={cn('gap-1.5 border-primary/30 bg-primary/5 text-foreground')}
							>
								<ShieldCheck class="h-3.5 w-3.5 text-primary" />
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
			{#if deleteDisabledReason}
				<Tooltip content={deleteDisabledReason}>
					<Button variant="destructive" class="gap-2" disabled>
						<Trash2 class="h-4 w-4" />
						Delete
					</Button>
				</Tooltip>
			{:else}
				<Button variant="destructive" class="gap-2" onclick={() => {}}>
					<Trash2 class="h-4 w-4" />
					Delete
				</Button>
			{/if}
			<Button variant="outline" class="gap-2" onclick={handleEdit}>
				<Pencil class="h-4 w-4" />
				Edit
			</Button>
		</div>
	</div>
{:else}
	<div class="space-y-4 py-12 text-center">
		<p class="text-sm text-muted-foreground">No user selected.</p>
		<Button variant="outline" class="gap-2" onclick={backToUsers}>
			<ArrowLeft class="h-4 w-4" />
			Back
		</Button>
	</div>
{/if}
